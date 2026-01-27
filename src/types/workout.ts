export type WorkoutType = 'running' | 'walking';

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
  
  notes?: string;
  feeling?: 'great' | 'good' | 'okay' | 'tired' | 'exhausted';
  
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
  isPaused: boolean;
  coordinates: GPSPoint[];
}
