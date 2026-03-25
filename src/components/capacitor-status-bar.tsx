"use client";

import { useEffect } from 'react';

/**
 * Initializes the Capacitor StatusBar plugin on Android.
 * Ensures the status bar does NOT overlay the WebView content.
 * Sets a CSS variable for the status bar height so the header can offset itself.
 */
export function CapacitorStatusBar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initStatusBar = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { StatusBar, Style } = await import('@capacitor/status-bar');
        
        // Prevent status bar from overlaying the WebView
        await StatusBar.setOverlaysWebView({ overlay: false });
        
        // Set status bar to white with dark icons
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.setStyle({ style: Style.Light });

        // Get status bar height and set CSS variable for web header offset
        const info = await StatusBar.getInfo();
        // Android status bar is typically 24-28dp
        const statusBarHeight = info?.visible !== false ? 28 : 0;
        document.documentElement.style.setProperty('--capacitor-status-bar-height', `${statusBarHeight}px`);
      } catch {
        // Not running in Capacitor or plugin not available — ignore
      }
    };

    initStatusBar();
  }, []);

  return null;
}

export default CapacitorStatusBar;
