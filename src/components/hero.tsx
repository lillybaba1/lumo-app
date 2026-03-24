"use client";

import { useEffect, useState, useRef } from 'react';
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
                {isMockProduct(product) && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500/90 text-white text-[8px] font-bold rounded uppercase tracking-wide z-10">
                    Sample
                  </span>
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
         {isMockProduct(mainProduct) && (
           <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500/90 text-white text-[9px] font-bold rounded uppercase tracking-wide z-10">
             Sample
           </span>
         )}
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

// ─── Helper ─────────────────────────────────────────────────────────────────
function isMockProduct(product: Product): boolean {
  return product.sellerId === 'mock-seller' || product.sellerId === 'mock-seller-id' || product.category === 'mock';
}

// ─── Mock Product Data ───────────────────────────────────────────────────────
// Placeholder images from picsum.photos for visual testing of grid layouts.
// Each card needs exactly 4 products to test the 2×2 grid properly.

function mockProduct(id: string, name: string, price: number, imageId: number): Product {
  return {
    id,
    name,
    description: '',
    price,
    sellerId: 'mock-seller',
    imageUrls: [`https://picsum.photos/seed/${imageId}/400/400`],
    productImages: [`https://picsum.photos/seed/${imageId}/400/400`],
    category: 'mock',
    stock: 10,
  };
}

const MOCK_DEALS: Product[] = [
  mockProduct('deal-1', 'Wireless Earbuds Pro', 29.99, 101),
  mockProduct('deal-2', 'Cotton Throw Blanket', 18.50, 102),
  mockProduct('deal-3', 'LED Desk Lamp', 24.99, 103),
  mockProduct('deal-4', 'Travel Water Bottle', 12.99, 104),
];

const MOCK_BEST_SELLERS: Product[] = [
  mockProduct('best-1', 'Premium Yoga Mat', 39.99, 201),
  mockProduct('best-2', 'Stainless Steel Tumbler', 22.00, 202),
  mockProduct('best-3', 'Bamboo Cutting Board Set', 34.99, 203),
  mockProduct('best-4', 'Organic Soy Candle', 16.50, 204),
];

const MOCK_NEW_ARRIVALS: Product[] = [
  mockProduct('new-1', 'Minimalist Backpack', 54.99, 301),
  mockProduct('new-2', 'Ceramic Planter Set', 28.00, 302),
  mockProduct('new-3', 'Linen Table Runner', 19.99, 303),
  mockProduct('new-4', 'Handmade Soap Bundle', 15.50, 304),
];

const MOCK_FEATURED: Product[] = [
  mockProduct('feat-1', 'Smart Bluetooth Speaker', 49.99, 401),
  mockProduct('feat-2', 'Artisan Coffee Mug', 14.99, 402),
  mockProduct('feat-3', 'Woven Storage Basket', 32.00, 403),
  mockProduct('feat-4', 'Essential Oil Diffuser', 27.50, 404),
];

const MOCK_BUDGET: Product[] = [
  mockProduct('budget-1', 'Phone Stand Holder', 8.99, 501),
  mockProduct('budget-2', 'Reusable Grocery Bags', 6.50, 502),
  mockProduct('budget-3', 'Silicone Spatula Set', 9.99, 503),
  mockProduct('budget-4', 'Notebook Journal', 7.25, 504),
];

const MOCK_DISCOVER: Product[] = [
  mockProduct('disc-1', 'Macramé Wall Hanging', 42.00, 601),
  mockProduct('disc-2', 'Portable Blender', 35.99, 602),
  mockProduct('disc-3', 'Scented Drawer Liners', 11.99, 603),
  mockProduct('disc-4', 'Cork Yoga Block Set', 19.00, 604),
];

export default function Hero({ initialSettings }: HeroProps = {}) {
  const [settings, setSettings] = useState<HeroSettings | null>(initialSettings || null);
  const [realProducts, setRealProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!initialSettings) {
      fetch('/api/settings', { next: { revalidate: 60 } })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setSettings(data); })
        .catch(() => {});
    }
  }, [initialSettings]);

  // Fetch real products from the database
  useEffect(() => {
    fetch('/api/products?limit=24')
      .then(res => res.ok ? res.json() : [])
      .then((data: Product[]) => {
        // Filter out mock/sample products
        const real = (data || []).filter(p => p.sellerId !== 'mock-seller' && p.sellerId !== 'mock-seller-id' && p.category !== 'mock');
        setRealProducts(real);
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  // Use real products if available, otherwise fall back to mock data
  const hasRealProducts = realProducts.length >= 4;
  const deals = hasRealProducts ? realProducts.slice(0, 4) : MOCK_DEALS;
  const bestSellers = hasRealProducts ? realProducts.slice(4, 8) : MOCK_BEST_SELLERS;
  const newArrivals = hasRealProducts ? realProducts.slice(8, 12) : MOCK_NEW_ARRIVALS;
  const featured = hasRealProducts ? realProducts.slice(12, 16) : MOCK_FEATURED;
  const budget = hasRealProducts ? realProducts.slice(16, 20) : MOCK_BUDGET;
  const discover = hasRealProducts ? realProducts.slice(20, 24) : MOCK_DISCOVER;

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
          {/* Sample products notice — only when no real products */}
          {!hasRealProducts && !loadingProducts && (
            <div className="mx-4 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded uppercase tracking-wide shrink-0">Sample</span>
              <p className="text-[11px] text-amber-800">These are sample products for demonstration. Real products will appear once sellers list them.</p>
            </div>
          )}
          <MobileHeroCarousel>
            <div className="snap-center">
              <HeroGridWidget
                title="Continue shopping deals"
                products={deals}
                link="/products?filter=deals"
                bgColor="bg-white"
                linkLabel="See all deals"
              />
            </div>
            <div className="snap-center">
              <HeroLargeCardWidget
                title="Best sellers in your area"
                products={bestSellers}
                link="/products?filter=bestsellers"
                bgColor="bg-white"
                linkLabel="See more"
              />
            </div>
            <div className="snap-center">
              <HeroGridWidget
                title="New arrivals"
                products={newArrivals}
                link="/products?filter=new"
                bgColor="bg-white"
                linkLabel="Explore new arrivals"
              />
            </div>
            <div className="snap-center">
              <HeroLargeCardWidget
                title="Featured for you"
                products={featured}
                link="/products?filter=featured"
                bgColor="bg-white"
                linkLabel="See more"
              />
            </div>
            <div className="snap-center">
              <HeroGridWidget
                title="Budget finds under $50"
                products={budget}
                link="/products?maxPrice=50"
                bgColor="bg-white"
                linkLabel="See more"
              />
            </div>
            <div className="snap-center">
              <HeroGridWidget
                title="Discover something new"
                products={discover}
                link="/products"
                bgColor="bg-white"
                linkLabel="Explore more"
              />
            </div>
          </MobileHeroCarousel>
        </div>

        {/* Desktop Layout — Amazon-style widget grid */}
        <div className="hidden md:block px-4 lg:px-6 py-3 max-w-[1440px] mx-auto">
          {/* Sample products notice — only when no real products */}
          {!hasRealProducts && !loadingProducts && (
            <div className="mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5">
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded uppercase tracking-wide shrink-0">Sample</span>
              <p className="text-sm text-amber-800">These are sample products for demonstration purposes. Real products will appear as sellers list them on the marketplace.</p>
            </div>
          )}
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 auto-rows-fr">
            <HeroGridWidget
              title="Continue shopping deals"
              products={deals}
              link="/products?filter=deals"
              bgColor="bg-white"
              linkLabel="See all deals"
            />
            <HeroLargeCardWidget
              title="Best sellers in your area"
              products={bestSellers}
              link="/products?filter=bestsellers"
              bgColor="bg-white"
              linkLabel="See more"
            />
            <HeroGridWidget
              title="New arrivals"
              products={newArrivals}
              link="/products?filter=new"
              bgColor="bg-white"
              linkLabel="Explore new arrivals"
            />
            <HeroLargeCardWidget
              title="Featured for you"
              products={featured}
              link="/products?filter=featured"
              bgColor="bg-white"
              linkLabel="See more"
            />
            <HeroGridWidget
              title="Budget finds under $50"
              products={budget}
              link="/products?maxPrice=50"
              bgColor="bg-white"
              linkLabel="See more"
            />
            <HeroGridWidget
              title="Discover more"
              products={discover}
              link="/products"
              bgColor="bg-white"
              linkLabel="Explore more"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
