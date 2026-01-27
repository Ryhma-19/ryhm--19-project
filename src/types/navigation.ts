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
  // add RouteDetailsScreen later
};

// Tracking Stack
export type TrackingStackParamList = {
  TrackingHome: undefined;
  WorkoutSetup: undefined;
  ActiveWorkout: {
    workoutType: WorkoutType;
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
    };
    startTime: Date;
  };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  UserSettings: undefined;
  PasswordUpdate: undefined;
  // Add more profile screens later
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Routes: undefined;
  Track: undefined;
  Steps: undefined;
  Profile: undefined;
};