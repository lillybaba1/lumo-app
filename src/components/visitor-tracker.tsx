'use client';

import { useEffect, useRef, useCallback } from 'react';
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

// Check if user has given consent
function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem('lumo_cookie_consent');
  if (!consent) return false;
  try {
    const parsed = JSON.parse(consent);
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

export function VisitorTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>('');
  const sessionStartRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>('');
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const geoDataRef = useRef<any>(null);

  // Track visit
  const trackVisit = useCallback(async (pagePath: string, geoData: any = null) => {
    if (!visitorIdRef.current) return;
    
    try {
      await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'visit',
          visitor_id: visitorIdRef.current,
          page_path: pagePath,
          referrer: document.referrer || null,
          consent_given: hasConsent(),
          geo_data: geoData,
        }),
      });
    } catch (error) {
      console.error('Failed to track visit:', error);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async (pagePath: string) => {
    if (!visitorIdRef.current) return;
    
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

  // Send heartbeat to update session duration
  const sendHeartbeat = useCallback(async () => {
    if (!visitorIdRef.current) return;
    
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

  // Fetch geo data
  const fetchGeoData = useCallback(async (): Promise<any> => {
    try {
      const response = await fetch('/api/visitors');
      if (response.ok) {
        const data = await response.json();
        geoDataRef.current = data;
        return data;
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

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
