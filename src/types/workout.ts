export type WorkoutType = 'running' | 'walking'; //add cycling eventually

export type FeelingType = 'great' | 'good' | 'okay' | 'tired' | 'exhausted';

export interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed: number;
  accuracy: number;
  altitude?: number;
}

export interface SplitTime {
  distance: number;
  time: number;
  pace: number;
}

// Completed workout session
export interface WorkoutSession {
  id: string;
  userId: string;
  type: WorkoutType;
  name?: string;
  
  routeId?: string;
  routeName?: string;
  
  startTime: Date;
  endTime: Date;
  duration: number;
  pausedDuration: number;
  
  distance: number;
  averagePace: number;
  maxSpeed: number;
  
  coordinates: GPSPoint[];
  splits: SplitTime[];
  
  calories?: number;
  elevationGain?: number;

  steps?: number;
  averageCadence?: number;
  maxCadence?: number;

  averageSpeed?: number;
  speedData?: {
    samples: number;
    consistency: number;
  };
  
  notes?: string;
  feeling?: FeelingType;
  
  personalRecords: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Draft
export interface WorkoutDraft {
  type: WorkoutType;
  routeId?: string;
  routeName?: string;
  startTime: Date;
}

// Stats during workout
export interface LiveWorkoutStats {
  elapsedTime: number;
  distance: number;
  currentPace: number;
  averagePace: number;
  currentSpeed: number;
  steps: number;
  currentCadence: number;
  isPaused: boolean;
  coordinates: GPSPoint[];
}

export interface WorkoutAnalytics {
  totalWorkouts: number;
  totalDistance: number;
  totalDuration: number;
  totalSteps: number;
  totalCalories: number;

  averageDistance: number;
  averagePace: number;
  averageCadence: number;

  // Personal bests
  longestRun: {
    workoutId: string;
    distance: number;
    date: Date;
  };
  fastestPace: {
    workoutId: string;
    pace: number;
    date: Date;
  };
  mostSteps: {
    workoutId: string;
    steps: number;
    date: Date;
  };
  longestDuration: {
    workoutId: string;
    duration: number;
    date: Date;
  };

  periodStart: Date;
  periodEnd: Date;
}

export interface AchievementData {
  workoutId: string;
  achievementType: string;
  metric: string;
  value: number;
  previousBest?: number;
  timestamp: Date;
}