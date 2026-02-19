import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Pedometer tracking
  const pedometerSubscription = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);
  const workoutStartSteps = useRef<number>(0);
  const lastStepCount = useRef<number>(0);
  const cadenceWindow = useRef<number[]>([]);
  const cadenceInterval = useRef<ReturnType<typeof setInterval> | null>(null);

 // Perms

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await TrackingService.requestPermissions();
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to track your workouts.',
          [{ text: 'OK' }]
        );
      }

      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const checkLocationEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await TrackingService.checkLocationEnabled();

      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to track workouts.',
          [{ text: 'OK' }]
        );
      }

      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }, []);

  // Start
  const startTracking = useCallback(async (): Promise<boolean> => {
    try {
      if (hasPermission === null) {
        const granted = await requestPermissions();
        if (!granted) return false;
      }

      const enabled = await checkLocationEnabled();
      if (!enabled) return false;

      await TrackingService.startTracking((newStats) => {
        setStats((prev) => ({
          ...prev,
          elapsedTime: newStats.elapsedTime,
          distance: newStats.distance,
          currentPace: newStats.currentPace,
          averagePace: newStats.averagePace,
          currentSpeed: newStats.currentSpeed ?? 0,
          coordinates: newStats.coordinates,
        }));
      });

      // Pedometer setup
      const { status } = await Pedometer.requestPermissionsAsync();
      if (status === 'granted') {
        const isAvailable = await Pedometer.isAvailableAsync();

        if (isAvailable) {
          // Baseline
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

          // Watch live steps
          pedometerSubscription.current = Pedometer.watchStepCount((result) => {
            const totalSteps = result.steps;
            const workoutSteps = Math.max(0, totalSteps - workoutStartSteps.current);

            // Accumulate steps in cadence window
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

          // Calculate cadence every 10 seconds
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
      console.log('Workout tracking started');
      return true;
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert(
        'Error',
        'Failed to start workout tracking. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [hasPermission, requestPermissions, checkLocationEnabled, isPaused]);

  // Pause, resume and stop
  const pauseTracking = useCallback(() => {
    try {
      TrackingService.pauseTracking();
      setIsPaused(true);
      console.log('Workout paused');
    } catch (error) {
      console.error('Error pausing tracking:', error);
    }
  }, []);

  const resumeTracking = useCallback(() => {
    try {
      TrackingService.resumeTracking();
      setIsPaused(false);
      cadenceWindow.current = []; // Reset cadence window on resume
      console.log('Workout resumed');
    } catch (error) {
      console.error('Error resuming tracking:', error);
    }
  }, []);

  const stopTracking = useCallback(async () => {
    try {
      const finalStats = await TrackingService.stopTracking();

      // Clean ups
      if (pedometerSubscription.current) {
        pedometerSubscription.current.remove();
        pedometerSubscription.current = null;
      }

      if (cadenceInterval.current) {
        clearInterval(cadenceInterval.current);
        cadenceInterval.current = null;
      }

      // Final values
      const finalSteps = stats.steps;
      const durationMinutes = stats.elapsedTime / 60;
      const averageCadence = durationMinutes > 0
        ? Math.round(finalSteps / durationMinutes)
        : 0;

      const allCadenceReadings: number[] = cadenceWindow.current.map((steps) => steps * 6);
      const maxCadence = allCadenceReadings.length > 0
        ? Math.max(...allCadenceReadings)
        : stats.currentCadence;

      setIsTracking(false);
      setIsPaused(false);

      // Resets
      workoutStartSteps.current = 0;
      lastStepCount.current = 0;
      cadenceWindow.current = [];

      console.log('Workout tracking stopped');

      return {
        gpsPoints: finalStats.gpsPoints,
        duration: finalStats.duration,
        pausedDuration: finalStats.pausedDuration,
        steps: finalSteps,
        averageCadence,
        maxCadence,
      };
    } catch (error) {
      console.error('Error stopping tracking:', error);
      throw error;
    }
  }, [stats.steps, stats.elapsedTime, stats.currentCadence]);

  // Runs

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    return () => {
      if (TrackingService.isCurrentlyTracking()) {
        TrackingService.stopTracking().catch(console.error);
      }
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
    hasPermission,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    requestPermissions,
  };
};
