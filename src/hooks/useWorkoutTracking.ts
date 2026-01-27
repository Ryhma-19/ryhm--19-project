import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { TrackingService } from '../services/location/tracking.service';
import { LiveWorkoutStats, WorkoutType } from '../types/workout';

export function useWorkoutTracking() {
  const [stats, setStats] = useState<LiveWorkoutStats>({
    elapsedTime: 0,
    distance: 0,
    currentPace: 0,
    averagePace: 0,
    isPaused: false,
    coordinates: [],
  });

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const updateStatsCallback = useRef((newStats: LiveWorkoutStats) => {
    setStats(newStats);
    setIsPaused(newStats.isPaused);
  });

  // Permisson requests and service checks
  const requestPermissions = useCallback(async () => {
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

  const checkLocationEnabled = useCallback(async () => {
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

  // Start tracking, includes secondary permission/service checks
  const startTracking = useCallback(async () => {
    try {
      if (hasPermission === null) {
        const granted = await requestPermissions();
        if (!granted) return false;
      }

      const enabled = await checkLocationEnabled();
      if (!enabled) return false;

      await TrackingService.startTracking(updateStatsCallback.current);
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
  }, [hasPermission, requestPermissions, checkLocationEnabled]);

  // Pause
  const pauseTracking = useCallback(() => {
    try {
      TrackingService.pauseTracking();
      setIsPaused(true);
      console.log('Workout paused');
    } catch (error) {
      console.error('Error pausing tracking:', error);
    }
  }, []);

  // Resume
  const resumeTracking = useCallback(() => {
    try {
      TrackingService.resumeTracking();
      setIsPaused(false);
      console.log('Workout resumed');
    } catch (error) {
      console.error('Error resuming tracking:', error);
    }
  }, []);

  // Stop tracking and return final data
  const stopTracking = useCallback(async () => {
    try {
      const finalData = await TrackingService.stopTracking();
      setIsTracking(false);
      setIsPaused(false);
      
      // Reset
      setStats({
        elapsedTime: 0,
        distance: 0,
        currentPace: 0,
        averagePace: 0,
        isPaused: false,
        coordinates: [],
      });
      
      console.log('Workout tracking stopped');
      return finalData;
    } catch (error) {
      console.error('Error stopping tracking:', error);
      throw error;
    }
  }, []);

  // Initialize permissions and cleanup
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    return () => {
      if (TrackingService.isCurrentlyTracking()) {
        TrackingService.stopTracking().catch(console.error);
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
}
