import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { RoutesStackParamList, AuthStackParamList, MainTabParamList, ProfileStackParamList, TrackingStackParamList } from '../types/navigation';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import PasswordResetScreen from '../screens/auth/PasswordResetScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import RoutesScreen from '../screens/routes/RoutesScreen';
import RoutePlanningScreen from '../screens/routes/RoutePlanningScreen';
import TrackingScreen from '../screens/tracking/TrackingScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import StepsScreen  from  '../screens/steps/StepsScreen';

// Profile Screens
import UserSettingsScreen from '../screens/profile/UserSettingsScreen';
import PasswordUpdateScreen from '../screens/profile/PasswordUpdateScreen';

// Tracking Screens
import WorkoutSetupScreen from '../screens/tracking/WorkoutSetupScreen';
import ActiveWorkoutScreen from '../screens/tracking/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '../screens/tracking/WorkoutSummaryScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RoutesStack = createNativeStackNavigator<RoutesStackParamList>();
const TrackingStack = createNativeStackNavigator<TrackingStackParamList>();

// Routes Stack Navigator
function RoutesNavigator() {
  return (
    <RoutesStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.fonts.semiBold,
          fontSize: 18,
        },
      }}
    >
      <RoutesStack.Screen
        name="RoutesList"
        component={RoutesScreen}
        options={{
          title: 'My Routes',
        }}
      />
      <RoutesStack.Screen
        name="RoutePlanning"
        component={RoutePlanningScreen}
        options={({ route }) => ({
          title: route.params?.editRoute ? 'Edit Route' : 'Create Route',
          headerBackTitle: 'Routes',
        })}
      />
    </RoutesStack.Navigator>
  );
}

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="PasswordReset" component={PasswordResetScreen} 
      options={{headerShown: true, headerTitle: ''}}/>
    </AuthStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="UserSettings"
        component={UserSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="PasswordUpdate"
        component={PasswordUpdateScreen}
        options={{ title: 'Change Password' }}
      />
    </ProfileStack.Navigator>
  );
}

// Tracking Stack Navigator
function TrackingNavigator() {
  return (
    <TrackingStack.Navigator>
      <TrackingStack.Screen
        name="TrackingHome"
        component={TrackingScreen}
        options={{ 
          title: 'Track',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: TYPOGRAPHY.fonts.semiBold,
            fontSize: 18,
          },
        }}
      />
      <TrackingStack.Screen
        name="WorkoutSetup"
        component={WorkoutSetupScreen}
        options={{ 
          title: 'New Workout',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: TYPOGRAPHY.fonts.semiBold,
            fontSize: 18,
          },
        }}
      />
      <TrackingStack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <TrackingStack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{
          title: 'Workout Complete',
          headerBackVisible: false,
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: TYPOGRAPHY.fonts.semiBold,
            fontSize: 18,
          },
        }}
      />
    </TrackingStack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

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
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: TYPOGRAPHY.fonts.medium,
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.fonts.semiBold,
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
        }}
      />

      <Tab.Screen
        name="Routes"
        component={RoutesNavigator}
        options={{
          headerShown: false,
          title: 'Routes',
        }}
      />

      <Tab.Screen
        name="Track"
        component={TrackingNavigator}
        options={{
          headerShown: false,
          title: 'Track',
        }}
      />

      <Tab.Screen
        name="Steps"
        component={StepsScreen}
        options={{
          title: 'Steps',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
    
  );
}

// Root App Navigator
export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
