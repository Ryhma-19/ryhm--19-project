import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';
import { MainTabParamList } from '../types';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import HomeScreen from '../screens/home/HomeScreen';
import RoutesScreen from '../screens/routes/RoutesScreen';
import TrackingScreen from '../screens/tracking/TrackingScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import StepsScreen  from  '../screens/steps/StepsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth stack (login, signup)
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

type IconName = keyof typeof Ionicons.glyphMap;

// Main app tabs
function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: IconName = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Routes') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Track') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Steps') {
            iconName = focused ? 'walk' : 'walk-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Routes" component={RoutesScreen} />
      <Tab.Screen name="Track" component={TrackingScreen} />
      <Tab.Screen name="Steps" component={StepsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root navi
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    // Show loading screen while checking auth
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}