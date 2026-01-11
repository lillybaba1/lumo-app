'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

// Generate a unique visitor ID
function generateVisitorId(): string {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('lumo_visitor_id') : null;
  if (stored) return stored;
  
  const id = 'v_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  if (typeof window !== 'undefined') {
    localStorage.setItem('lumo_visitor_id', id);
  }
  return id;
}

// Check if user has given analytics consent OR if no consent system interaction yet
// We track by default for basic analytics, but respect explicit opt-out
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if user has made any choice
  const hasConsented = localStorage.getItem('lumo-cookie-consent');
  
  // If user hasn't interacted with cookie consent yet, allow basic tracking
  // This tracks anonymous visits while respecting explicit opt-outs
  if (!hasConsented) return true; // Track by default until user opts out
  
  // Check specific analytics preference if they've set one
  const preferences = localStorage.getItem('lumo-cookie-preferences');
  if (!preferences) return true; // No preferences set, allow tracking
  
  try {
    const parsed = JSON.parse(preferences);
    // If user explicitly set analytics preference, respect it
    // If analytics key doesn't exist, default to true
    return parsed.analytics !== false;
  } catch {
    return true; // On parse error, default to tracking
  }
}

export function VisitorTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>('');
  const sessionStartRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>('');
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const geoDataRef = useRef<any>(null);

  // Track visit - only if analytics consent given
  const trackVisit = useCallback(async (pagePath: string, geoData: any = null) => {
    if (!visitorIdRef.current) {
      console.log('[VisitorTracker] No visitor ID, skipping track');
      return;
    }
    if (!hasAnalyticsConsent()) {
      console.log('[VisitorTracker] No analytics consent, skipping track');
      return;
    }
    
    console.log('[VisitorTracker] Tracking visit for:', visitorIdRef.current, 'path:', pagePath);
    
    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'visit',
          visitor_id: visitorIdRef.current,
          page_path: pagePath,
          referrer: document.referrer || null,
          consent_given: true,
          geo_data: geoData,
        }),
      });
      
      const result = await response.json();
      console.log('[VisitorTracker] Visit tracking response:', result);
    } catch (error) {
      console.error('[VisitorTracker] Failed to track visit:', error);
    }
  }, []);

  // Track page view - only if analytics consent given
  const trackPageView = useCallback(async (pagePath: string) => {
    if (!visitorIdRef.current) return;
    if (!hasAnalyticsConsent()) return; // Don't track without consent
    
    try {
      await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pageview',
          visitor_id: visitorIdRef.current,
          page_path: pagePath,
          page_title: document.title,
          referrer: lastPathRef.current || document.referrer,
        }),
      });
    } catch (error) {
      console.error('Failed to track pageview:', error);
    }
  }, []);

  // Send heartbeat to update session duration - only if analytics consent given
  const sendHeartbeat = useCallback(async () => {
    if (!visitorIdRef.current) return;
    if (!hasAnalyticsConsent()) return; // Don't track without consent
    
    const duration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    
    try {
      await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          visitor_id: visitorIdRef.current,
          duration,
        }),
      });
    } catch (error) {
      // Silently fail heartbeats
    }
  }, []);

  // Fetch geo data - try server first, then client-side fallback
  const fetchGeoData = useCallback(async (): Promise<any> => {
    try {
      // First, try to get geo data from our API (which uses server headers)
      const response = await fetch('/api/visitors');
      if (response.ok) {
        const data = await response.json();
        // If we got a valid IP (not localhost or unknown), use it
        if (data.ip && data.ip !== 'localhost' && data.ip !== 'unknown') {
          geoDataRef.current = data;
          return data;
        }
      }
      
      // Fallback: Get public IP directly from client-side service
      // This works when server can't detect IP (e.g., behind certain proxies)
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          const publicIp = ipData.ip;
          
          if (publicIp) {
            // Now get geo data for this IP
            const geoResponse = await fetch(`https://ipapi.co/${publicIp}/json/`);
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (!geoData.error) {
                const result = {
                  ip: publicIp,
                  country: geoData.country_name || 'Unknown',
                  country_code: geoData.country_code || null,
                  city: geoData.city || 'Unknown',
                  region: geoData.region || null,
                  latitude: geoData.latitude || null,
                  longitude: geoData.longitude || null,
                  timezone: geoData.timezone || null,
                  isp: geoData.org || null,
                };
                geoDataRef.current = result;
                return result;
              }
            }
          }
        }
      } catch (fallbackError) {
        console.error('Client-side IP lookup failed:', fallbackError);
      }
    } catch (error) {
      console.error('Failed to fetch geo data:', error);
    }
    return null;
  }, []);

  // Initialize tracking on mount
  useEffect(() => {
    visitorIdRef.current = generateVisitorId();
    sessionStartRef.current = Date.now();

    // Fetch geo data and track initial visit
    fetchGeoData().then((geoData) => {
      trackVisit(pathname, geoData);
    });

    // Set up heartbeat interval (every 30 seconds)
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    // Send heartbeat on page unload
    const handleBeforeUnload = () => {
      sendHeartbeat();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Listen for cookie consent updates - if user enables analytics after page load
    const handleConsentUpdate = (event: CustomEvent) => {
      const prefs = event.detail;
      if (prefs?.analytics === true) {
        // User just enabled analytics, track their visit now
        fetchGeoData().then((geoData) => {
          trackVisit(pathname, geoData);
        });
      }
    };
    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
      sendHeartbeat(); // Final heartbeat on unmount
    };
  }, [fetchGeoData, pathname, sendHeartbeat, trackVisit]);

  // Track page changes
  useEffect(() => {
    if (lastPathRef.current && lastPathRef.current !== pathname) {
      trackPageView(pathname);
    }
    lastPathRef.current = pathname;
  }, [pathname, trackPageView]);

  return null; // This component doesn't render anything
}

export default VisitorTracker;
