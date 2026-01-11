"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Sparkles, TrendingUp, Tag } from 'lucide-react';
import { Product } from '@/lib/types';
import Image from 'next/image';
import HeroAnnouncement, { HeroAnnouncementSettings } from './hero-announcement';
import { HERO_BLUR_DATA_URL, PRODUCT_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils';

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

// Amazon-style mini product card widget
function HeroProductWidget({ 
  title, 
  icon: Icon, 
  products, 
  link
}: { 
  title: string; 
  icon: React.ElementType;
  products: Product[]; 
  link: string;
}) {
  if (products.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 min-w-[160px] max-w-[200px] flex-shrink-0">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-bold text-gray-900 truncate">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {products.slice(0, 4).map((product) => {
          const imageUrl = product.productImages?.[0] || product.imageUrls?.[0] || '';
          return (
            <Link key={product.id} href={`/products/${product.id}`} className="group">
              <div className="aspect-square relative rounded overflow-hidden bg-gray-100">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes={IMAGE_SIZES.thumbnail}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={PRODUCT_BLUR_DATA_URL}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <Link 
        href={link} 
        className="text-[10px] text-primary hover:text-primary/80 hover:underline font-medium flex items-center gap-0.5"
      >
        See more <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// Cache keys for localStorage
const CACHE_KEYS = {
  products: 'julazone_hero_products',
  collections: 'julazone_hero_collections',
  timestamp: 'julazone_hero_cache_time',
};

// Cache duration: 5 minutes (products can be updated frequently)
const CACHE_DURATION = 5 * 60 * 1000;

// Get cached data from localStorage
function getCachedData() {
  if (typeof window === 'undefined') return null;
  
  try {
    const timestamp = localStorage.getItem(CACHE_KEYS.timestamp);
    if (!timestamp) return null;
    
    // Check if cache is still valid
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION) return null;
    
    const products = localStorage.getItem(CACHE_KEYS.products);
    const collections = localStorage.getItem(CACHE_KEYS.collections);
    
    if (products && collections) {
      return {
        products: JSON.parse(products),
        collections: JSON.parse(collections),
      };
    }
  } catch (e) {
    console.error('Error reading cache:', e);
  }
  return null;
}

// Save data to localStorage cache
function setCachedData(products: Product[], collections: any) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CACHE_KEYS.products, JSON.stringify(products));
    localStorage.setItem(CACHE_KEYS.collections, JSON.stringify(collections));
    localStorage.setItem(CACHE_KEYS.timestamp, Date.now().toString());
  } catch (e) {
    console.error('Error saving cache:', e);
  }
}

export default function Hero({ initialSettings }: HeroProps = {}) {
  // Initialize with cached data for instant display
  const cachedData = typeof window !== 'undefined' ? getCachedData() : null;
  
  const [settings, setSettings] = useState<HeroSettings | null>(initialSettings || null);
  const [products, setProducts] = useState<Product[]>(cachedData?.products || []);
  const [collections, setCollections] = useState<{ bestSellers: string[]; newArrivals: string[]; deals: string[]; featured: string[] }>(
    cachedData?.collections || { bestSellers: [], newArrivals: [], deals: [], featured: [] }
  );
  const [loading, setLoading] = useState(!cachedData); // Not loading if we have cached data

  // LOCAL DEFAULTS for instant loading - no waiting for API
  // These values are hardcoded to match JulaZone branding
  // Admin settings will override ONLY after successful fetch
  const LOCAL_HERO_HEADING = 'Step into JulaZone';
  const LOCAL_HERO_TAGLINE = 'Discover exceptional products crafted with care. Your journey to quality starts here.';
  const LOCAL_HERO_IMAGE = '/hero-background.jpg';
  
  // Use local defaults immediately, admin settings override after fetch
  const heroHeading = settings?.heroHeading || LOCAL_HERO_HEADING;
  const heroTagline = settings?.heroTagline || LOCAL_HERO_TAGLINE;
  const heroBackgroundImage = settings?.heroBackgroundImage || initialSettings?.heroBackgroundImage || LOCAL_HERO_IMAGE;
  const heroImageObjectPosition = settings?.heroImageObjectPosition || 'center';
  const heroImageFit = settings?.heroImageFit || 'cover';
  const heroHeadingColor = settings?.heroHeadingColor || '#ffffff';
  const heroTaglineColor = settings?.heroTaglineColor || '#ffffff';
  // Adjusted default positions to be higher (avoid overlap with product widgets at bottom)
  const heroHeadingPosition = settings?.heroHeadingPosition || { x: 5, y: 8 };
  const heroTaglinePosition = settings?.heroTaglinePosition || { x: 5, y: 22 };
  const heroCtaPosition = settings?.heroCtaPosition || { x: 5, y: 38 };
  
  // Button colors
  const heroButton1BgColor = settings?.heroButton1BgColor || '#3b82f6';
  const heroButton1TextColor = settings?.heroButton1TextColor || '#ffffff';
  const heroButton2BgColor = settings?.heroButton2BgColor || 'transparent';
  const heroButton2TextColor = settings?.heroButton2TextColor || '#ffffff';
  const heroButton2BorderColor = settings?.heroButton2BorderColor || '#ffffff';
  const heroButton3BgColor = settings?.heroButton3BgColor || '#3b82f6';
  const heroButton3TextColor = settings?.heroButton3TextColor || '#ffffff';

  useEffect(() => {
    // If initialSettings were provided and we already have settings, 
    // only fetch the products (not settings again)
    const load = async () => {
      const requests: Promise<any>[] = [];
      const requestTypes: string[] = [];

      // Only fetch settings if not provided initially
      if (!initialSettings) {
        requestTypes.push('settings');
        requests.push(
          fetch('/api/settings', { 
            next: { revalidate: 60 } // Cache for 60 seconds
          }).then(async (res) => {
            if (!res.ok) throw new Error(`Settings request failed: ${res.status}`);
            return res.json();
          })
        );
      }

      // Fetch products for the widgets
      requestTypes.push('products');
      requests.push(
        fetch('/api/products?limit=20', { 
          next: { revalidate: 60 } 
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Products request failed: ${res.status}`);
          return res.json();
        })
      );

      // Fetch collections for the hero widgets
      requestTypes.push('collections');
      requests.push(
        fetch('/api/collections', { 
          next: { revalidate: 60 } 
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Collections request failed: ${res.status}`);
          return res.json();
        })
      );

      const results = await Promise.allSettled(requests);

      let newProducts: Product[] = [];
      let newCollections: any = { bestSellers: [], newArrivals: [], deals: [], featured: [] };

      results.forEach((result, index) => {
        const type = requestTypes[index];
        if (result.status === 'fulfilled') {
          switch (type) {
            case 'settings':
              setSettings(result.value);
              break;
            case 'products':
              newProducts = Array.isArray(result.value) ? result.value : (result.value?.products || []);
              setProducts(newProducts);
              break;
            case 'collections':
              newCollections = result.value || { bestSellers: [], newArrivals: [], deals: [], featured: [] };
              setCollections(newCollections);
              break;
          }
        } else {
          console.error(`Failed to load ${type}:`, result.reason);
        }
      });

      // Cache the fresh data for instant loading on next visit
      if (newProducts.length > 0) {
        setCachedData(newProducts, newCollections);
      }

      setLoading(false);
    };

    // Always fetch fresh data in background, even if we have cache
    load().catch(err => {
      console.error('Failed to load hero section:', err);
      setLoading(false);
    });
  }, [initialSettings]);

  const getProductById = (id: string) => products.find(p => p.id === id);

  // Get products for hero widgets - ONLY show products from collections, no fallbacks
  const newArrivalsProducts = collections.newArrivals.length > 0
    ? collections.newArrivals.map(id => getProductById(id)).filter(Boolean) as Product[]
    : []; // No fallback - only show if explicitly added to collection
  
  const bestSellersProducts = collections.bestSellers.length > 0
    ? collections.bestSellers.map(id => getProductById(id)).filter(Boolean) as Product[]
    : []; // No fallback - only show if explicitly added to collection
  
  const dealsProducts = collections.deals.length > 0
    ? collections.deals.map(id => getProductById(id)).filter(Boolean) as Product[]
    : []; // No fallback - only show if explicitly added to collection

  // Featured products from collections only
  const featuredProducts = collections.featured.length > 0
    ? collections.featured.map(id => getProductById(id)).filter(Boolean) as Product[]
    : []; // No fallback - only show if explicitly added

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
              sizes={IMAGE_SIZES.hero}
              placeholder="blur"
              blurDataURL={HERO_BLUR_DATA_URL}
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
            sizes={IMAGE_SIZES.hero}
            placeholder="blur"
            blurDataURL={HERO_BLUR_DATA_URL}
          />
          {/* Enhanced Gradient Overlay for better text contrast - only for cover mode */}
          {heroImageFit === 'cover' && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600" />
      )}

      {/* Content - Positioned elements - REDUCED HEIGHT by 40% */}
      <div className="relative w-full min-h-[288px] sm:min-h-[312px] md:min-h-[360px]">
        {/* Hero Announcement Overlay */}
        {settings && <HeroAnnouncement settings={settings} />}

        {/* Mobile Layout - Flexbox based for better visibility - COMPACT */}
        <div className="md:hidden flex flex-col justify-start px-4 pt-8 pb-3 min-h-[288px] sm:min-h-[312px] relative z-10">
          <h1
            className="text-xl sm:text-2xl font-bold max-w-lg mb-1.5 drop-shadow-lg"
            style={{
              color: heroHeadingColor,
              fontFamily: 'var(--font-heading)',
              fontWeight: 'var(--font-weight-bold)',
              lineHeight: '1.2',
            }}
          >
            {heroHeading}
          </h1>

          <p
            className="text-[11px] sm:text-xs max-w-xs mb-2 drop-shadow-md"
            style={{
              color: heroTaglineColor,
              opacity: 0.95,
              lineHeight: '1.3',
            }}
          >
            {heroTagline}
          </p>

          {/* Amazon-style Product Widgets - Mobile (horizontal scroll) - More compact */}
          {products.length > 0 && (
            <div className="relative mt-2">
              {/* Scroll container */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {newArrivalsProducts.length > 0 && (
                  <div className="snap-start">
                    <HeroProductWidget
                      title="New Arrivals"
                      icon={ShoppingBag}
                      products={newArrivalsProducts}
                      link="/products?filter=new"
                    />
                  </div>
                )}
                {bestSellersProducts.length > 0 && (
                  <div className="snap-start">
                    <HeroProductWidget
                      title="Best Sellers"
                      icon={TrendingUp}
                      products={bestSellersProducts}
                      link="/products?filter=bestsellers"
                    />
                  </div>
                )}
                {featuredProducts.length > 0 && (
                  <div className="snap-start">
                    <HeroProductWidget
                      title="Featured"
                      icon={ShoppingBag}
                      products={featuredProducts}
                      link="/products?filter=featured"
                    />
                  </div>
                )}
                {dealsProducts.length > 0 && (
                  <div className="snap-start">
                    <HeroProductWidget
                      title="Deals"
                      icon={Tag}
                      products={dealsProducts}
                      link="/products?filter=deals"
                    />
                  </div>
                )}
              </div>
              {/* Scroll indicator - shows there's more to scroll */}
              <div className="flex justify-center gap-1.5 mt-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-white/80 rounded-full text-[10px] text-gray-600 font-medium">
                  <span>Swipe for more</span>
                  <ArrowRight className="h-3 w-3 animate-pulse" />
                </div>
              </div>
            </div>
          )}
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

        {/* Amazon-style Product Widgets - Desktop (positioned at bottom) */}
        {products.length > 0 && (
          <div className="hidden md:flex absolute gap-4 px-4 bottom-6 left-4">
            {newArrivalsProducts.length > 0 && (
              <HeroProductWidget
                title="New Arrivals"
                icon={ShoppingBag}
                products={newArrivalsProducts}
                link="/products?filter=new"
              />
            )}
            {bestSellersProducts.length > 0 && (
              <HeroProductWidget
                title="Best Sellers"
                icon={TrendingUp}
                products={bestSellersProducts}
                link="/products?filter=bestsellers"
              />
            )}
            {featuredProducts.length > 0 && (
              <HeroProductWidget
                title="Featured"
                icon={ShoppingBag}
                products={featuredProducts}
                link="/products?filter=featured"
              />
            )}
            {dealsProducts.length > 0 && (
              <HeroProductWidget
                title="Deals & Offers"
                icon={Tag}
                products={dealsProducts}
                link="/products?filter=deals"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
