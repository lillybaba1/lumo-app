"use client";

import { useEffect } from 'react';
import { addRecentlyViewed } from '@/components/cookie-consent';

interface RecentlyViewedTrackerProps {
  productId: string;
}

/**
 * Client component that tracks when a product is viewed.
 * Only stores data if user has consented to preference cookies.
 */
export function RecentlyViewedTracker({ productId }: RecentlyViewedTrackerProps) {
  useEffect(() => {
    // Small delay to ensure consent state is loaded
    const timer = setTimeout(() => {
      addRecentlyViewed(productId);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [productId]);

  return null;
}
