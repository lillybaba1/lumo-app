"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  currency?: string;
  storeName?: string;
  // Add other commonly used settings
}

interface AuthState {
  userId?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface SettingsContextType {
  settings: Settings;
  auth: AuthState;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Cache for settings to avoid re-fetching on navigation
let settingsCache: Settings | null = null;
let authCache: AuthState | null = null;
let fetchPromise: Promise<void> | null = null;

export function SettingsProvider({ 
  children,
  initialSettings,
}: { 
  children: ReactNode;
  initialSettings?: Settings;
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings || settingsCache || {});
  const [auth, setAuth] = useState<AuthState>(authCache || { isAuthenticated: false, isLoading: true });
  const [isLoading, setIsLoading] = useState(!settingsCache);

  useEffect(() => {
    // If already fetching or have cache, don't fetch again
    if (fetchPromise) {
      fetchPromise.then(() => {
        if (settingsCache) setSettings(settingsCache);
        if (authCache) setAuth(authCache);
        setIsLoading(false);
      });
      return;
    }

    if (settingsCache && authCache) {
      setSettings(settingsCache);
      setAuth(authCache);
      setIsLoading(false);
      return;
    }

    // Fetch both settings and auth in parallel
    fetchPromise = Promise.all([
      fetch('/api/settings').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch('/api/auth/me', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : { authenticated: false }).catch(() => ({ authenticated: false })),
    ]).then(([settingsData, authData]) => {
      settingsCache = settingsData;
      authCache = {
        userId: authData.authenticated ? authData.user?.uid : undefined,
        isAuthenticated: authData.authenticated || false,
        isLoading: false,
      };
      setSettings(settingsCache);
      setAuth(authCache);
      setIsLoading(false);
      fetchPromise = null;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, auth, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Optional: Hook to invalidate cache (call after settings update)
export function invalidateSettingsCache() {
  settingsCache = null;
  authCache = null;
  fetchPromise = null;
}
