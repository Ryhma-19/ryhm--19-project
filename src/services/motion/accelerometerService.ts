import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Speed data for a single day
export interface SpeedData {
  date: string;
  currentSpeed: number; // m/s (from GPS)
  maxSpeed: number; // m/s
  avgSpeed: number; // m/s
  totalDistance: number; // meters
  duration: number; // seconds
  updatedAt: Date;
}

const LOCAL_SPEED_KEY = 'speedDataToday';

// Get today's date as YYYY-MM-DD string
const getTodayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

export const AccelerometerService = {
  // Save speed data to device storage
  async saveLocalSpeedData(data: SpeedData): Promise<void> {
    await AsyncStorage.setItem(LOCAL_SPEED_KEY, JSON.stringify({
      ...data,
      updatedAt: data.updatedAt.toISOString(),
    }));
  },

  // Load speed data from device storage
  async loadLocalSpeedData(): Promise<SpeedData | null> {
    const raw = await AsyncStorage.getItem(LOCAL_SPEED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      updatedAt: new Date(parsed.updatedAt),
    } as SpeedData;
  },

  // Save speed data to Firestore
  async syncToFirestore(userId: string, data: SpeedData): Promise<void> {
    const dateKey = getTodayKey();
    const ref = doc(db, 'users', userId, 'motion', dateKey);
    
    await setDoc(ref, {
      date: dateKey,
      currentSpeed: data.currentSpeed,
      maxSpeed: data.maxSpeed,
      avgSpeed: data.avgSpeed,
      totalDistance: data.totalDistance,
      duration: data.duration,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  // Load today's speed data from Firestore
  async loadFromFirestore(userId: string): Promise<SpeedData | null> {
    const dateKey = getTodayKey();
    const ref = doc(db, 'users', userId, 'motion', dateKey);
    
    try {
      const snap = await (await import('firebase/firestore')).getDoc(ref);
      if (!snap.exists()) return null;
      
      const data = snap.data();
      return {
        date: data.date,
        currentSpeed: data.currentSpeed,
        maxSpeed: data.maxSpeed,
        avgSpeed: data.avgSpeed,
        totalDistance: data.totalDistance,
        duration: data.duration,
        updatedAt: new Date(data.updatedAt),
      };
    } catch (err) {
      console.error('Error loading motion data from Firestore:', err);
      return null;
    }
  },

  // Create empty speed data for today
  getInitialSpeedData(): SpeedData {
    return {
      date: getTodayKey(),
      currentSpeed: 0,
      maxSpeed: 0,
      avgSpeed: 0,
      totalDistance: 0,
      duration: 0,
      updatedAt: new Date(),
    };
  },

  // Update speed metrics based on GPS data
  updateSpeedData(
    current: SpeedData,
    newSpeed: number, // Speed in m/s from GPS
    deltaDistance: number = 0 // Distance in meters since last update
  ): SpeedData {
    const totalDistance = current.totalDistance + deltaDistance;
    const newDuration = current.duration + 1; // Increment by 1 second per update
    const avgSpeed = newDuration > 0 ? totalDistance / newDuration : 0;

    // Update all metrics with new speed and distance
    return {
      ...current,
      currentSpeed: newSpeed,
      maxSpeed: Math.max(current.maxSpeed, newSpeed),
      avgSpeed,
      totalDistance,
      duration: newDuration,
      updatedAt: new Date(),
    };
  },
};
