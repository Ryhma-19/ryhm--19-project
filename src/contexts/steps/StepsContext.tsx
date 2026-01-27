import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Pedometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepsService } from '../../services/steps/stepsService';
import { BackgroundStepsService } from '../../services/steps/backgroundStepsService';
import { useAuth } from '../AuthContext';

// Step context data shape
interface StepsContextValue {
  steps: number;
  today: string;
  loading: boolean;
  dailyGoal: number;
  setDailyGoal: (goal: number) => Promise<void>;
  goalReached: boolean;
}

const StepsContext = createContext<StepsContextValue>({
  steps: 0,
  today: '',
  loading: true,
  dailyGoal: 8000,
  setDailyGoal: async () => {},
  goalReached: false,
});

// Hook to access steps state anywhere in the app
export const useSteps = () => useContext(StepsContext);

export const StepsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [steps, setSteps] = useState(0);
  const [today, setToday] = useState('');
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(8000);
  const [goalReached, setGoalReached] = useState(false);
  const { user } = useAuth();
  const goalNotificationSentRef = useRef(false); // Track if notification already sent today
  const pedometerBaseRef = useRef<number | null>(null); // Track base count from device when app starts
  const lastSessionStepsRef = useRef<number>(0); // Track last pedometer session reading to calculate delta

  // Request notification permissions on app startup
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
        }
      } catch (err) {
        console.error('Error requesting notification permissions:', err);
      }
    };
    requestPermissions();
  }, []);

  // Load steps from Firestore/local storage and start pedometer tracking
  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setToday(todayKey);
    goalNotificationSentRef.current = false; // Reset notification flag on new day

    let subscription: any;

    const init = async () => {
  // Request permission to access device pedometer
  const perm = await Pedometer.requestPermissionsAsync();
  console.log("Pedometer permission:", perm);

  if (!perm.granted) {
    console.log("Pedometer permission not granted");
    setLoading(false);
    return;
  }

  let savedSteps = 0;

  // Load steps from Firestore first (cloud is source of truth)
  if (user) {
    try {
      const remote = await StepsService.loadFromFirestore(user.id);
      if (remote && remote.date === todayKey) {
        savedSteps = remote.steps;
        setSteps(remote.steps);
        await StepsService.saveLocalSteps(remote.steps);
        console.log("Loaded from Firestore:", remote.steps);
      }
    } catch (err) {
      console.error("Error loading from Firestore, falling back to local:", err);
      // Fall back to local storage if Firestore fails
      const local = await StepsService.loadLocalSteps();
      if (local && local.date === todayKey) {
        savedSteps = local.steps;
        setSteps(local.steps);
        console.log("Loaded from local storage (Firestore failed):", local.steps);
      }
    }
    
    // Store userId for background sync tasks
    await AsyncStorage.setItem('userId', JSON.stringify(user.id));
    
    // Register background task to sync steps while app is closed
    await BackgroundStepsService.registerBackgroundTask();
  } else {
    // If not logged in, load from local storage only
    const local = await StepsService.loadLocalSteps();
    if (local && local.date === todayKey) {
      savedSteps = local.steps;
      setSteps(local.steps);
      console.log("Loaded from local storage (not logged in):", local.steps);
    }
  }

  // Check if device pedometer is available
  const available = await Pedometer.isAvailableAsync();
  console.log("Pedometer available:", available);

  if (available) {
    // Get today's step count from device
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    try {
      const dailyCount = await Pedometer.getStepCountAsync(startOfDay, endOfDay);
      console.log("Device step count for today:", dailyCount.steps);
      
      // Use Firestore value as source of truth - only use device count if Firestore is 0
      // This prevents device resets from overwriting saved steps
      let finalSteps = savedSteps;
      if (savedSteps === 0 && dailyCount.steps > 0) {
        finalSteps = dailyCount.steps;
        console.log("Firestore was 0, using device count:", dailyCount.steps);
      } else {
        console.log("Using saved steps:", savedSteps, "(ignoring device count:", dailyCount.steps + ")");
      }
      
      setSteps(finalSteps);
      pedometerBaseRef.current = finalSteps;
    } catch (err) {
      console.warn("Error getting step count (Android doesn't support date range):", err);
      // Fall back to saved steps - watchStepCount will handle new steps
      pedometerBaseRef.current = savedSteps;
      console.log("Using saved steps as fallback:", savedSteps);
    }

    // Watch pedometer for new steps
    // Accumulate new steps on top of saved steps using session delta
    subscription = Pedometer.watchStepCount(result => {
      console.log("Pedometer event fired. Session steps:", result.steps);
      
      // Calculate delta (new steps since last reading)
      const delta = result.steps - lastSessionStepsRef.current;
      lastSessionStepsRef.current = result.steps;
      
      // Only add positive deltas (prevents negative deltas from being added)
      if (delta > 0) {
        const newTotal = savedSteps + delta;
        console.log("Delta:", delta, "| New total:", newTotal, "(saved:", savedSteps, "+ delta:", delta + ")");
        setSteps(newTotal);
        savedSteps = newTotal; // Update reference for next delta calculation
      } else if (delta < 0) {
        console.log("Ignoring negative delta (", delta, ") - device counter likely reset");
      }
    });
  } else {
    pedometerBaseRef.current = savedSteps;
  }

  setLoading(false);
};

    init();

    return () => {
      subscription && subscription.remove();
      pedometerBaseRef.current = null;
      lastSessionStepsRef.current = 0; // Reset session counter for next init
    };
  }, [user]);

  // Save steps to device storage and sync to Firestore when they change
  useEffect(() => {
    if (!today) return;

    const persist = async () => {
      await StepsService.saveLocalSteps(steps);
      if (user) {
        await StepsService.syncToFirestore(user.id, steps);
      }
    };

    if (steps > 0) {
      persist();
    }
  }, [steps, today, user]);

  // Sync final step count to Firestore before logout
  useEffect(() => {
    return () => {
      // On unmount (logout), ensure latest steps are saved to cloud
      if (user && steps > 0) {
        StepsService.syncToFirestore(user.id, steps).catch(err => {
          console.error('Error syncing steps on logout:', err);
        });
      }
    };
  }, [user, steps]);

  // Send notification when daily goal is reached
  useEffect(() => {
    const checkGoal = async () => {
      if (steps >= dailyGoal && !goalReached) {
        setGoalReached(true);
        if (!goalNotificationSentRef.current) {
          goalNotificationSentRef.current = true;
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🎉 Daily Goal Reached!',
                body: `Great job! You've achieved ${steps} steps today.`,
                sound: 'default',
              },
              trigger: null, // Send immediately
            });
          } catch (err) {
            console.error('Error sending notification:', err);
          }
        }
      }
    };

    checkGoal();
  }, [steps, dailyGoal, goalReached]);

  // Update daily goal locally and in Firestore
  const handleSetDailyGoal = async (goal: number) => {
    setDailyGoal(goal);
    if (user) {
      await StepsService.setDailyGoal(user.id, goal);
    } else {
      await StepsService.setDailyGoal('', goal);
    }
  };

  return (
    <StepsContext.Provider value={{ steps, today, loading, dailyGoal, setDailyGoal: handleSetDailyGoal, goalReached }}>
      {children}
    </StepsContext.Provider>
  );
};
