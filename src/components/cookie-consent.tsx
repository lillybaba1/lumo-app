"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, X, Shield, FileText } from 'lucide-react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'lumo-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'lumo-cookie-preferences';
const USER_CONSENT_KEY = 'lumo-user-consent';

export interface CookiePreferences {
  necessary: boolean; // Always true, required for site function
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
}

export interface UserConsent {
  // Data Processing Consent (aligned with Gambian business practices)
  dataProcessing: boolean;      // Consent to process personal data
  dataSharing: boolean;         // Consent to share data with delivery partners
  marketingComms: boolean;      // Consent to receive marketing communications
  orderUpdates: boolean;        // Consent to receive order/shipping updates (usually required)
  
  // E-commerce specific
  termsAccepted: boolean;       // Terms and Conditions accepted
  returnPolicyAccepted: boolean; // Return/Refund policy accepted
  shippingPolicyAccepted: boolean; // Shipping policy accepted
  
  // Timestamps
  consentTimestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

const defaultCookiePreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
  timestamp: '',
};

const defaultUserConsent: UserConsent = {
  dataProcessing: false,
  dataSharing: false,
  marketingComms: false,
  orderUpdates: true, // Default to true as it's essential for orders
  termsAccepted: false,
  returnPolicyAccepted: false,
  shippingPolicyAccepted: false,
  consentTimestamp: '',
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultCookiePreferences);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const saved = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (e) {
          // Invalid saved preferences
        }
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    const updatedPrefs = { ...prefs, timestamp: new Date().toISOString() };
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedPrefs));
    setPreferences(updatedPrefs);
    setShowBanner(false);
    setShowSettings(false);

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: updatedPrefs }));
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: '',
    });
  };

  const acceptNecessary = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: '',
    });
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6">
      <Card className="mx-auto max-w-2xl shadow-2xl border-2">
        <CardContent className="p-4 md:p-6">
          {!showSettings ? (
            // Main Banner
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">We Value Your Privacy</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    JulaZone uses cookies and similar technologies to enhance your shopping experience, 
                    analyze site traffic, and personalize content. In accordance with The Gambia&apos;s 
                    consumer protection guidelines, we respect your right to privacy.
                    <Link 
                      href="/pages/privacy" 
                      className="text-primary hover:underline ml-1"
                      onClick={() => {
                        // Close the banner when navigating to privacy page
                        setShowBanner(false);
                      }}
                    >
                      View our Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={acceptAll} className="flex-1">
                  Accept All
                </Button>
                <Button onClick={acceptNecessary} variant="outline" className="flex-1">
                  Necessary Only
                </Button>
                <Button onClick={() => setShowSettings(true)} variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Cookie Preferences</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="font-medium">Essential Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Required for secure shopping, cart, and checkout
                    </p>
                  </div>
                  <Switch checked disabled />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="font-medium">Analytics Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Help us understand how customers use our store
                    </p>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, analytics: checked })
                    }
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="font-medium">Marketing Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Used to show relevant product recommendations
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, marketing: checked })
                    }
                  />
                </div>

                {/* Preference Cookies */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="font-medium">Preference Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Remember your settings (language, currency, location)
                    </p>
                  </div>
                  <Switch
                    checked={preferences.preferences}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, preferences: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={saveCustomPreferences} className="flex-1">
                  Save Preferences
                </Button>
                <Button onClick={acceptAll} variant="outline" className="flex-1">
                  Accept All
                </Button>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                Your privacy choices comply with The Gambia consumer protection standards
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to get cookie preferences
export function useCookiePreferences(): CookiePreferences | null {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        // Invalid
      }
    }

    const handleUpdate = (e: CustomEvent<CookiePreferences>) => {
      setPreferences(e.detail);
    };

    window.addEventListener('cookieConsentUpdated', handleUpdate as EventListener);
    return () => window.removeEventListener('cookieConsentUpdated', handleUpdate as EventListener);
  }, []);

  return preferences;
}

// Hook to get and manage user consent
export function useUserConsent() {
  const [consent, setConsent] = useState<UserConsent | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(USER_CONSENT_KEY);
    if (saved) {
      try {
        setConsent(JSON.parse(saved));
      } catch (e) {
        // Invalid
      }
    }
  }, []);

  const updateConsent = (updates: Partial<UserConsent>) => {
    const updated = {
      ...defaultUserConsent,
      ...consent,
      ...updates,
      consentTimestamp: new Date().toISOString(),
    };
    localStorage.setItem(USER_CONSENT_KEY, JSON.stringify(updated));
    setConsent(updated);
    return updated;
  };

  return { consent, updateConsent };
}
