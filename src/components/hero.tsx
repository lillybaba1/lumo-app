"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { HeroData, HeroProduct, Product } from '@/lib/types';
import Image from 'next/image';
import HeroAnnouncement, { HeroAnnouncementSettings } from './hero-announcement';

type HeroSettings = {
  heroHeading?: string;
  heroTagline?: string;
  heroBackgroundImage?: string;
  heroImageObjectPosition?: string;
  heroImageFit?: 'cover' | 'contain';
  heroHeadingColor?: string;
  heroTaglineColor?: string;
  heroHeadingPosition?: { x: number; y: number };
  heroTaglinePosition?: { x: number; y: number };
  heroCtaPosition?: { x: number; y: number };
  // Button colors
  heroButton1BgColor?: string;
  heroButton1TextColor?: string;
  heroButton2BgColor?: string;
  heroButton2TextColor?: string;
  heroButton2BorderColor?: string;
  heroButton3BgColor?: string;
  heroButton3TextColor?: string;
} & HeroAnnouncementSettings;

interface HeroProps {
  initialSettings?: HeroSettings;
}

export default function Hero({ initialSettings }: HeroProps = {}) {
  const [settings, setSettings] = useState<HeroSettings | null>(initialSettings || null);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileIndex, setMobileIndex] = useState(0);

  // Use initial settings for immediate render, then fetch fresh data
  const heroHeading = settings?.heroHeading || 'Step into JulaZone';
  const heroTagline = settings?.heroTagline || 'Discover exceptional products crafted with care. Your journey to quality starts here.';
  const heroBackgroundImage = settings?.heroBackgroundImage || initialSettings?.heroBackgroundImage || '';
  const heroImageObjectPosition = settings?.heroImageObjectPosition || 'center';
  const heroImageFit = settings?.heroImageFit || 'cover';
  const heroHeadingColor = settings?.heroHeadingColor || '#ffffff';
  const heroTaglineColor = settings?.heroTaglineColor || '#ffffff';
  const heroHeadingPosition = settings?.heroHeadingPosition || { x: 5, y: 35 };
  const heroTaglinePosition = settings?.heroTaglinePosition || { x: 5, y: 50 };
  const heroCtaPosition = settings?.heroCtaPosition || { x: 5, y: 65 };
  
  // Button colors
  const heroButton1BgColor = settings?.heroButton1BgColor || '#3b82f6';
  const heroButton1TextColor = settings?.heroButton1TextColor || '#ffffff';
  const heroButton2BgColor = settings?.heroButton2BgColor || 'transparent';
  const heroButton2TextColor = settings?.heroButton2TextColor || '#ffffff';
  const heroButton2BorderColor = settings?.heroButton2BorderColor || '#ffffff';
  const heroButton3BgColor = settings?.heroButton3BgColor || '#3b82f6';
  const heroButton3TextColor = settings?.heroButton3TextColor || '#ffffff';

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

  if (loading) {
    return (
      <div 
        className="relative w-full overflow-hidden z-0"
        style={{ 
          minHeight: '400px',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* Show hero image immediately while loading other content */}
        {heroBackgroundImage ? (
          <div className="absolute inset-0" style={{ backgroundColor: heroImageFit === 'contain' ? '#1a1a2e' : undefined }}>
            <Image
              src={heroBackgroundImage}
              alt="Hero background"
              fill
              priority
              className={heroImageFit === 'contain' ? 'object-contain' : 'object-cover'}
              style={{ objectPosition: heroImageObjectPosition }}
              unoptimized
            />
            {heroImageFit === 'cover' && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600" />
        )}
        
        {/* Loading content overlay */}
        <div className="relative h-full flex items-center py-12 md:py-32 px-6 md:px-12">
          <div className="animate-pulse space-y-4 w-full max-w-lg">
            <div className="h-10 md:h-16 bg-white/30 rounded w-3/4"></div>
            <div className="h-5 md:h-6 bg-white/20 rounded w-full"></div>
            <div className="h-5 md:h-6 bg-white/20 rounded w-2/3"></div>
            <div className="flex gap-3 mt-6">
              <div className="h-11 w-40 bg-white/30 rounded-lg"></div>
              <div className="h-11 w-40 bg-white/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden z-0"
      style={{ width: '100%', maxWidth: '100%' }}
    >
      {/* Background Image */}
      {heroBackgroundImage ? (
        <div className="absolute inset-0" style={{ backgroundColor: heroImageFit === 'contain' ? '#1a1a2e' : undefined }}>
          <Image
            src={heroBackgroundImage}
            alt="Hero background"
            fill
            priority
            className={heroImageFit === 'contain' ? 'object-contain' : 'object-cover'}
            style={{ objectPosition: heroImageObjectPosition }}
            unoptimized
          />
          {/* Enhanced Gradient Overlay for better text contrast - only for cover mode */}
          {heroImageFit === 'cover' && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600" />
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

      {/* Content - Positioned elements */}
      <div className="relative w-full min-h-[520px] md:min-h-[500px]">
        {/* Hero Announcement Overlay */}
        {settings && <HeroAnnouncement settings={settings} />}

        {/* Mobile Layout - Flexbox based for better visibility */}
        <div className="md:hidden flex flex-col justify-center px-6 pt-16 pb-8 min-h-[520px]">
          <h1
            className="text-3xl sm:text-4xl font-bold max-w-lg mb-4"
            style={{
              color: heroHeadingColor,
              fontFamily: 'var(--font-heading)',
              fontWeight: 'var(--font-weight-bold)',
              lineHeight: 'var(--line-height-tight)',
            }}
          >
            {heroHeading}
          </h1>

          <p
            className="text-base sm:text-lg max-w-md mb-6"
            style={{
              color: heroTaglineColor,
              opacity: 0.95,
              lineHeight: 'var(--line-height-relaxed)',
            }}
          >
            {heroTagline}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/products?filter=new">
              <Button
                size="lg"
                className="w-full sm:w-auto text-sm font-semibold h-11"
                style={{
                  backgroundColor: heroButton1BgColor,
                  color: heroButton1TextColor,
                  borderRadius: 'var(--radius-button)',
                  padding: '0 var(--spacing-xl)',
                }}
              >
                Shop New Arrivals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/products">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-sm font-semibold h-11"
                style={{
                  backgroundColor: heroButton2BgColor,
                  color: heroButton2TextColor,
                  borderColor: heroButton2BorderColor,
                  borderRadius: 'var(--radius-button)',
                  padding: '0 var(--spacing-xl)',
                }}
              >
                Browse Collections
              </Button>
            </Link>

            {heroData?.heroLabelText && (
              <Link href="/products?filter=featured">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-sm font-semibold h-11 gap-2 rounded-full shadow-lg"
                  style={{
                    backgroundColor: heroButton3BgColor,
                    color: heroButton3TextColor,
                    borderRadius: 'var(--radius-button)',
                    padding: '0 var(--spacing-xl)',
                  }}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {heroData.heroLabelText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Desktop Layout - Absolutely positioned */}
        {/* Heading - Absolutely positioned */}
        <h1
          className="hidden md:block absolute text-6xl lg:text-7xl font-bold max-w-2xl px-4"
          style={{
            left: `${heroHeadingPosition.x}%`,
            top: `${heroHeadingPosition.y}%`,
            transform: 'translateY(-50%)',
            color: heroHeadingColor,
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          {heroHeading}
        </h1>

        {/* Tagline - Absolutely positioned */}
        <p
          className="hidden md:block absolute text-xl max-w-xl px-4"
          style={{
            left: `${heroTaglinePosition.x}%`,
            top: `${heroTaglinePosition.y}%`,
            transform: 'translateY(-50%)',
            color: heroTaglineColor,
            opacity: 0.95,
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          {heroTagline}
        </p>

        {/* CTAs - Absolutely positioned */}
        <div 
          className="hidden md:flex absolute flex-row gap-4 px-4"
          style={{
            left: `${heroCtaPosition.x}%`,
            top: `${heroCtaPosition.y}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <Link href="/products?filter=new">
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm md:text-base font-semibold h-10 md:h-11"
              style={{
                backgroundColor: heroButton1BgColor,
                color: heroButton1TextColor,
                borderRadius: 'var(--radius-button)',
                padding: '0 var(--spacing-xl)',
              }}
            >
              Shop New Arrivals
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>

          <Link href="/products">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-sm md:text-base font-semibold h-10 md:h-11"
              style={{
                backgroundColor: heroButton2BgColor,
                color: heroButton2TextColor,
                borderColor: heroButton2BorderColor,
                borderRadius: 'var(--radius-button)',
                padding: '0 var(--spacing-xl)',
              }}
            >
              Browse Collections
            </Button>
          </Link>

          {heroData?.heroLabelText && (
            <Link href="/products?filter=featured">
              <Button
                size="lg"
                className="w-full sm:w-auto text-sm md:text-base font-semibold h-10 md:h-11 gap-2 rounded-full shadow-lg"
                style={{
                  backgroundColor: heroButton3BgColor,
                  color: heroButton3TextColor,
                  borderRadius: 'var(--radius-button)',
                  padding: '0 var(--spacing-xl)',
                }}
              >
                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
                {heroData.heroLabelText}
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile carousel for hero products */}
      {mobileProducts.length > 0 && (
        <div className="md:hidden mt-2 px-4 pb-6">
          <div className="flex items-center justify-between mb-2">
            <Link href="/products?filter=featured" className="flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white">
              <ShoppingBag className="h-3 w-3" />
              {heroData?.heroLabelText || 'Featured'}
              <ArrowRight className="h-3 w-3" />
            </Link>
            {mobileProducts.length > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => setMobileIndex((prev) => (prev - 1 + mobileProducts.length) % mobileProducts.length)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => setMobileIndex((prev) => (prev + 1) % mobileProducts.length)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-white/20 bg-white/90 backdrop-blur shadow-lg">
            <div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
            >
              {mobileProducts.map(({ product }) => (
                <Link
                  href={`/products/${product.id}`}
                  key={product.id}
                  className="min-w-full flex-shrink-0 flex h-24"
                >
                  <div className="relative w-24 h-24 flex-shrink-0">
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
                  <div className="p-3 flex flex-col justify-center flex-grow min-w-0">
                    <p className="text-sm font-semibold truncate mb-1">{product.name}</p>
                    <p className="text-sm font-bold text-primary">${product.price.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <ShoppingBag className="h-3 w-3" />
                        <span>View Details</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          {mobileProducts.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {mobileProducts.map((_, idx) => (
                <button
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === mobileIndex ? 'bg-white' : 'bg-white/40'}`}
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
