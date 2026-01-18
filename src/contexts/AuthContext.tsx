import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { AuthService } from '../services/firebase/auth.service';
import { User, UserPreferences } from '../types';
import { CONFIG } from '../constants/config';

// Context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props type
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  

  // Listen for auth state changes
  useEffect(() => {
    if (CONFIG.DEV_AUTH_BYPASS) {
      const preferences: UserPreferences = {
        units: 'metric',
        notifications: true,
        weatherAlerts: true,
        theme: 'dark',
      }
      const date = new Date("2021-03-25")
      const devUser: User = {
        id: 'dev-user',
        email: 'dev@test.local',
        displayName: 'User',
        createdAt: date,
        preferences: preferences,
      };

      setUser(devUser);
      setLoading(false);

      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch profile
        const userProfile = await AuthService.getUserProfile(firebaseUser.uid);
        setUser(userProfile);
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  const handleSignUp = async (email: string, password: string, displayName: string): Promise<void> => {
    const newUser = await AuthService.signUp(email, password, displayName);
    setUser(newUser);
  };

  const handleSignIn = async (email: string, password: string): Promise<void> => {
    const signedInUser = await AuthService.signIn(email, password);
    setUser(signedInUser);
  };

  const handleSignOut = async (): Promise<void> => {
    await AuthService.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}