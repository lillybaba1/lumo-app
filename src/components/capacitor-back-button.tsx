"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Handles Android hardware back button in Capacitor app.
 * Goes back in browser history or to home instead of closing the app.
 */
export function CapacitorBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run in Capacitor environment
    if (typeof window === 'undefined') return;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        // Listen for back button
        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          // If search modal is open, do nothing (modal's own listener handles it)
          if (document.querySelector('[data-mobile-search-modal="true"]')) {
            return;
          }

          // If we're on the homepage, minimize the app
          if (pathname === '/') {
            App.minimizeApp();
            return;
          }
          
          // If we can go back in history, do so
          if (canGoBack && window.history.length > 1) {
            window.history.back();
          } else {
            // Otherwise, go to homepage
            router.push('/');
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
  }, [router, pathname]);

  return null;
}

export default CapacitorBackButton;
