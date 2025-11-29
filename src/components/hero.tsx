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
  const [mobileIndex, setMobileIndex] = useState(0);

  useEffect(() => {
    // Fetch data with cache-busting but don't fail all if one request fails
    const load = async () => {
      const timestamp = Date.now();
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      } as const;

      const requests = {
        settings: fetch(`/api/settings?nocache=${timestamp}`, { cache: 'no-store', headers }).then(async (res) => {
          if (!res.ok) throw new Error(`Settings request failed: ${res.status}`);
          return res.json();
        }),
        hero: fetch(`/api/hero?nocache=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }).then(async (res) => {
          if (!res.ok) throw new Error(`Hero request failed: ${res.status}`);
          return res.json();
        }),
        products: fetch(`/api/products?nocache=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }).then(async (res) => {
          if (!res.ok) throw new Error(`Products request failed: ${res.status}`);
          return res.json();
        }),
      };

      const [settingsResult, heroResult, productsResult] = await Promise.allSettled([
        requests.settings,
        requests.hero,
        requests.products,
      ]);

      if (settingsResult.status === 'fulfilled') {
        setSettings(settingsResult.value);
      } else {
        console.error('Failed to load settings:', settingsResult.reason);
      }

      if (heroResult.status === 'fulfilled') {
        setHeroData(heroResult.value);
      } else {
        console.error('Failed to load hero data:', heroResult.reason);
      }

      if (productsResult.status === 'fulfilled') {
        setProducts(Array.isArray(productsResult.value) ? productsResult.value : []);
      } else {
        console.error('Failed to load products:', productsResult.reason);
      }

      setLoading(false);
    };

    load().catch(err => {
      console.error('Failed to load hero section:', err);
      setLoading(false);
    });
  }, []);

  // Default values if settings haven't loaded yet
  const heroHeading = settings?.heroHeading || 'Step into Lumo';
  const heroTagline = settings?.heroTagline || 'Discover exceptional products crafted with care. Your journey to quality starts here.';
  // Add aggressive cache-buster to hero image URL to prevent browser caching
  const baseHeroImage = settings?.heroBackgroundImage || '';
  const cacheBuster = baseHeroImage ? `${Date.now()}_${Math.random().toString(36).substring(7)}` : '';
  const heroBackgroundImage = baseHeroImage
    ? baseHeroImage.includes('?')
      ? `${baseHeroImage}&v=${cacheBuster}`
      : `${baseHeroImage}?v=${cacheBuster}`
    : '';
  const heroImageObjectPosition = settings?.heroImageObjectPosition || 'center';

  const getProductById = (id: string) => products.find(p => p.id === id);
  const heroProducts = (heroData?.products || []).slice().sort((a, b) => a.displayOrder - b.displayOrder);

  const mobileProducts = heroProducts
    .map((hp) => {
      const product = getProductById(hp.productId);
      return product ? { product, hp } : null;
    })
    .filter(Boolean) as { product: Product; hp: HeroProduct }[];

  useEffect(() => {
    if (mobileIndex >= mobileProducts.length) {
      setMobileIndex(0);
    }
  }, [mobileProducts.length, mobileIndex]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{
        marginBottom: 'var(--spacing-2xl)',
      }}
    >
      {/* Background Image */}
      {heroBackgroundImage ? (
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
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      )}

      {/* Hero Label */}
      {heroData?.heroLabelText && (
        <div
          className="absolute hidden md:flex"
          style={{
            left: `${heroData.heroLabelPosition?.x ?? 10}%`,
            top: `${heroData.heroLabelPosition?.y ?? 15}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
          }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-sm font-semibold text-slate-900 shadow-lg">
            {heroData.heroLabelText}
          </span>
        </div>
      )}

      {/* Hero Products Overlay - desktop */}
      {heroProducts.length > 0 && (
        <div className="absolute inset-0 hidden md:block">
          {heroProducts.map((heroProduct) => {
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

      {/* Mobile carousel for hero products */}
      {mobileProducts.length > 0 && (
        <div className="md:hidden mt-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{heroData?.heroLabelText || 'Featured'}</span>
            {mobileProducts.length > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileIndex((prev) => (prev - 1 + mobileProducts.length) % mobileProducts.length)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileIndex((prev) => (prev + 1) % mobileProducts.length)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border bg-white/80 backdrop-blur">
            <div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
            >
              {mobileProducts.map(({ product }) => (
                <Link
                  href={`/products/${product.id}`}
                  key={product.id}
                  className="min-w-full flex-shrink-0"
                >
                  <div className="relative w-full aspect-[4/3]">
                    {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                      <Image
                        src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                        alt={product.name}
                        fill
                        className="object-cover rounded-t-xl"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          {mobileProducts.length > 1 && (
            <div className="flex justify-center gap-2 mt-2">
              {mobileProducts.map((_, idx) => (
                <button
                  key={idx}
                  className={`h-2 w-2 rounded-full ${idx === mobileIndex ? 'bg-primary' : 'bg-muted'}`}
                  onClick={() => setMobileIndex(idx)}
                  aria-label={`Go to hero product ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
