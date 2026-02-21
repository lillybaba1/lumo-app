"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
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

// Mobile carousel wrapper with scroll indicator dots
function MobileHeroCarousel({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const cards = el.querySelectorAll(':scope > .snap-center');
    setTotalCards(cards.length);

    const handleScroll = () => {
      if (!el) return;
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.firstElementChild 
        ? (el.firstElementChild as HTMLElement).offsetWidth + 16
        : 300;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(index, cards.length - 1));
      // Hide hint as soon as user scrolls
      if (scrollLeft > 10) setShowHint(false);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    // Auto-hide hint after 3 seconds
    const timer = setTimeout(() => setShowHint(false), 3000);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative mt-2">
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-hide snap-x snap-mandatory" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Swipe hint overlay */}
      {showHint && totalCards > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full animate-pulse pointer-events-none">
          <span>Swipe</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Dot indicators */}
      {totalCards > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {Array.from({ length: totalCards }).map((_, i) => (
            <button
              key={i}
              aria-label={`Go to card ${i + 1}`}
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                const cards = el.querySelectorAll(':scope > .snap-center');
                if (cards[i]) {
                  cards[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex 
                  ? 'w-6 bg-gray-800' 
                  : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Amazon-style Grid Widget for Hero
function HeroGridWidget({ 
  title, 
  products, 
  link,
  bgColor,
  textColor = 'text-gray-900'
}: { 
  title: string; 
  products: Product[]; 
  link: string;
  bgColor: string;
  textColor?: string;
}) {
  return (
    <div className={`rounded-xl p-3.5 min-w-[280px] md:min-w-0 md:max-w-none flex-shrink-0 md:flex-shrink flex flex-col h-[340px] md:h-[320px] shadow-md ring-1 ring-black/5 ${bgColor} transition-shadow hover:shadow-lg`}>
      <h3 className={`text-lg font-bold mb-2 leading-tight ${textColor} line-clamp-1`}>{title}</h3>
      
      <div className="bg-white rounded-lg flex-1 grid grid-cols-2 gap-1.5 overflow-hidden p-1.5">
        {products.slice(0, 4).map((product) => {
          const imageUrl = product.productImages?.[0] || product.imageUrls?.[0] || '';
          
          return (
            <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col h-full relative p-1.5 rounded-md hover:bg-gray-50 transition-colors">
              <div className="aspect-square relative mb-1 flex-1 w-full">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-0.5"
                    sizes="120px"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={PRODUCT_BLUR_DATA_URL}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg bg-gray-50 text-gray-300 rounded">Image</div>
                )}
              </div>
              <div className="mt-auto">
                 <p className="text-[10px] text-gray-700 font-medium truncate">
                   {product.name}
                 </p>
              </div>
            </Link>
          );
        })}
        {/* Fill empty spots if less than 4 */}
        {[...Array(Math.max(0, 4 - products.length))].map((_, i) => (
           <Link key={`empty-${i}`} href={link} className="bg-gray-50/60 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors">
             <ShoppingBag className="h-5 w-5 text-gray-200" />
           </Link>
        ))}
      </div>
      
      <div className="mt-2.5">
        <Link 
          href={link} 
          className={`text-xs font-semibold hover:underline flex items-center gap-1 ${textColor}`}
        >
          See all deals <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// Single Large Card (Purple one in design)
function HeroLargeCardWidget({
  title,
  products,
  link,
  bgColor,
  textColor = 'text-gray-900'
}: {
  title: string;
  products: Product[];
  link: string;
  bgColor: string;
  textColor?: string;
}) {
  const mainProduct = products[0];
  if (!mainProduct) return null;
  const imageUrl = mainProduct.productImages?.[0] || mainProduct.imageUrls?.[0] || '';

  return (
    <div className={`rounded-xl p-3.5 min-w-[280px] md:min-w-0 md:max-w-none flex-shrink-0 md:flex-shrink flex flex-col h-[340px] md:h-[320px] shadow-md ring-1 ring-black/5 ${bgColor} transition-shadow hover:shadow-lg`}>
      <h3 className={`text-lg font-bold mb-2 leading-tight ${textColor} line-clamp-1`}>{title}</h3>
      
      <Link href={`/products/${mainProduct.id}`} className="bg-white rounded-lg p-3 flex-1 relative overflow-hidden group items-center justify-center flex">
         <div className="relative w-full h-full">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={mainProduct.name}
                fill
                className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                sizes="300px"
              />
            ) : null}
         </div>
      </Link>
      
      <div className="mt-2.5">
        <Link 
          href={link} 
          className={`text-xs font-semibold hover:underline flex items-center gap-1 ${textColor}`}
        >
          See more <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
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
    { bestSellers: [], newArrivals: [], deals: [], featured: [], ...(cachedData?.collections || {}) }
  );
  const [loading, setLoading] = useState(!cachedData); // Not loading if we have cached data

  // LOCAL DEFAULTS for instant loading - no waiting for API
  // These values are hardcoded to match JulaZone branding
  // Admin settings will override ONLY after successful fetch
  const LOCAL_HERO_HEADING = 'Step into JulaZone';
  const LOCAL_HERO_TAGLINE = 'Discover exceptional products crafted with care. Your journey to quality starts here.';
  const LOCAL_HERO_IMAGE = ''; // Default to gradient
  
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
        fetch('/api/products?limit=50', { 
          next: { revalidate: 60 } 
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Products request failed: ${res.status}`);
          return res.json();
        })
      );

      // Fetch collections for the hero widgets
      // These collections are "auto-analyzed" by the backend (based on sales/views) 
      // but can be manually overridden by admins via the admin panel.
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
              const colData = result.value || {};
              setCollections({
                bestSellers: colData.bestSellers || [],
                newArrivals: colData.newArrivals || [],
                deals: colData.deals || [],
                featured: colData.featured || []
              });
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
  const featuredProducts = useMemo(() => collections.featured.length > 0
    ? collections.featured.map(id => getProductById(id)).filter(Boolean) as Product[]
    : [], [collections.featured, products]); // No fallback - only show if explicitly added

  // New Widgets Data derived from general products list
  // 1. Budget Finds - Under $50
  const budgetProducts = useMemo(() => products
    .filter(p => p.price < 50 && !collections.deals.includes(p.id)) // Exclude deals to avoid duplicates
    .sort((a, b) => a.price - b.price) // Cheapest first
    .slice(0, 4), [products, collections.deals]);

  // 2. Discover More - Random selection not in other lists
  const discoverProducts = useMemo(() => {
    const usedIds = new Set([
      ...collections.newArrivals,
      ...collections.bestSellers,
      ...collections.deals,
      ...collections.featured,
      ...budgetProducts.map(p => p.id)
    ]);
  
    return products
      .filter(p => !usedIds.has(p.id))
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, 4);
  }, [products, collections, budgetProducts]);

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
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

      {/* Content */}
      <div className="relative w-full pb-6 pt-2">
        {/* Hero Announcement Overlay */}
        {settings && <HeroAnnouncement settings={settings} />}

        {/* Mobile Layout - Horizontal Scroll Cards */}
        <div className="md:hidden">
          {products.length > 0 && (
            <MobileHeroCarousel>
                {/* 1. Green Card: Continue Shopping / Deals */}
                {dealsProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroGridWidget
                      title="Continue shopping deals"
                      products={dealsProducts}
                      link="/products?filter=deals"
                      bgColor="bg-[#66E887]" // Bright green
                      textColor="text-gray-900"
                    />
                  </div>
                )}
                
                {/* 2. Purple Card: Best Sellers */}
                {bestSellersProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroLargeCardWidget
                      title="Deals on your best sellers"
                      products={bestSellersProducts}
                      link="/products?filter=bestsellers"
                      bgColor="bg-[#D8B4FE]" // Purple
                      textColor="text-gray-900"
                    />
                  </div>
                )}
                
                {/* 3. Blue/Teal Card: New Arrivals */}
                {newArrivalsProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroGridWidget
                      title="Check out new arrivals"
                      products={newArrivalsProducts}
                      link="/products?filter=new"
                      bgColor="bg-[#67E8F9]" // Cyan
                      textColor="text-gray-900"
                    />
                  </div>
                )}
                
                {/* 4. Yellow/Orange Card: Featured */}
                {featuredProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroLargeCardWidget
                      title="Featured for you"
                      products={featuredProducts}
                      link="/products?filter=featured"
                      bgColor="bg-[#FDE047]" // Yellow
                      textColor="text-gray-900"
                    />
                  </div>
                )}

                 {/* 5. Orange Card: Budget Finds */}
                 {budgetProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroGridWidget
                      title="Budget finds under $50"
                      products={budgetProducts}
                      link="/products?maxPrice=50"
                      bgColor="bg-[#FCA5A5]" // Light Red/Pink/Orange mix
                      textColor="text-gray-900"
                    />
                  </div>
                )}

                {/* 6. Indigo/Blue Card: Discover More */}
                {discoverProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroGridWidget
                      title="Discover something new"
                      products={discoverProducts}
                      link="/products"
                      bgColor="bg-[#A5B4FC]" // Indigo
                      textColor="text-gray-900"
                    />
                  </div>
                )}
            </MobileHeroCarousel>
          )}
        </div>

        {/* Desktop Layout — responsive grid that fills the row */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4 lg:px-6 py-4 max-w-[1440px] mx-auto">
             {dealsProducts.length > 0 && (
                <HeroGridWidget
                  title="Continue shopping deals"
                  products={dealsProducts}
                  link="/products?filter=deals"
                  bgColor="bg-gradient-to-br from-[#66E887] to-[#34D399]"
                />
             )}
             {bestSellersProducts.length > 0 && (
                <HeroLargeCardWidget
                  title="Best Sellers"
                  products={bestSellersProducts}
                  link="/products?filter=bestsellers"
                  bgColor="bg-gradient-to-br from-[#D8B4FE] to-[#C084FC]"
                />
             )}
              {newArrivalsProducts.length > 0 && (
                <HeroGridWidget
                  title="New Arrivals"
                  products={newArrivalsProducts}
                  link="/products?filter=new"
                  bgColor="bg-gradient-to-br from-[#67E8F9] to-[#22D3EE]"
                />
             )}
             {featuredProducts.length > 0 && (
                <HeroLargeCardWidget
                  title="Featured"
                  products={featuredProducts}
                  link="/products?filter=featured"
                  bgColor="bg-gradient-to-br from-[#FDE047] to-[#FACC15]"
                />
             )}
             {budgetProducts.length > 0 && (
                <HeroGridWidget
                  title="Budget Finds"
                  products={budgetProducts}
                  link="/products?maxPrice=50"
                  bgColor="bg-gradient-to-br from-[#FCA5A5] to-[#F87171]"
                />
             )}
             {discoverProducts.length > 0 && (
                <HeroGridWidget
                  title="Discover More"
                  products={discoverProducts}
                  link="/products"
                  bgColor="bg-gradient-to-br from-[#A5B4FC] to-[#818CF8]"
                />
             )}
        </div>
      </div>
    </div>
  );
}

function HeroWhiteCard({
  title,
  products,
  link,
  icon: Icon
}: {
  title: string;
  products: Product[];
  link: string;
  icon: React.ElementType;
}) {
  const isSingle = products.length === 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-w-[280px] max-w-[320px] flex-shrink-0 flex flex-col h-[340px]">
      <div className="flex items-center gap-2 mb-3">
        {false && <Icon className="h-5 w-5 text-indigo-600" />} {/* Icon disabled to match ref exactly */}
        <h3 className="text-xl font-bold text-gray-900 leading-tight">{title}</h3>
      </div>

      <div className="flex-1 relative mb-3">
        {isSingle ? (
          <Link href={`/products/${products[0].id}`} className="block w-full h-full relative">
            <Image
              src={products[0].productImages?.[0] || products[0].imageUrls?.[0] || ''}
              alt={products[0].name}
              fill
              className="object-contain"
              sizes="300px"
              loading="lazy"
              placeholder="blur"
              blurDataURL={PRODUCT_BLUR_DATA_URL}
            />
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-3 h-full">
            {products.slice(0, 4).map((product) => (
               <Link key={product.id} href={`/products/${product.id}`} className="relative h-full">
                  <Image
                    src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                    alt={product.name}
                    fill
                    className="object-contain" // Contain to show full product like ref
                    sizes="150px"
                    loading="lazy"
                  />
                  {/* Subtle label overlay if needed */}
               </Link>
            ))}
             {/* Fill empty spots */}
            {[...Array(Math.max(0, 4 - products.length))].map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50/50 rounded" />
            ))}
          </div>
        )}
      </div>

      <div>
        <Link 
          href={link} 
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
        >
          See more <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
