import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme, type Theme as NavigationTheme } from '@react-navigation/native';

const STORAGE_KEY = 'darkMode';

type AppColors = {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  inputBg: string;
  inputBorder: string;
  primary: string;
  success: string;
  danger: string;
  warning: string;
};

type AppTheme = {
  isDark: boolean;
  colors: AppColors;
};

type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  colors: AppColors;
  navigationTheme: NavigationTheme;
  setDarkMode: (enabled: boolean) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const lightColors: AppColors = {
  background: '#f5f7fa',
  card: '#ffffff',
  text: '#1a1a2e',
  textMuted: '#666666',
  border: '#eeeeee',
  inputBg: '#f8fafc',
  inputBorder: '#e2e8f0',
  primary: '#3498db',
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#e67e22',
};

const darkColors: AppColors = {
  background: '#0b1220',
  card: '#0f1b33',
  text: '#e6edf3',
  textMuted: '#a0a7b4',
  border: '#22314a',
  inputBg: '#0b152b',
  inputBorder: '#22314a',
  primary: '#4aa3df',
  success: '#33d17a',
  danger: '#ff6b6b',
  warning: '#ffa94d',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'true') setIsDark(true);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const theme: AppTheme = useMemo(() => ({ isDark, colors }), [isDark, colors]);

  const navigationTheme: NavigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;

    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colors, isDark]);

  const setDarkMode = async (enabled: boolean) => {
    setIsDark(enabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isDark, colors, navigationTheme, setDarkMode }),
    [theme, isDark, colors, navigationTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
