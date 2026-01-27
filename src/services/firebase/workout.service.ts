import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { WorkoutSession, GPSPoint, SplitTime, WorkoutType, FeelingType } from '../../types/workout';

export class WorkoutService {
  private static readonly COLLECTION = 'workouts';

  // Create a new workout session
  static async createWorkout(
    userId: string,
    type: WorkoutType,
    startTime: Date,
    endTime: Date,
    duration: number,
    pausedDuration: number,
    distance: number,
    averagePace: number,
    maxSpeed: number,
    coordinates: GPSPoint[],
    splits: SplitTime[],
    routeId?: string,
    routeName?: string,
    calories?: number,
    elevationGain?: number,
    notes?: string,
    feeling?: FeelingType,
    steps?: number,
    averageCadence?: number,
    maxCadence?: number
  ): Promise<string> {
    try {
      // Avg speed
      const totalSpeed = coordinates.reduce((sum, point) => sum + point.speed, 0);
      const averageSpeed = coordinates.length > 0 ? totalSpeed / coordinates.length : 0;

      // Consistency of pace
      let speedConsistency = 0;
      if (coordinates.length > 1) {
        const speeds = coordinates.map(p => p.speed);
        const mean = averageSpeed;
        const variance = speeds.reduce((sum, speed) => sum + Math.pow(speed - mean, 2), 0) / speeds.length;
        const stdDev = Math.sqrt(variance);
        speedConsistency = mean > 0 ? Math.max(0, 1 - (stdDev / mean)) : 0;
      }

      const workoutData = {
        userId,
        type,
        name: undefined,
        routeId: routeId || null,
        routeName: routeName || null,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        duration,
        pausedDuration,
        distance,
        averagePace,
        maxSpeed,
        coordinates: coordinates.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: Timestamp.fromDate(point.timestamp),
          speed: point.speed,
          accuracy: point.accuracy,
          altitude: point.altitude || null,
        })),
        splits: splits.map((split) => ({
          distance: split.distance,
          time: split.time,
          pace: split.pace,
        })),
        calories: calories || null,
        elevationGain: elevationGain || null,
        notes: notes || null,
        feeling: feeling || null,
        personalRecords: [],
        steps: steps || null,
        averageCadence: averageCadence || null,
        maxCadence: maxCadence || null,
        averageSpeed: averageSpeed || null,
        speedData: {
          samples: coordinates.length,
          consistency: speedConsistency,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), workoutData);
      console.log('Workout created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating workout:', error);
      throw new Error('Failed to save workout');
    }
  }

  // Get all workouts for a user
  static async getUserWorkouts(userId: string): Promise<WorkoutSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('startTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const workouts: WorkoutSession[] = [];

      querySnapshot.forEach((doc) => {
        workouts.push(this.convertDocToWorkout(doc.id, doc.data()));
      });

      console.log(`Loaded ${workouts.length} workouts for user`);
      return workouts;
    } catch (error) {
      console.error('Error loading workouts:', error);
      throw new Error('Failed to load workouts');
    }
  }

  // Get a specific workout by ID
  static async getWorkoutById(workoutId: string): Promise<WorkoutSession | null> {
    try {
      const docRef = doc(db, this.COLLECTION, workoutId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('Workout not found');
        return null;
      }

      return this.convertDocToWorkout(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error fetching workout:', error);
      throw new Error('Failed to fetch workout');
    }
  }

  // Update workout details
  static async updateWorkout(
    workoutId: string,
    updates: {
      name?: string;
      notes?: string;
      feeling?: FeelingType;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, workoutId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      console.log('Workout updated:', workoutId);
    } catch (error) {
      console.error('Error updating workout:', error);
      throw new Error('Failed to update workout');
    }
  }

  // Delete a workout
  static async deleteWorkout(workoutId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, workoutId);
      await deleteDoc(docRef);
      console.log('Workout deleted:', workoutId);
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw new Error('Failed to delete workout');
    }
  }

  //  Get workouts for a specific route
  static async getWorkoutsByRoute(userId: string, routeId: string): Promise<WorkoutSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('routeId', '==', routeId),
        orderBy('startTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const workouts: WorkoutSession[] = [];

      querySnapshot.forEach((doc) => {
        workouts.push(this.convertDocToWorkout(doc.id, doc.data()));
      });

      return workouts;
    } catch (error) {
      console.error('Error loading workouts by route:', error);
      throw new Error('Failed to load workouts for this route');
    }
  }

// Get workouts for date range
  static async getWorkoutsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        where('startTime', '<=', Timestamp.fromDate(endDate)),
        orderBy('startTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const workouts: WorkoutSession[] = [];

      querySnapshot.forEach((doc) => {
        workouts.push(this.convertDocToWorkout(doc.id, doc.data()));
      });

      console.log(`Loaded ${workouts.length} workouts between ${startDate.toDateString()} and ${endDate.toDateString()}`);
      return workouts;
    } catch (error) {
      console.error('Error loading workouts by date range:', error);
      throw new Error('Failed to load workouts for date range');
    }
  }

  // Convert for Firebase
  private static convertDocToWorkout(id: string, data: any): WorkoutSession {
    return {
      id,
      userId: data.userId,
      type: data.type,
      name: data.name || undefined,
      routeId: data.routeId || undefined,
      routeName: data.routeName || undefined,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
      duration: data.duration,
      pausedDuration: data.pausedDuration,
      distance: data.distance,
      averagePace: data.averagePace,
      maxSpeed: data.maxSpeed,
      coordinates: data.coordinates.map((point: any) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: point.timestamp.toDate(),
        speed: point.speed,
        accuracy: point.accuracy,
        altitude: point.altitude || undefined,
      })),
      splits: data.splits.map((split: any) => ({
        distance: split.distance,
        time: split.time,
        pace: split.pace,
      })),
      calories: data.calories || undefined,
      elevationGain: data.elevationGain || undefined,
      notes: data.notes || undefined,
      feeling: data.feeling || undefined,
      personalRecords: data.personalRecords || [],
      steps: data.steps || undefined,
      averageCadence: data.averageCadence || undefined,
      maxCadence: data.maxCadence || undefined,
      averageSpeed: data.averageSpeed || undefined,
      speedData: data.speedData || undefined,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
}
