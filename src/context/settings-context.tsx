"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  currency?: string;
  storeName?: string;
  // Footer settings
  storeTagline?: string;
  footerDescription?: string;
  footerCopyright?: string;
  footerTagline?: string;
  footerEmail?: string;
  footerPhone?: string;
  footerWhatsApp?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialX?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  trustBadge1Title?: string;
  trustBadge1Subtitle?: string;
  trustBadge2Title?: string;
  trustBadge2Subtitle?: string;
  trustBadge3Title?: string;
  trustBadge3Subtitle?: string;
  trustBadge4Title?: string;
  trustBadge4Subtitle?: string;
  trustBadge5Title?: string;
  trustBadge5Subtitle?: string;
  footerPaymentMethods?: string;
  footerDeliveryCountries?: string;
  // Allow additional dynamic keys from admin settings
  [key: string]: unknown;
}

interface UserData {
  uid: string;
  email: string;
  role: string;
  name: string;
  hasBusinessAccount?: boolean;
  businessStatus?: string;
}

interface AuthState {
  userId?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: UserData | null;
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
        user: authData.authenticated ? authData.user : null,
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
