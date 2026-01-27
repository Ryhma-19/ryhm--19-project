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
import { WorkoutSession, GPSPoint, SplitTime, WorkoutType } from '../../types/workout';

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
    feeling?: 'great' | 'good' | 'okay' | 'tired' | 'exhausted'
  ): Promise<string> {
    try {
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
        personalRecords: [], // Will utilize achievements
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
        const data = doc.data();
        workouts.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          name: data.name,
          routeId: data.routeId,
          routeName: data.routeName,
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
            altitude: point.altitude,
          })),
          splits: data.splits.map((split: any) => ({
            distance: split.distance,
            time: split.time,
            pace: split.pace,
          })),
          calories: data.calories,
          elevationGain: data.elevationGain,
          notes: data.notes,
          feeling: data.feeling,
          personalRecords: data.personalRecords || [],
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
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

      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        type: data.type,
        name: data.name,
        routeId: data.routeId,
        routeName: data.routeName,
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
          altitude: point.altitude,
        })),
        splits: data.splits.map((split: any) => ({
          distance: split.distance,
          time: split.time,
          pace: split.pace,
        })),
        calories: data.calories,
        elevationGain: data.elevationGain,
        notes: data.notes,
        feeling: data.feeling,
        personalRecords: data.personalRecords || [],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
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
      feeling?: 'great' | 'good' | 'okay' | 'tired' | 'exhausted';
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
        const data = doc.data();
        workouts.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          name: data.name,
          routeId: data.routeId,
          routeName: data.routeName,
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
            altitude: point.altitude,
          })),
          splits: data.splits.map((split: any) => ({
            distance: split.distance,
            time: split.time,
            pace: split.pace,
          })),
          calories: data.calories,
          elevationGain: data.elevationGain,
          notes: data.notes,
          feeling: data.feeling,
          personalRecords: data.personalRecords || [],
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      return workouts;
    } catch (error) {
      console.error('Error loading workouts by route:', error);
      throw new Error('Failed to load workouts for this route');
    }
  }
}
