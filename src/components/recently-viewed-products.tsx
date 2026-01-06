"use client";

import { useEffect, useState } from 'react';
import { getRecentlyViewed, hasPreferenceConsent, useCookiePreferences } from '@/components/cookie-consent';
import ProductCard from '@/components/product-card';
import type { Product } from '@/lib/types';
import { History, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RecentlyViewedProductsProps {
  /** All products to filter from */
  allProducts: Product[];
  /** Maximum number of products to show */
  maxItems?: number;
}

/**
 * Shows recently viewed products.
 * - Only displays if user has preference cookies enabled
 * - Shows a message if preferences are disabled
 */
export function RecentlyViewedProducts({ allProducts, maxItems = 4 }: RecentlyViewedProductsProps) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const cookiePrefs = useCookiePreferences();

  useEffect(() => {
    // Check consent and load products
    const consent = hasPreferenceConsent();
    setHasConsent(consent);
    
    if (consent) {
      const recentIds = getRecentlyViewed();
      if (recentIds.length > 0) {
        // Filter and order products by recently viewed order
        const recent = recentIds
          .map(id => allProducts.find(p => p.id === id))
          .filter((p): p is Product => p !== undefined)
          .slice(0, maxItems);
        setRecentProducts(recent);
      }
    }
  }, [allProducts, maxItems, cookiePrefs]);

  // Don't render anything if user hasn't made a cookie choice yet
  if (hasConsent === null) return null;

  // Show limited functionality message if preferences rejected
  if (!hasConsent) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Recently Viewed</h2>
          </div>
          <div className="bg-muted/50 border border-dashed rounded-lg p-6 text-center">
            <Cookie className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm mb-3">
              Enable preference cookies to see your recently viewed products.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              This feature remembers what you&apos;ve looked at for a better shopping experience.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="#" onClick={(e) => {
                e.preventDefault();
                // Find and click the cookie settings button
                const cookieBtn = document.querySelector('[aria-label="Cookie Settings"]') as HTMLButtonElement;
                if (cookieBtn) cookieBtn.click();
              }}>
                <Cookie className="h-4 w-4 mr-2" />
                Manage Cookie Settings
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Don't show section if no recently viewed products
  if (recentProducts.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recently Viewed</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
