"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { defaultTheme, type Theme } from '@/lib/themes';

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
  previewTheme: string | null;
  setPreviewTheme: (themeId: string | null) => void;
  isPreviewMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme = defaultTheme.id }: ThemeProviderProps) {
  const [theme, setThemeState] = useState(initialTheme);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Apply theme to HTML element
  useEffect(() => {
    const activeTheme = previewTheme || theme;

    // Remove all theme data attributes
    document.documentElement.removeAttribute('data-theme');

    // Apply theme (skip if it's the default 'minimal-light')
    if (activeTheme && activeTheme !== 'minimal-light') {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
  }, [theme, previewTheme]);

  const setTheme = (themeId: string) => {
    setThemeState(themeId);
    // Persist to localStorage for client-side preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo-theme', themeId);
    }
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('lumo-theme');
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        previewTheme,
        setPreviewTheme,
        isPreviewMode: previewTheme !== null,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
