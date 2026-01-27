import { useState, useEffect, useRef } from 'react';
import { Pedometer } from 'expo-sensors';
import { LiveWorkoutStats, GPSPoint } from '../types/workout';
import { TrackingService } from '../services/location/tracking.service';

export const useWorkoutTrackingWithPedometer = () => {
  const [stats, setStats] = useState<LiveWorkoutStats>({
    elapsedTime: 0,
    distance: 0,
    currentPace: 0,
    averagePace: 0,
    currentSpeed: 0,
    coordinates: [],
    steps: 0,
    currentCadence: 0,
  });

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Pedometer tracking
  const pedometerSubscription = useRef<any>(null);
  const workoutStartSteps = useRef<number>(0);
  const lastStepCount = useRef<number>(0);
  const cadenceWindow = useRef<number[]>([]);
  const cadenceInterval = useRef<any>(null);

  // Start tracking
  const startTracking = async (): Promise<boolean> => {
    try {
      await TrackingService.startTracking((newStats) => {
        setStats((prev) => ({
          ...prev,
          elapsedTime: newStats.elapsedTime,
          distance: newStats.distance,
          currentPace: newStats.currentPace,
          averagePace: newStats.averagePace,
          currentSpeed: newStats.currentSpeed,
          coordinates: newStats.coordinates,
        }));
      });

      const { status } = await Pedometer.requestPermissionsAsync();
      if (status === 'granted') {
        const isAvailable = await Pedometer.isAvailableAsync();
        
        if (isAvailable) {
          // Baseline current count
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          
          try {
            const result = await Pedometer.getStepCountAsync(start, end);
            workoutStartSteps.current = result.steps;
            lastStepCount.current = result.steps;
          } catch (err) {
            console.warn('Could not get initial step count:', err);
            workoutStartSteps.current = 0;
            lastStepCount.current = 0;
          }

          // New steps
          pedometerSubscription.current = Pedometer.watchStepCount((result) => {
            const totalSteps = result.steps;
            const workoutSteps = Math.max(0, totalSteps - workoutStartSteps.current);
            
            // Calculate cadence
            const stepDelta = totalSteps - lastStepCount.current;
            lastStepCount.current = totalSteps;
            
            if (stepDelta > 0) {
              cadenceWindow.current.push(stepDelta);
              if (cadenceWindow.current.length > 6) {
                cadenceWindow.current.shift();
              }
            }

            setStats((prev) => ({
              ...prev,
              steps: workoutSteps,
            }));
          });

          // Calculate cadence in intervals
          cadenceInterval.current = setInterval(() => {
            if (cadenceWindow.current.length > 0 && !isPaused) {
              const totalStepsInWindow = cadenceWindow.current.reduce((sum, s) => sum + s, 0);
              const timeWindowMinutes = (cadenceWindow.current.length * 10) / 60;
              const currentCadence = Math.round(totalStepsInWindow / timeWindowMinutes);
              
              setStats((prev) => ({
                ...prev,
                currentCadence,
              }));
            }
          }, 10000);
        }
      }

      setIsTracking(true);
      setIsPaused(false);
      return true;
    } catch (error) {
      console.error('Error starting tracking:', error);
      return false;
    }
  };

  // Pause
  const pauseTracking = () => {
    TrackingService.pauseTracking();
    setIsPaused(true);
  };

  // Resume
  const resumeTracking = () => {
    TrackingService.resumeTracking();
    setIsPaused(false);
    cadenceWindow.current = [];
  };

  // Stop
  const stopTracking = async () => {
    const finalStats = TrackingService.stopTracking();

    if (pedometerSubscription.current) {
      pedometerSubscription.current.remove();
      pedometerSubscription.current = null;
    }

    if (cadenceInterval.current) {
      clearInterval(cadenceInterval.current);
      cadenceInterval.current = null;
    }

    // Calculations for final stats
    const finalSteps = stats.steps;
    const durationMinutes = stats.elapsedTime / 60;
    const averageCadence = durationMinutes > 0 ? Math.round(finalSteps / durationMinutes) : 0;
    
    const allCadenceReadings: number[] = [];
    if (cadenceWindow.current.length > 0) {
      cadenceWindow.current.forEach((steps) => {
        const cadence = steps * 6;
        allCadenceReadings.push(cadence);
      });
    }
    const maxCadence = allCadenceReadings.length > 0 
      ? Math.max(...allCadenceReadings) 
      : stats.currentCadence;

    setIsTracking(false);
    setIsPaused(false);

    // Reset
    workoutStartSteps.current = 0;
    lastStepCount.current = 0;
    cadenceWindow.current = [];

    return {
      gpsPoints: finalStats.coordinates,
      duration: finalStats.duration,
      pausedDuration: finalStats.pausedDuration,
      steps: finalSteps,
      averageCadence,
      maxCadence,
    };
  };

  useEffect(() => {
    return () => {
      if (pedometerSubscription.current) {
        pedometerSubscription.current.remove();
      }
      if (cadenceInterval.current) {
        clearInterval(cadenceInterval.current);
      }
    };
  }, []);

  return {
    stats,
    isTracking,
    isPaused,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  };
};
