import { NavigatorScreenParams } from '@react-navigation/native';
import { RouteData } from './route';
import { WorkoutType, GPSPoint } from './workout';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  PasswordReset: undefined;
};

// Routes Stack
export type RoutesStackParamList = {
  RoutesList: undefined;
  RoutePlanning: {
    editRoute?: RouteData;
  } | undefined;
  RouteDetail: {
    routeId: string;
  };
};

// Tracking Stack
export type TrackingStackParamList = {
  TrackingHome: undefined;
  WorkoutSetup: undefined;
  ActiveWorkout: {
    workoutType: 'running' | 'walking';
    routeId?: string;
    routeName?: string;
  };
  WorkoutSummary: {
    workoutType: WorkoutType;
    routeId?: string;
    routeName?: string;
    finalData: {
      gpsPoints: GPSPoint[];
      duration: number;
      pausedDuration: number;
      steps: number;
      averageCadence: number;
      maxCadence: number;
    };
    startTime: Date;
  };
  WorkoutList: undefined;
  WorkoutDetail: {
    workoutId: string;
  };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  UserSettings: undefined;
  PasswordUpdate: undefined;
  UserBadges: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Routes: undefined;
  Track: undefined;
  Steps: undefined;
  Profile: undefined;
  StorePage: undefined;
};