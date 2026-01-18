export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  notifications: boolean;
  weatherAlerts: boolean;
  theme: 'light' | 'dark';
}

export interface Route {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coordinates: Coordinate[];
  distance: number; // in meters
  estimatedDuration?: number; // in seconds
  createdAt: Date;
  isFavorite: boolean;
  cachedMapData?: string; // For offline
}

export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp?: Date;
}

export interface Workout {
  id: string;
  userId: string;
  routeId?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  distance: number; // in meters
  averageSpeed: number; // m/s
  maxSpeed: number; // m/s
  steps?: number;
  calories?: number;
  coordinates: Coordinate[];
  weather?: WeatherCondition;
}

export interface WeatherCondition {
  temperature: number; // Celsius
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
  isExtreme?: boolean; // For warnings
}

export interface Achievement {
  id: string;
  type: 'distance' | 'streak' | 'speed' | 'custom';
  title: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDistance: number; // meters
  totalDuration: number; // seconds
  averagePace: number; // min/km
  longestRun: number; // meters
  currentStreak: number; // days
  longestStreak: number; // days
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Routes: undefined;
  Track: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  UserSettings: undefined;
};