import { RouteData } from './route';

export type RoutesStackParamList = {
  RoutesList: undefined;
  RoutePlanning: {
    editRoute?: RouteData;
  } | undefined;
  // Future: RouteDetails screen
  // RouteDetails: {
  //   route: RouteData;
  // };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  PasswordReset: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Routes: undefined;
  Track: undefined;
  Steps: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
