import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { GPSPoint, LiveWorkoutStats, WorkoutType } from '../../types/workout';
import {
  calculateTotalDistance,
  calculatePace,
  filterGPSPoints,
  calculateElevationGain,
} from '../../utils/workoutUtils';

const LOCATION_TASK_NAME = 'WORKOUT_TRACKING';

export class TrackingService {
  private static gpsPoints: GPSPoint[] = [];
  private static startTime: Date | null = null;
  private static pausedTime: Date | null = null;
  private static totalPausedDuration: number = 0; // seconds
  private static isPaused: boolean = false;
  private static isTracking: boolean = false;
  private static locationSubscription: Location.LocationSubscription | null = null;
  
  // Callbacks for live updates
  private static onLocationUpdate: ((stats: LiveWorkoutStats) => void) | null = null;

  // Request necessary permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission denied (tracking will stop when app is closed)');
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Run a check on location service availability
  static async checkLocationEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Start tracking and check for necessary permissions
  static async startTracking(
    onUpdate: (stats: LiveWorkoutStats) => void
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const locationEnabled = await this.checkLocationEnabled();
      if (!locationEnabled) {
        throw new Error('Location services are disabled');
      }

      // Reset
      this.gpsPoints = [];
      this.startTime = new Date();
      this.pausedTime = null;
      this.totalPausedDuration = 0;
      this.isPaused = false;
      this.isTracking = true;
      this.onLocationUpdate = onUpdate;

      // Start location updates, current update threshold is set to 5 meters or 1 second
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      console.log('Workout tracking started');
    } catch (error) {
      console.error('Error starting tracking:', error);
      throw error;
    }
  }

  // Handle location updates and tracking logic
  private static handleLocationUpdate(location: Location.LocationObject): void {
    if (!this.isTracking || this.isPaused) {
      return;
    }

    const gpsPoint: GPSPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date(location.timestamp),
      speed: location.coords.speed || 0,
      accuracy: location.coords.accuracy || 0,
      altitude: location.coords.altitude || undefined,
    };

    // Filter
    if (gpsPoint.accuracy > 50) {
      console.log('Ignoring GPS point with poor accuracy:', gpsPoint.accuracy);
      return;
    }

    this.gpsPoints.push(gpsPoint);

    // Calculate current
    const stats = this.getCurrentStats();
    if (this.onLocationUpdate) {
      this.onLocationUpdate(stats);
    }
  }

  // Pause
  static pauseTracking(): void {
    if (!this.isTracking || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.pausedTime = new Date();
    console.log('Workout tracking paused');
  }

  // Resume
  static resumeTracking(): void {
    if (!this.isTracking || !this.isPaused || !this.pausedTime) {
      return;
    }

    const pauseDuration = (new Date().getTime() - this.pausedTime.getTime()) / 1000;
    this.totalPausedDuration += pauseDuration;
    
    this.isPaused = false;
    this.pausedTime = null;
    console.log(`Workout tracking resumed (paused for ${pauseDuration}s)`);
  }

  // Stop tracking and return final data
  static async stopTracking(): Promise<{
    gpsPoints: GPSPoint[];
    duration: number;
    pausedDuration: number;
  }> {
    try {
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      let duration = 0;
      if (this.startTime) {
        const endTime = new Date();
        const totalTime = (endTime.getTime() - this.startTime.getTime()) / 1000;
        
        if (this.isPaused && this.pausedTime) {
          const currentPauseDuration = (endTime.getTime() - this.pausedTime.getTime()) / 1000;
          this.totalPausedDuration += currentPauseDuration;
        }
        
        duration = totalTime - this.totalPausedDuration;
      }

      const finalGpsPoints = [...this.gpsPoints];
      const finalPausedDuration = this.totalPausedDuration;

      // Reset
      this.isTracking = false;
      this.isPaused = false;
      this.startTime = null;
      this.pausedTime = null;
      this.gpsPoints = [];
      this.totalPausedDuration = 0;
      this.onLocationUpdate = null;

      console.log('Workout tracking stopped');
      console.log(`Total points: ${finalGpsPoints.length}`);
      console.log(`Duration: ${duration}s (paused: ${finalPausedDuration}s)`);

      return {
        gpsPoints: finalGpsPoints,
        duration,
        pausedDuration: finalPausedDuration,
      };
    } catch (error) {
      console.error('Error stopping tracking:', error);
      throw error;
    }
  }

  // Get stats for the current workout session
  static getCurrentStats(): LiveWorkoutStats {
    const distance = calculateTotalDistance(this.gpsPoints);
    const elapsedTime = this.getElapsedTime();
    
    const averagePace = elapsedTime > 0 && distance > 0
      ? calculatePace(distance, elapsedTime)
      : 0;

    // Calculate current pace based on the last 10 points
    let currentPace = 0;
    if (this.gpsPoints.length >= 2) {
      const recentPoints = this.gpsPoints.slice(-10);
      const recentDistance = calculateTotalDistance(recentPoints);
      const recentDuration = recentPoints.length > 0
        ? (recentPoints[recentPoints.length - 1].timestamp.getTime() - 
           recentPoints[0].timestamp.getTime()) / 1000
        : 0;
      
      if (recentDuration > 0 && recentDistance > 0) {
        currentPace = calculatePace(recentDistance, recentDuration);
      }
    }

    return {
      elapsedTime,
      distance,
      currentPace,
      averagePace,
      isPaused: this.isPaused,
      coordinates: [...this.gpsPoints],
    };
  }

  // Calculate elapsed time
  private static getElapsedTime(): number {
    if (!this.startTime) {
      return 0;
    }

    const now = new Date();
    const totalTime = (now.getTime() - this.startTime.getTime()) / 1000;
    
    let pausedDuration = this.totalPausedDuration;
    
    // Pause duration handling
    if (this.isPaused && this.pausedTime) {
      pausedDuration += (now.getTime() - this.pausedTime.getTime()) / 1000;
    }

    return totalTime - pausedDuration;
  }

  static isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  static isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  static getPointCount(): number {
    return this.gpsPoints.length;
  }

  // Define background task for tracking
  static defineBackgroundTask(): void {
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error('Background tracking error:', error);
        return;
      }

      if (data) {
        const { locations } = data as any;
        console.log('Background location update:', locations);
      }
    });
  }

  // Start background tracking
  static async startBackgroundTracking(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (!hasStarted) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
          foregroundService: {
            notificationTitle: 'Workout in Progress',
            notificationBody: 'Tracking your workout...',
            notificationColor: '#007AFF',
          },
        });
        console.log('Background tracking started');
      }
    } catch (error) {
      console.error('Error starting background tracking:', error);
    }
  }

  // Stop background tracking
  static async stopBackgroundTracking(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('Background tracking stopped');
      }
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  }
}
