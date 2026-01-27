import * as Location from 'expo-location';
import { AccelerometerService } from './accelerometerService';

// Global state for location tracking
let locationSubscription: any = null;
let isTrackingRef = false;
let currentSpeed = 0;
let speedData: any = null;
let previousLocation: any = null;
let lastLocationUpdateTime = Date.now();
let speedResetTimeout: any = null;

// Start continuous GPS location tracking
const startLocationTracking = async () => {
  if (isTrackingRef) {
    console.log('[Motion] Location tracking already active');
    return;
  }

  try {
    isTrackingRef = true;

    // Get permission from user to access location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Motion] Location permission denied');
      isTrackingRef = false;
      return;
    }

    // Load today's speed data from cache
    speedData = await AccelerometerService.loadLocalSpeedData();
    if (!speedData) {
      speedData = AccelerometerService.getInitialSpeedData();
    }
    currentSpeed = speedData.currentSpeed;

    // Start watching location every 1 second with high accuracy
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, // Update every 1 second
        distanceInterval: 1, // Update every 1 meter
      },
      (location) => {
        const { latitude, longitude, speed } = location.coords;

        // GPS speed is already in m/s - no conversion needed
        if (speed !== null && speed !== undefined) {
          currentSpeed = speed;
          lastLocationUpdateTime = Date.now();
          
          // Clear speed reset timeout since we got new data
          if (speedResetTimeout) {
            clearTimeout(speedResetTimeout);
            speedResetTimeout = null;
          }
          
          // Calculate distance traveled since last location
          let deltaDistance = 0;
          if (previousLocation) {
            deltaDistance = getDistance(
              previousLocation.latitude,
              previousLocation.longitude,
              latitude,
              longitude
            );
          }

          // Update speed stats (current, max, average, total distance)
          speedData = AccelerometerService.updateSpeedData(
            speedData,
            currentSpeed,
            deltaDistance
          );

          console.log('[Motion] Speed:', currentSpeed.toFixed(2), 'm/s, Max:', speedData.maxSpeed.toFixed(2), 'm/s, Distance:', deltaDistance.toFixed(1), 'm');

          // Save speed data to device storage
          AccelerometerService.saveLocalSpeedData(speedData);

          // Reset speed to 0 if no movement detected for 5 seconds
          speedResetTimeout = setTimeout(() => {
            if (currentSpeed > 0) {
              console.log('[Motion] No movement detected, resetting speed to 0');
              currentSpeed = 0;
              speedData = AccelerometerService.updateSpeedData(speedData, 0, 0);
              AccelerometerService.saveLocalSpeedData(speedData);
            }
          }, 5000); // Reset after 5 seconds of inactivity
        }

        // Store location for next distance calculation
        previousLocation = { latitude, longitude };
      }
    );

    console.log('[Motion] Location tracking started');
  } catch (err) {
    console.error('[Motion] Error starting location tracking:', err);
    isTrackingRef = false;
  }
};

// Stop tracking and clean up
const stopLocationTracking = async () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  if (speedResetTimeout) {
    clearTimeout(speedResetTimeout);
    speedResetTimeout = null;
  }
  isTrackingRef = false;
  currentSpeed = 0;
  previousLocation = null;
  lastLocationUpdateTime = Date.now();
  console.log('[Motion] Location tracking stopped');
};

// Calculate distance between two GPS coordinates using Haversine formula
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Sync speed data to Firestore
const syncSpeedData = async (userId: string) => {
  if (speedData) {
    try {
      await AccelerometerService.syncToFirestore(userId, speedData);
      console.log('[Motion] Speed data synced to Firestore');
    } catch (err) {
      console.error('[Motion] Error syncing speed data:', err);
    }
  }
};

// Export public API
export const BackgroundAccelerometerService = {
  // Start GPS tracking
  async startTracking(): Promise<void> {
    await startLocationTracking();
  },

  // Stop GPS tracking and clean up
  async stopTracking(): Promise<void> {
    await stopLocationTracking();
  },

  // Sync current speed data to Firestore
  async syncData(userId: string): Promise<void> {
    await syncSpeedData(userId);
  },

  // Get current speed in m/s
  getCurrentSpeed(): number {
    return currentSpeed;
  },

  // Get all speed data (current, max, average, distance, duration)
  getSpeedData(): any {
    return speedData;
  },
};
