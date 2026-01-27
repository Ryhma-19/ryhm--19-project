import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DailySteps, StepsGoal, WeeklyStepsData, MonthlyStepsData } from '../../types/index';

const LOCAL_KEY = 'stepsToday';
const GOAL_KEY = 'stepsGoal';

// Get today's date as YYYY-MM-DD string
const getTodayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

// Calculate week number (ISO 8601 format: YYYY-W##)
const getWeekNumber = (date: Date): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

// Get month as YYYY-MM string
const getMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const StepsService = {
  // Save steps to device storage
  async saveLocalSteps(steps: number): Promise<void> {
    const today: DailySteps = {
      date: getTodayKey(),
      steps,
      updatedAt: new Date(),
    };
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(today));
  },

  // Load steps from device storage
  async loadLocalSteps(): Promise<DailySteps | null> {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      updatedAt: new Date(parsed.updatedAt),
    } as DailySteps;
  },

  // Save steps to Firestore and update weekly/monthly totals
  async syncToFirestore(userId: string, steps: number): Promise<void> {
    const dateKey = getTodayKey();
    const ref = doc(db, 'users', userId, 'steps', dateKey);
    const payload = {
      date: dateKey,
      steps,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, payload, { merge: true });
    
    // Update weekly and monthly summaries
    await this.updateWeeklyAggregate(userId);
    await this.updateMonthlyAggregate(userId);
  },

  // Calculate and save total steps for the current week
  async updateWeeklyAggregate(userId: string, date: Date = new Date()): Promise<void> {
    const weekKey = getWeekNumber(date);
    const weeklyData = await this.getWeeklySteps(userId, date);
    
    const ref = doc(db, 'users', userId, 'weeklySteps', weekKey);
    await setDoc(ref, {
      week: weekKey,
      total: weeklyData.total,
      days: weeklyData.days.length,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  // Calculate and save total steps for the current month
  async updateMonthlyAggregate(userId: string, date: Date = new Date()): Promise<void> {
    const monthKey = getMonthKey(date);
    const monthlyData = await this.getMonthlySteps(userId, date);
    
    const ref = doc(db, 'users', userId, 'monthlySteps', monthKey);
    await setDoc(ref, {
      month: monthKey,
      total: monthlyData.total,
      weeks: monthlyData.weeks.length,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  // Load today's steps from Firestore (creates entry with 0 if doesn't exist)
  async loadFromFirestore(userId: string): Promise<DailySteps | null> {
    const dateKey = getTodayKey();
    const ref = doc(db, 'users', userId, 'steps', dateKey);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // First time today - create entry with 0 steps
      const payload = {
        date: dateKey,
        steps: 0,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(ref, payload);
      return {
        date: payload.date,
        steps: payload.steps,
        updatedAt: new Date(payload.updatedAt),
      };
    }
    const data = snap.data();
    return {
      date: data.date,
      steps: data.steps,
      updatedAt: new Date(data.updatedAt),
    };
  },

  // Set daily step goal (stored locally and in Firestore)
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

  // Get daily goal from local storage or Firestore (default: 8000)
  async getDailyGoal(userId?: string): Promise<number> {
    // Check device storage first
    const localGoal = await AsyncStorage.getItem(GOAL_KEY);
    if (localGoal) {
      const parsed = JSON.parse(localGoal);
      return parsed.dailyGoal;
    }

    // Check Firestore if user is logged in
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

    return 8000; // Fall back to default goal
  },

  // Get all steps for the current week
  async getWeeklySteps(userId: string, date: Date = new Date()): Promise<WeeklyStepsData> {
    const week = getWeekNumber(date);
    const stepsRef = collection(db, 'users', userId, 'steps');
    
    try {
      const snap = await getDocs(stepsRef);
      const days: DailySteps[] = [];
      
      // Collect all days that belong to this week
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

  // Get all steps for the current month (organized by week)
  async getMonthlySteps(userId: string, date: Date = new Date()): Promise<MonthlyStepsData> {
    const month = getMonthKey(date);
    const stepsRef = collection(db, 'users', userId, 'steps');

    try {
      const snap = await getDocs(stepsRef);
      const daysByWeek: { [key: string]: DailySteps[] } = {};

      // Group all days in this month by their week
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

      // Convert grouped data into weekly summaries
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
