"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/types';
import Image from 'next/image';
import HeroAnnouncement, { HeroAnnouncementSettings } from './hero-announcement';
import { PRODUCT_BLUR_DATA_URL } from '@/lib/image-utils';

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

// Amazon-style 2×2 Grid Widget for Hero
function HeroGridWidget({ 
  title, 
  products, 
  link,
  bgColor,
  textColor = 'text-gray-900',
  linkLabel = 'See all',
}: { 
  title: string; 
  products: Product[]; 
  link: string;
  bgColor: string;
  textColor?: string;
  linkLabel?: string;
}) {
  return (
    <div className={`rounded-2xl p-4 min-w-[280px] md:min-w-0 md:max-w-none flex-shrink-0 md:flex-shrink flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-black/[0.04] ${bgColor}`}>
      <h3 className={`text-[15px] font-bold mb-3 leading-snug ${textColor} line-clamp-1`}>{title}</h3>
      
      <div className="grid grid-cols-2 gap-2 flex-1">
        {products.slice(0, 4).map((product) => {
          const imageUrl = product.productImages?.[0] || product.imageUrls?.[0] || '';
          
          return (
            <Link 
              key={product.id} 
              href={`/products/${product.id}`} 
              className="group bg-white rounded-xl overflow-hidden flex flex-col hover:ring-2 hover:ring-black/10 transition-all duration-200"
            >
              <div className="aspect-square relative bg-white p-1.5">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 130px, 150px"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={PRODUCT_BLUR_DATA_URL}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-gray-200" />
                  </div>
                )}
              </div>
              <div className="px-2 pb-2 pt-1">
                <p className="text-[11px] text-gray-700 font-medium truncate leading-tight">
                  {product.name}
                </p>
              </div>
            </Link>
          );
        })}
        {/* Fill empty spots if less than 4 */}
        {[...Array(Math.max(0, 4 - products.length))].map((_, i) => (
           <Link key={`empty-${i}`} href={link} className="bg-white/70 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
             <ShoppingBag className="h-5 w-5 text-gray-300/60" />
           </Link>
        ))}
      </div>
      
      <Link 
        href={link} 
        className={`text-[13px] font-medium mt-3 hover:underline inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-800`}
      >
        {linkLabel} <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// Single Featured Product Card
function HeroLargeCardWidget({
  title,
  products,
  link,
  bgColor,
  textColor = 'text-gray-900',
  linkLabel = 'See more',
}: {
  title: string;
  products: Product[];
  link: string;
  bgColor: string;
  textColor?: string;
  linkLabel?: string;
}) {
  const mainProduct = products[0];
  if (!mainProduct) return null;
  const imageUrl = mainProduct.productImages?.[0] || mainProduct.imageUrls?.[0] || '';

  return (
    <div className={`rounded-2xl p-4 min-w-[280px] md:min-w-0 md:max-w-none flex-shrink-0 md:flex-shrink flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-black/[0.04] ${bgColor}`}>
      <h3 className={`text-[15px] font-bold mb-3 leading-snug ${textColor} line-clamp-1`}>{title}</h3>
      
      <Link href={`/products/${mainProduct.id}`} className="bg-white rounded-xl flex-1 relative overflow-hidden group flex items-center justify-center p-3 hover:ring-2 hover:ring-black/10 transition-all duration-200">
         <div className="relative w-full h-full min-h-[140px]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={mainProduct.name}
                fill
                className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 260px, 300px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-gray-200" />
              </div>
            )}
         </div>
      </Link>
      
      <Link 
        href={link} 
        className={`text-[13px] font-medium mt-3 hover:underline inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-800`}
      >
        {linkLabel} <ChevronRight className="h-3.5 w-3.5" />
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
    { bestSellers: [], newArrivals: [], deals: [], featured: [], ...(cachedData?.collections || {}) }
  );
  const [loading, setLoading] = useState(!cachedData);

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
        className="relative w-full overflow-hidden z-0 bg-[#f5f5f5]"
        style={{ width: '100%', maxWidth: '100%' }}
      >
        {/* Loading skeleton matching card grid */}
        <div className="px-4 lg:px-6 py-3 max-w-[1440px] mx-auto">
          {/* Mobile: single card skeleton */}
          <div className="md:hidden px-4 pt-3">
            <div className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-xl" />
                ))}
              </div>
              <div className="h-3 w-20 bg-gray-200 rounded mt-3" />
            </div>
          </div>
          {/* Desktop: grid of card skeletons */}
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="aspect-square bg-gray-100 rounded-xl" />
                  ))}
                </div>
                <div className="h-3 w-16 bg-gray-200 rounded mt-3" />
              </div>
            ))}
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
      <div className="absolute inset-0 bg-[#f5f5f5]" />

      {/* Content */}
      <div className="relative w-full pb-4 pt-1">
        {/* Hero Announcement Overlay */}
        {settings && <HeroAnnouncement settings={settings} />}

        {/* Mobile Layout - Horizontal Scroll Cards */}
        <div className="md:hidden">
          {products.length > 0 && (
            <MobileHeroCarousel>
                {dealsProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroGridWidget
                      title="Continue shopping deals"
                      products={dealsProducts}
                      link="/products?filter=deals"
                      bgColor="bg-white"
                      linkLabel="See all deals"
                    />
                  </div>
                )}
                
                {bestSellersProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroLargeCardWidget
                      title="Best sellers in your area"
                      products={bestSellersProducts}
                      link="/products?filter=bestsellers"
                      bgColor="bg-white"
                      linkLabel="See more"
                    />
                  </div>
                )}
                
                {newArrivalsProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroGridWidget
                      title="New arrivals"
                      products={newArrivalsProducts}
                      link="/products?filter=new"
                      bgColor="bg-white"
                      linkLabel="Explore new arrivals"
                    />
                  </div>
                )}
                
                {featuredProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroLargeCardWidget
                      title="Featured for you"
                      products={featuredProducts}
                      link="/products?filter=featured"
                      bgColor="bg-white"
                      linkLabel="See more"
                    />
                  </div>
                )}

                {budgetProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroGridWidget
                      title="Budget finds under $50"
                      products={budgetProducts}
                      link="/products?maxPrice=50"
                      bgColor="bg-white"
                      linkLabel="See more"
                    />
                  </div>
                )}

                {discoverProducts.length > 0 && (
                  <div className="snap-center">
                    <HeroGridWidget
                      title="Discover something new"
                      products={discoverProducts}
                      link="/products"
                      bgColor="bg-white"
                      linkLabel="Explore more"
                    />
                  </div>
                )}
            </MobileHeroCarousel>
          )}
        </div>

        {/* Desktop Layout — Amazon-style widget grid */}
        <div className="hidden md:block px-4 lg:px-6 py-3 max-w-[1440px] mx-auto">
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 auto-rows-fr">
             {dealsProducts.length > 0 && (
                <HeroGridWidget
                  title="Continue shopping deals"
                  products={dealsProducts}
                  link="/products?filter=deals"
                  bgColor="bg-white"
                  linkLabel="See all deals"
                />
             )}
             {bestSellersProducts.length > 0 && (
                <HeroLargeCardWidget
                  title="Best sellers in your area"
                  products={bestSellersProducts}
                  link="/products?filter=bestsellers"
                  bgColor="bg-white"
                  linkLabel="See more"
                />
             )}
              {newArrivalsProducts.length > 0 && (
                <HeroGridWidget
                  title="New arrivals"
                  products={newArrivalsProducts}
                  link="/products?filter=new"
                  bgColor="bg-white"
                  linkLabel="Explore new arrivals"
                />
             )}
             {featuredProducts.length > 0 && (
                <HeroLargeCardWidget
                  title="Featured for you"
                  products={featuredProducts}
                  link="/products?filter=featured"
                  bgColor="bg-white"
                  linkLabel="See more"
                />
             )}
             {budgetProducts.length > 0 && (
                <HeroGridWidget
                  title="Budget finds under $50"
                  products={budgetProducts}
                  link="/products?maxPrice=50"
                  bgColor="bg-white"
                  linkLabel="See more"
                />
             )}
             {discoverProducts.length > 0 && (
                <HeroGridWidget
                  title="Discover more"
                  products={discoverProducts}
                  link="/products"
                  bgColor="bg-white"
                  linkLabel="Explore more"
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
