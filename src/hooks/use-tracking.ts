"use client";

import { useCallback, useEffect, useRef } from 'react';

/**
 * Get or create a session ID for anonymous tracking.
 * Stored in sessionStorage so it persists during one browser session.
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('jz_session_id');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem('jz_session_id', sid);
  }
  return sid;
}

type TrackEvent = {
  eventType: 'view' | 'cart_add' | 'search' | 'wishlist_add' | 'wishlist_remove';
  productId?: string;
  categoryId?: string;
  searchQuery?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Send a tracking event to the server.
 * Uses sendBeacon for reliability (works even when navigating away).
 * Falls back to fetch if sendBeacon unavailable.
 */
function sendTrackEvent(event: TrackEvent) {
  const payload = JSON.stringify({
    ...event,
    sessionId: getSessionId(),
  });

  // sendBeacon is more reliable for tracking (survives page navigations)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/track', blob);
    if (sent) return;
  }

  // Fallback: fire-and-forget fetch
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Hook: Track a product view when the component mounts.
 * Debounces: won't re-track if the same product was tracked in the last 30 seconds.
 */
export function useTrackProductView(productId: string | undefined, categoryId?: string) {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    if (trackedRef.current === productId) return;

    // Debounce: check if recently tracked
    const key = `jz_view_${productId}`;
    const lastTracked = sessionStorage.getItem(key);
    if (lastTracked && Date.now() - parseInt(lastTracked) < 30_000) return;

    trackedRef.current = productId;
    sessionStorage.setItem(key, Date.now().toString());

    sendTrackEvent({
      eventType: 'view',
      productId,
      categoryId,
    });
  }, [productId, categoryId]);
}

/**
 * Hook: Returns tracking functions for cart, search, and wishlist events.
 */
export function useTracking() {
  const trackCartAdd = useCallback((productId: string, metadata?: Record<string, unknown>) => {
    sendTrackEvent({ eventType: 'cart_add', productId, metadata });
  }, []);

  const trackSearch = useCallback((query: string) => {
    if (query.trim().length < 2) return;
    sendTrackEvent({ eventType: 'search', searchQuery: query.trim() });
  }, []);

  const trackWishlistAdd = useCallback((productId: string) => {
    sendTrackEvent({ eventType: 'wishlist_add', productId });
  }, []);

  const trackWishlistRemove = useCallback((productId: string) => {
    sendTrackEvent({ eventType: 'wishlist_remove', productId });
  }, []);

  return {
    trackCartAdd,
    trackSearch,
    trackWishlistAdd,
    trackWishlistRemove,
  };
}
