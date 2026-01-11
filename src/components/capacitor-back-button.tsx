"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { App as CapacitorApp } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';

/**
 * Handles Android hardware back button in Capacitor app.
 * Goes back in browser history or to home instead of closing the app.
 */
export function CapacitorBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Keep ref synchronized with current pathname
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // Only run in client environment
    if (typeof window === 'undefined') return;

    let backButtonListener: PluginListenerHandle | undefined;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        // Listen for back button
        // We register ONLY ONE listener that references the current pathname via ref
        backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
          const currentPath = pathnameRef.current;

          // If search modal is open, do nothing (modal's own listener handles it)
          if (document.querySelector('[data-mobile-search-modal="true"]')) {
            return;
          }

          // If we're on the homepage, minimize the app (standard Android behavior)
          if (currentPath === '/') {
            App.minimizeApp();
            return;
          }
          
          // If we can go back in history, do so
          if (canGoBack) {
            window.history.back();
          } else {
            // Otherwise, fallback to homepage
            router.push('/');
          }
        });

      } catch (error) {
        console.log('Not running in Capacitor environment or failed to load App plugin');
      }
    };

    setupBackButton();

    // Cleanup listener on unmount
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, []); // Run only once on mount

  return null;
}

export default CapacitorBackButton;
