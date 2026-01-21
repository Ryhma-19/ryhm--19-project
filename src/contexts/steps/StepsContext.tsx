// src/contexts/StepsContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Pedometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import { StepsService } from '../../services/steps/stepsService';
import { DailySteps } from '../../types/index';
import { useAuth } from '../AuthContext';

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

export const useSteps = () => useContext(StepsContext);

export const StepsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [steps, setSteps] = useState(0);
  const [today, setToday] = useState('');
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(8000);
  const [goalReached, setGoalReached] = useState(false);
  const { user } = useAuth();
  const goalNotificationSentRef = useRef(false);

  // Request notification permissions on mount
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

  // Initialize steps and goal
  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setToday(todayKey);
    goalNotificationSentRef.current = false; // Reset notification flag on new day

    let subscription: any;

   const init = async () => {
  // 🔐 Request permission FIRST
  const perm = await Pedometer.requestPermissionsAsync();
  console.log("Pedometer permission:", perm);

  if (!perm.granted) {
    console.log("Pedometer permission not granted");
    setLoading(false);
    return;
  }

  // 1) Load local steps
  const local = await StepsService.loadLocalSteps();
  if (local && local.date === todayKey) {
    setSteps(local.steps);
  }

  // 2) Load from Firestore if logged in
  if (user) {
    const remote = await StepsService.loadFromFirestore(user.id);
    if (remote && remote.date === todayKey) {
      setSteps(remote.steps);
      await StepsService.saveLocalSteps(remote.steps);
    }
  }

  // 3) Start pedometer
  const available = await Pedometer.isAvailableAsync();
  console.log("Pedometer available:", available);

  if (available) {
    subscription = Pedometer.watchStepCount(result => {
      console.log("Step event fired:", result.steps);
      setSteps(result.steps);
    });
  }

  setLoading(false);
};

    init();

    return () => {
      subscription && subscription.remove();
    };
  }, [user]);

  // Persist locally + sync to Firestore when steps change
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

  // Check if goal is reached and send notification
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
