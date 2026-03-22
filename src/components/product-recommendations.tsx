"use client";

import { AlsoViewedSection, BoughtTogetherSection, BecauseYouViewedSection } from '@/components/recommendation-sections';

/**
 * Client wrapper for product page recommendation sections.
 * Loads recommendations lazily on the client side.
 */
export function ProductRecommendations({ productId, currentPrice }: {
  productId: string;
  currentPrice: number;
}) {
  return (
    <div className="space-y-8 md:space-y-12">
      <BoughtTogetherSection productId={productId} currentPrice={currentPrice} />
      <AlsoViewedSection productId={productId} />
      <BecauseYouViewedSection productId={productId} />
    </div>
  );
}
