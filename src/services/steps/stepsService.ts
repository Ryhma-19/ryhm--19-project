// src/services/stepsService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DailySteps, StepsGoal, WeeklyStepsData, MonthlyStepsData } from '../../types/index';

const LOCAL_KEY = 'stepsToday';
const GOAL_KEY = 'stepsGoal';

const getTodayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
};

const getWeekNumber = (date: Date): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const getMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const StepsService = {
  async saveLocalSteps(steps: number): Promise<void> {
    const today: DailySteps = {
      date: getTodayKey(),
      steps,
      updatedAt: new Date(),
    };
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(today));
  },

  async loadLocalSteps(): Promise<DailySteps | null> {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      updatedAt: new Date(parsed.updatedAt),
    } as DailySteps;
  },

  async syncToFirestore(userId: string, steps: number): Promise<void> {
    const dateKey = getTodayKey();
    const ref = doc(db, 'users', userId, 'steps', dateKey);
    const payload = {
      date: dateKey,
      steps,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, payload, { merge: true });
  },

  async loadFromFirestore(userId: string): Promise<DailySteps | null> {
    const dateKey = getTodayKey();
    const ref = doc(db, 'users', userId, 'steps', dateKey);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      date: data.date,
      steps: data.steps,
      updatedAt: new Date(data.updatedAt),
    };
  },

  // Goal management
  async setDailyGoal(userId: string, goalSteps: number): Promise<void> {
    const goal: StepsGoal = {
      dailyGoal: goalSteps,
      lastUpdated: new Date(),
    };
    await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(goal));
    
    if (userId) {
      const ref = doc(db, 'users', userId, 'goals', 'dailySteps');
      await setDoc(ref, {
        dailyGoal: goalSteps,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
    }
  },

  async getDailyGoal(userId?: string): Promise<number> {
    // Try local storage first
    const localGoal = await AsyncStorage.getItem(GOAL_KEY);
    if (localGoal) {
      const parsed = JSON.parse(localGoal);
      return parsed.dailyGoal;
    }

    // Try remote if userId provided
    if (userId) {
      try {
        const ref = doc(db, 'users', userId, 'goals', 'dailySteps');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return snap.data().dailyGoal;
        }
      } catch (err) {
        console.error('Error loading remote goal:', err);
      }
    }

    return 8000; // Default goal
  },

  // Weekly data
  async getWeeklySteps(userId: string, date: Date = new Date()): Promise<WeeklyStepsData> {
    const week = getWeekNumber(date);
    const stepsRef = collection(db, 'users', userId, 'steps');
    
    // Get all docs and filter by week (simplified approach)
    try {
      const snap = await getDocs(stepsRef);
      const days: DailySteps[] = [];
      
      snap.forEach((doc) => {
        const data = doc.data();
        const docWeek = getWeekNumber(new Date(data.date));
        if (docWeek === week) {
          days.push({
            date: data.date,
            steps: data.steps,
            updatedAt: new Date(data.updatedAt),
          });
        }
      });

      const total = days.reduce((sum, day) => sum + day.steps, 0);
      return { week, days, total };
    } catch (err) {
      console.error('Error loading weekly steps:', err);
      return { week, days: [], total: 0 };
    }
  },

  // Monthly data
  async getMonthlySteps(userId: string, date: Date = new Date()): Promise<MonthlyStepsData> {
    const month = getMonthKey(date);
    const stepsRef = collection(db, 'users', userId, 'steps');

    try {
      const snap = await getDocs(stepsRef);
      const daysByWeek: { [key: string]: DailySteps[] } = {};

      snap.forEach((doc) => {
        const data = doc.data();
        const docMonth = getMonthKey(new Date(data.date));
        if (docMonth === month) {
          const week = getWeekNumber(new Date(data.date));
          if (!daysByWeek[week]) daysByWeek[week] = [];
          daysByWeek[week].push({
            date: data.date,
            steps: data.steps,
            updatedAt: new Date(data.updatedAt),
          });
        }
      });

      const weeks: WeeklyStepsData[] = Object.entries(daysByWeek).map(([week, days]) => ({
        week,
        days,
        total: days.reduce((sum, day) => sum + day.steps, 0),
      }));

      const total = weeks.reduce((sum, week) => sum + week.total, 0);
      return { month, weeks, total };
    } catch (err) {
      console.error('Error loading monthly steps:', err);
      return { month, weeks: [], total: 0 };
    }
  },
};
