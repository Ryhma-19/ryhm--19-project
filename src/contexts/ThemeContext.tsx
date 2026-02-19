import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage/storage.service';

export type ThemeType = 'normal' | 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeType>('normal');
  const [loading, setLoading] = useState(true);

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await StorageService.load<ThemeType>('THEME_TYPE');
      if (savedTheme && ['normal', 'dark', 'light'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await StorageService.save('THEME_TYPE', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
      throw error;
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
