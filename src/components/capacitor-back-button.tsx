"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Handles Android hardware back button in Capacitor app.
 * Goes back in browser history instead of closing the app.
 */
export function CapacitorBackButton() {
  const router = useRouter();

  useEffect(() => {
    // Only run in Capacitor environment
    if (typeof window === 'undefined') return;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        // Listen for back button
        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            // Go back in history
            window.history.back();
          } else {
            // If we're at the root, minimize the app (don't close)
            App.minimizeApp();
          }
        });

        return () => {
          listener.remove();
        };
      } catch (error) {
        // Not running in Capacitor, ignore
        console.log('Not running in Capacitor environment');
      }
    };

    setupBackButton();
  }, [router]);

  return null;
}

export default CapacitorBackButton;
