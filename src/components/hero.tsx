"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { HeroData, HeroProduct, Product } from '@/lib/types';
import Image from 'next/image';

type HeroSettings = {
  heroHeading?: string;
  heroTagline?: string;
  heroBackgroundImage?: string;
  heroImageObjectPosition?: string;
};

export default function Hero() {
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all data in parallel with aggressive cache-busting
    const timestamp = Date.now();
    Promise.all([
      fetch(`/api/settings?nocache=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }).then(res => res.json()),
      fetch(`/api/hero?nocache=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      }).then(res => res.json()),
      fetch(`/api/products?nocache=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      }).then(res => res.json())
    ])
      .then(([settingsData, heroDataResult, productsData]) => {
        setSettings(settingsData);
        setHeroData(heroDataResult);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load hero data:', err);
        setLoading(false);
      });
  }, []);

  // Default values if settings haven't loaded yet
  const heroHeading = settings?.heroHeading || 'Step into Lumo';
  const heroTagline = settings?.heroTagline || 'Discover exceptional products crafted with care. Your journey to quality starts here.';
  // Add aggressive cache-buster to hero image URL to prevent browser caching
  const baseHeroImage = settings?.heroBackgroundImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop';
  const cacheBuster = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const heroBackgroundImage = baseHeroImage.includes('?')
    ? `${baseHeroImage}&v=${cacheBuster}`
    : `${baseHeroImage}?v=${cacheBuster}`;
  const heroImageObjectPosition = settings?.heroImageObjectPosition || 'center';

  const getProductById = (id: string) => products.find(p => p.id === id);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{
        marginBottom: 'var(--spacing-2xl)',
      }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBackgroundImage})`,
          backgroundPosition: heroImageObjectPosition,
        }}
      >
        {/* Enhanced Gradient Overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Hero Products Overlay */}
      {heroData?.products && heroData.products.length > 0 && (
        <div className="absolute inset-0">
          {heroData.products
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((heroProduct) => {
              const product = getProductById(heroProduct.productId);
              if (!product) return null;

              return (
                <Link
                  key={heroProduct.id}
                  href={`/products/${product.id}`}
                  className="absolute group transition-transform hover:scale-105 hover:z-10"
                  style={{
                    left: `${heroProduct.position.x}%`,
                    top: `${heroProduct.position.y}%`,
                    width: `${heroProduct.size.width}px`,
                    height: `${heroProduct.size.height}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative w-full h-full bg-white rounded-lg shadow-xl overflow-hidden border-2 border-white/20 hover:border-primary/50 transition-all">
                    {/* Product Image */}
                    <div className="absolute inset-0">
                      {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                        <Image
                          src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                          alt={product.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>

                    {/* Product Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-semibold truncate mb-1">{product.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-white text-lg font-bold">${product.price.toFixed(2)}</p>
                        <div className="flex items-center gap-1 text-xs text-white/90">
                          <ShoppingBag className="h-3 w-3" />
                          <span>View</span>
                        </div>
                      </div>
                    </div>

                    {/* Hover ring effect */}
                    <div className="absolute inset-0 ring-2 ring-primary/0 group-hover:ring-primary/50 rounded-lg transition-all pointer-events-none" />
                  </div>
                </Link>
              );
            })}
        </div>
      )}

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl">
            {/* Heading */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{
                color: 'var(--color-text-inverse)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--font-weight-bold)',
                lineHeight: 'var(--line-height-tight)',
              }}
            >
              {heroHeading}
            </h1>

            {/* Tagline */}
            <p
              className="text-lg md:text-xl mb-8 max-w-xl"
              style={{
                color: 'var(--color-text-inverse)',
                opacity: 0.95,
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              {heroTagline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products?filter=new">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base font-semibold"
                  style={{
                    backgroundColor: 'var(--button-primary-bg)',
                    color: 'var(--button-primary-fg)',
                    borderRadius: 'var(--radius-button)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                  }}
                >
                  Shop New Arrivals
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/products">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base font-semibold"
                  style={{
                    backgroundColor: 'var(--button-secondary-bg)',
                    color: 'var(--color-text-inverse)',
                    borderColor: 'var(--color-text-inverse)',
                    borderRadius: 'var(--radius-button)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                  }}
                >
                  Browse Collections
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
