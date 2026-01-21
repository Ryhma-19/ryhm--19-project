import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { StepsProvider } from './src/contexts/steps/StepsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StepsProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </StepsProvider>
    </AuthProvider>
  );
}