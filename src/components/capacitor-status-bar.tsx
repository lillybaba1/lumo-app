"use client";

import { useEffect } from 'react';

/**
 * Initializes the Capacitor StatusBar plugin on Android.
 * Ensures the status bar does NOT overlay the WebView content.
 */
export function CapacitorStatusBar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initStatusBar = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        
        // Prevent status bar from overlaying the WebView
        await StatusBar.setOverlaysWebView({ overlay: false });
        
        // Set status bar style and color
        await StatusBar.setBackgroundColor({ color: '#a21caf' });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        // Not running in Capacitor or plugin not available — ignore
      }
    };

    initStatusBar();
  }, []);

  return null;
}

export default CapacitorStatusBar;
