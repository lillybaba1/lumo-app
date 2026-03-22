"use client";

import { useTrackProductView } from '@/hooks/use-tracking';
import { addRecentlyViewed } from '@/components/cookie-consent';
import { useEffect } from 'react';

/**
 * Combined tracker: sends server-side tracking event AND stores
 * in localStorage cookie-consent recently-viewed (backwards-compat).
 */
export function ProductViewTracker({ productId, categoryId }: {
  productId: string;
  categoryId?: string;
}) {
  // Server-side tracking (intelligence engine)
  useTrackProductView(productId, categoryId);

  // Legacy localStorage tracking (for RecentlyViewedProducts component)
  useEffect(() => {
    const timer = setTimeout(() => {
      addRecentlyViewed(productId);
    }, 500);
    return () => clearTimeout(timer);
  }, [productId]);

  return null;
}
