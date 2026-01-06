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

export default function Hero({ initialSettings }: HeroProps = {}) {
  const [settings, setSettings] = useState<HeroSettings | null>(initialSettings || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<{ bestSellers: string[]; newArrivals: string[]; deals: string[]; featured: string[] }>({ bestSellers: [], newArrivals: [], deals: [], featured: [] });
  const [loading, setLoading] = useState(true);

  // Use initial settings for immediate render, then fetch fresh data
  const heroHeading = settings?.heroHeading || 'Step into JulaZone';
  const heroTagline = settings?.heroTagline || 'Discover exceptional products crafted with care. Your journey to quality starts here.';
  const heroBackgroundImage = settings?.heroBackgroundImage || initialSettings?.heroBackgroundImage || '';
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

      results.forEach((result, index) => {
        const type = requestTypes[index];
        if (result.status === 'fulfilled') {
          switch (type) {
            case 'settings':
              setSettings(result.value);
              break;
            case 'products':
              setProducts(Array.isArray(result.value) ? result.value : (result.value?.products || []));
              break;
            case 'collections':
              setCollections(result.value || { bestSellers: [], newArrivals: [], deals: [], featured: [] });
              break;
          }
        } else {
          console.error(`Failed to load ${type}:`, result.reason);
        }
      });

      setLoading(false);
    };

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
                        sizes="200px"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={PRODUCT_BLUR_DATA_URL}
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
      <div className="relative w-full min-h-[480px] sm:min-h-[520px] md:min-h-[600px]">
        {/* Hero Announcement Overlay */}
        {settings && <HeroAnnouncement settings={settings} />}

        {/* Mobile Layout - Flexbox based for better visibility */}
        <div className="md:hidden flex flex-col justify-start px-4 pt-14 pb-4 min-h-[480px] sm:min-h-[520px] relative z-10">
          <h1
            className="text-2xl sm:text-3xl font-bold max-w-lg mb-2 drop-shadow-lg"
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
            className="text-xs sm:text-sm max-w-xs mb-3 drop-shadow-md"
            style={{
              color: heroTaglineColor,
              opacity: 0.95,
              lineHeight: '1.4',
            }}
          >
            {heroTagline}
          </p>

          {/* Amazon-style Product Widgets - Mobile (horizontal scroll) */}
          {products.length > 0 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {newArrivalsProducts.length > 0 && (
                <HeroProductWidget
                  title="New Arrivals"
                  icon={Sparkles}
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
                  title="Deals"
                  icon={Tag}
                  products={dealsProducts}
                  link="/products?filter=deals"
                />
              )}
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
                icon={Sparkles}
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
