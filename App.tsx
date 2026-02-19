import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { StepsProvider } from './src/contexts/steps/StepsContext';
import { MotionProvider } from './src/contexts/motion/MotionContext';
import AppNavigator from './src/navigation/AppNavigator';

//ErrorBoundary kept from testing

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  state = { hasError: false, message: undefined as string | undefined };

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught:', error?.message ?? error);
    console.error('Component stack:', errorInfo?.componentStack);
    this.setState({ hasError: true, message: error?.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 16 }}>
          <Text>Something went wrong.</Text>
          {this.state.message ? <Text>{this.state.message}</Text> : null}
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StepsProvider>
          <MotionProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </MotionProvider>
        </StepsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}