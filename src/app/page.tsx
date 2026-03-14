"use client";

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import ProductCard from '@/components/product-card';
import { 
  TrendingUp, Sparkles, Tag, ChevronRight, 
  ArrowRight, ShoppingBag, Crown,
  Gift, Shield, Truck, RefreshCw, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Product, Category, PromoBannerSettings } from '@/lib/types';
import { ProductGridSkeleton, CategoryGridSkeleton } from '@/components/skeletons';
import { CATEGORY_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils';
import { DetailedTrustSection } from '@/components/service-highlights';
import SearchBar from '@/components/search-bar';
import { RecentlyViewedProducts } from '@/components/recently-viewed-products';
import CompactProductCard from '@/components/compact-product-card';

type Collections = {
  bestSellers: string[];
  newArrivals: string[];
  deals: string[];
};

type HeroSettings = {
  heroHeading?: string;
  heroTagline?: string;
  heroBackgroundImage?: string;
  heroImageObjectPosition?: string;
};

type CategorySectionSettings = {
  categorySectionBgType?: 'color' | 'image' | 'gradient';
  categorySectionBgColor?: string;
  categorySectionBgImage?: string;
  categorySectionBgGradientFrom?: string;
  categorySectionBgGradientTo?: string;
  categorySectionBgGradientDirection?: string;
  categorySectionTextColor?: string;
};

type LumoPromiseSettings = {
  lumoPromiseEnabled?: boolean;
  lumoPromiseTitle?: string;
  lumoPromiseDescription?: string;
  lumoPromiseBgColor?: string;
  lumoPromiseTextColor?: string;
  lumoPromiseTitleSize?: string;
  lumoPromiseTitleWeight?: string;
  lumoPromiseFeature1Icon?: string;
  lumoPromiseFeature1Title?: string;
  lumoPromiseFeature1Subtitle?: string;
  lumoPromiseFeature2Icon?: string;
  lumoPromiseFeature2Title?: string;
  lumoPromiseFeature2Subtitle?: string;
  lumoPromiseFeature3Icon?: string;
  lumoPromiseFeature3Title?: string;
  lumoPromiseFeature3Subtitle?: string;
};

type MeetMakersSettings = {
  meetMakersEnabled?: boolean;
  meetMakersTitle?: string;
  meetMakersDescription?: string;
  meetMakersBgColor?: string;
  meetMakersTextColor?: string;
  meetMakersTitleSize?: string;
  meetMakersTitleWeight?: string;
};

type SettingsResponse = HeroSettings & CategorySectionSettings & LumoPromiseSettings & MeetMakersSettings;

const DEFAULT_PROMO_BANNER: PromoBannerSettings = {
  enabled: true,
  title: '🎉 Special Offers!',
  subtitle: 'Get up to 30% off on selected items. Limited time only.',
  ctaText: 'Shop Deals',
  ctaLink: '/products?filter=deals',
  bgGradientFrom: '#4f46e5',
  bgGradientTo: '#06b6d4',
  textColor: '#ffffff',
  icon: 'percent',
  productIds: [],
};

/* ─────────────── Quick Trust Bar ─────────────── */
function QuickTrustBar() {
  const items = [
    { icon: Truck, label: 'Free Delivery', sub: 'On orders over D500', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Shield, label: 'Secure Payment', sub: '100% protected', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: RefreshCw, label: 'Easy Returns', sub: '7-day guarantee', color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Headphones, label: 'Local Support', sub: 'We speak your language', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];
  return (
    <div className="w-full bg-white border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:flex items-center justify-between py-3">
          {items.map((h, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${h.bg}`}><h.icon className={`h-4 w-4 ${h.color}`} /></div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{h.label}</p>
                <p className="text-[10px] text-gray-500">{h.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="md:hidden flex items-center gap-5 overflow-x-auto py-2.5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {items.map((h, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <h.icon className={`h-3.5 w-3.5 ${h.color}`} />
              <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Hero Banner ─────────────── */
function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M0 0h1v40H0zM40 0h1v40h-1zM0 0h40v1H0zM0 40h40v1H0z'/%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto text-center md:text-left md:mx-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium mb-4 md:mb-5 border border-white/20">
            <Sparkles className="h-3.5 w-3.5" />
            Africa&apos;s Trusted Marketplace
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-4 md:mb-5">
            Shop Smart,{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Shop Local
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-base md:text-lg text-white/80 mb-6 md:mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
            Discover quality products from verified sellers across Africa. Secure payments, fast delivery, and local support.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto md:mx-0 mb-6">
            <SearchBar variant="hero" placeholder="What are you looking for today?" className="shadow-xl" />
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {[
              { label: '🔥 Hot Deals', href: '/products?filter=deals' },
              { label: '✨ New Arrivals', href: '/products?filter=new' },
              { label: '⭐ Best Sellers', href: '/products?filter=bestsellers' },
              { label: '🏪 Boutiques', href: '/boutiques' },
            ].map((lnk) => (
              <Link
                key={lnk.label}
                href={lnk.href}
                className="px-3.5 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-medium hover:bg-white/20 transition-all duration-200"
              >
                {lnk.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Category Section ─────────────── */
function CategorySection({ categories, style, textColor }: { categories: Category[]; style: React.CSSProperties; textColor: string }) {
  if (categories.length === 0) return null;
  return (
    <section className="w-full py-6 md:py-10" style={style}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-2xl font-bold" style={{ color: textColor }}>Shop by Category</h2>
            <p className="text-xs md:text-sm mt-0.5 opacity-70" style={{ color: textColor }}>Find exactly what you need</p>
          </div>
          <Link href="/categories" className="group flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: textColor }}>
            View All <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-5 lg:grid-cols-6 gap-3">
          {categories.slice(0, 6).map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              <div className="group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {category.image ? (
                    <Image src={category.image} alt={category.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes={IMAGE_SIZES.category} placeholder="blur" blurDataURL={CATEGORY_BLUR_DATA_URL} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
                      <span className="text-3xl md:text-4xl">{category.icon || '🛍️'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-2.5 md:p-3 text-center">
                  <span className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-1">{category.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile scrollable */}
        <div className="md:hidden flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`} className="flex-shrink-0 w-[100px]">
              <div className="group flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm ring-1 ring-black/5 mb-1.5 relative">
                  {category.image ? (
                    <Image src={category.image} alt={category.name} fill className="object-cover" sizes="64px" placeholder="blur" blurDataURL={CATEGORY_BLUR_DATA_URL} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-2xl">{category.icon || '🛍️'}</span></div>
                  )}
                </div>
                <span className="text-[10px] font-medium text-gray-700 text-center line-clamp-1 w-full">{category.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Product Showcase ─────────────── */
function ProductShowcase({ title, icon: Icon, products, viewAllLink, viewAllLabel = 'View All' }: {
  title: string; icon: any; products: Product[]; viewAllLink: string; viewAllLabel?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mb-8 md:mb-12">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="flex items-center gap-2 md:gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10"><Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" /></div>
          <h2 className="text-base md:text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <Link href={viewAllLink} className="group flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {viewAllLabel} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 5).map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} compact />
        ))}
      </div>
      <div className="md:hidden grid grid-cols-2 gap-2">
        {products.slice(0, 4).map((product, index) => (
          <CompactProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────── Promo Banner ─────────────── */
function PromoBannerSection({ settings }: { settings: PromoBannerSettings }) {
  if (!settings.enabled) return null;
  return (
    <section className="mb-8 md:mb-12">
      <Link href={settings.ctaLink || '/products?filter=deals'}>
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-10 cursor-pointer group"
          style={{ background: `linear-gradient(135deg, ${settings.bgGradientFrom || '#4f46e5'}, ${settings.bgGradientTo || '#06b6d4'})` }}
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-yellow-300" />
                <span className="text-yellow-300 text-sm font-semibold uppercase tracking-wide">Limited Time</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{settings.title || '🎉 Special Offers!'}</h3>
              <p className="text-white/80 text-sm md:text-base">{settings.subtitle || 'Get up to 30% off on selected items.'}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm group-hover:bg-yellow-50 transition-colors shadow-lg">
                {settings.ctaText || 'Shop Deals'} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

/* ─────────────── JulaZone Promise ─────────────── */
function JulaZonePromise({ settings }: { settings: LumoPromiseSettings }) {
  if (settings.lumoPromiseEnabled === false) return null;
  const features = [
    { icon: settings.lumoPromiseFeature1Icon || '🌱', title: settings.lumoPromiseFeature1Title || 'Sustainable', subtitle: settings.lumoPromiseFeature1Subtitle || 'Eco-friendly materials and processes' },
    { icon: settings.lumoPromiseFeature2Icon || '✨', title: settings.lumoPromiseFeature2Title || 'Quality Crafted', subtitle: settings.lumoPromiseFeature2Subtitle || 'Handpicked for excellence' },
    { icon: settings.lumoPromiseFeature3Icon || '🤝', title: settings.lumoPromiseFeature3Title || 'Fair Trade', subtitle: settings.lumoPromiseFeature3Subtitle || 'Supporting artisan communities' },
  ];
  return (
    <section className="mb-8 md:mb-12">
      <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ backgroundColor: settings.lumoPromiseBgColor || '#ffffff' }}>
        <div className="p-5 md:p-10" style={{ color: settings.lumoPromiseTextColor || '#000000' }}>
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-lg md:text-3xl font-bold mb-2">{settings.lumoPromiseTitle || 'The JulaZone Promise'}</h2>
            <p className="text-sm md:text-base opacity-75 max-w-xl mx-auto">{settings.lumoPromiseDescription || 'Every product in our collection is carefully curated with ethics, craftsmanship, and sustainability at its core.'}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-8 max-w-2xl mx-auto">
            {features.map((f, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-4xl mb-2 md:mb-3">{f.icon}</div>
                <h3 className="text-xs md:text-base font-semibold mb-0.5 md:mb-1">{f.title}</h3>
                <p className="text-[10px] md:text-sm opacity-60 hidden md:block">{f.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Meet the Makers ─────────────── */
function MeetMakers({ settings }: { settings: MeetMakersSettings }) {
  if (settings.meetMakersEnabled === false) return null;
  return (
    <section className="mb-8 md:mb-12">
      <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ backgroundColor: settings.meetMakersBgColor || '#ffffff' }}>
        <div className="p-5 md:p-10 text-center" style={{ color: settings.meetMakersTextColor || '#000000' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center gap-2 mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center text-lg md:text-xl">🧵</div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-lg md:text-xl">🎨</div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center text-lg md:text-xl">🪵</div>
            </div>
            <h2 className="text-lg md:text-3xl font-bold mb-2">{settings.meetMakersTitle || 'Meet the Makers'}</h2>
            <p className="text-sm md:text-base opacity-75 mb-5">{settings.meetMakersDescription || 'Behind every product is a story of skilled artisans dedicated to their craft, using traditional techniques passed down through generations.'}</p>
            <Link href="/boutiques">
              <Button variant="outline" className="rounded-xl gap-2"><ShoppingBag className="h-4 w-4" /> Explore Boutiques</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Seller CTA ─────────────── */
function SellerCTA() {
  return (
    <section className="mb-8 md:mb-12">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 p-6 md:p-10">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 md:gap-8">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg md:text-2xl font-bold text-white mb-2">Start Selling on JulaZone</h3>
            <p className="text-gray-300 text-sm md:text-base max-w-lg">Reach thousands of customers across Africa. Set up your boutique in minutes and start growing your business.</p>
          </div>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold gap-2 px-6 shadow-lg">
              Open Your Store <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function HomePageDataContainer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collections>({ bestSellers: [], newArrivals: [], deals: [] });
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);
  const [categorySectionSettings, setCategorySectionSettings] = useState<CategorySectionSettings>({});
  const [lumoPromiseSettings, setLumoPromiseSettings] = useState<LumoPromiseSettings>({});
  const [meetMakersSettings, setMeetMakersSettings] = useState<MeetMakersSettings>({});
  const [promoBannerSettings, setPromoBannerSettings] = useState<PromoBannerSettings>(DEFAULT_PROMO_BANNER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [productsRes, categoriesRes, collectionsRes, settingsRes, heroRes, trendingRes, promoRes] = await Promise.all([
        fetch('/api/products').then(r => r.ok ? r.json() : { products: [] }).catch(() => ({ products: [] })),
        fetch('/api/categories').then(r => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
        fetch('/api/collections').then(r => r.ok ? r.json() : { bestSellers: [], newArrivals: [], deals: [] }).catch(() => ({ bestSellers: [], newArrivals: [], deals: [] })),
        fetch('/api/settings', { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({})) as Promise<SettingsResponse>,
        fetch('/api/hero', { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({})) as Promise<HeroSettings>,
        fetch('/api/trending').then(r => r.ok ? r.json() : { products: [] }).catch(() => ({ products: [] })),
        fetch('/api/promo-banner').then(r => r.ok ? r.json() : DEFAULT_PROMO_BANNER).catch(() => DEFAULT_PROMO_BANNER) as Promise<PromoBannerSettings>,
      ]);

      setProducts(Array.isArray(productsRes) ? productsRes : (productsRes.products || []));
      setTrendingProducts(trendingRes.products || []);
      setCategories(categoriesRes.categories || (Array.isArray(categoriesRes) ? categoriesRes : []));
      setCollections(collectionsRes);
      setPromoBannerSettings(promoRes);
      setHeroSettings({ ...settingsRes, ...heroRes });
      setCategorySectionSettings({
        categorySectionBgType: settingsRes.categorySectionBgType,
        categorySectionBgColor: settingsRes.categorySectionBgColor,
        categorySectionBgImage: settingsRes.categorySectionBgImage,
        categorySectionBgGradientFrom: settingsRes.categorySectionBgGradientFrom,
        categorySectionBgGradientTo: settingsRes.categorySectionBgGradientTo,
        categorySectionBgGradientDirection: settingsRes.categorySectionBgGradientDirection,
        categorySectionTextColor: settingsRes.categorySectionTextColor,
      });
      setLumoPromiseSettings({
        lumoPromiseEnabled: settingsRes.lumoPromiseEnabled ?? true,
        lumoPromiseTitle: settingsRes.lumoPromiseTitle,
        lumoPromiseDescription: settingsRes.lumoPromiseDescription,
        lumoPromiseBgColor: settingsRes.lumoPromiseBgColor,
        lumoPromiseTextColor: settingsRes.lumoPromiseTextColor,
        lumoPromiseTitleSize: settingsRes.lumoPromiseTitleSize,
        lumoPromiseTitleWeight: settingsRes.lumoPromiseTitleWeight,
        lumoPromiseFeature1Icon: settingsRes.lumoPromiseFeature1Icon,
        lumoPromiseFeature1Title: settingsRes.lumoPromiseFeature1Title,
        lumoPromiseFeature1Subtitle: settingsRes.lumoPromiseFeature1Subtitle,
        lumoPromiseFeature2Icon: settingsRes.lumoPromiseFeature2Icon,
        lumoPromiseFeature2Title: settingsRes.lumoPromiseFeature2Title,
        lumoPromiseFeature2Subtitle: settingsRes.lumoPromiseFeature2Subtitle,
        lumoPromiseFeature3Icon: settingsRes.lumoPromiseFeature3Icon,
        lumoPromiseFeature3Title: settingsRes.lumoPromiseFeature3Title,
        lumoPromiseFeature3Subtitle: settingsRes.lumoPromiseFeature3Subtitle,
      });
      setMeetMakersSettings({
        meetMakersEnabled: settingsRes.meetMakersEnabled ?? true,
        meetMakersTitle: settingsRes.meetMakersTitle,
        meetMakersDescription: settingsRes.meetMakersDescription,
        meetMakersBgColor: settingsRes.meetMakersBgColor,
        meetMakersTextColor: settingsRes.meetMakersTextColor,
        meetMakersTitleSize: settingsRes.meetMakersTitleSize,
        meetMakersTitleWeight: settingsRes.meetMakersTitleWeight,
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col w-full">
        <div className="w-full h-10 bg-white border-b" />
        <div className="w-full h-[280px] md:h-[400px] bg-gradient-to-br from-indigo-100 to-purple-100 animate-pulse" />
        <div className="w-full py-6 md:py-10 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-5" />
            <CategoryGridSkeleton count={6} />
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-5" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <Home
        products={products}
        categories={categories}
        collections={collections}
        categorySectionSettings={categorySectionSettings}
        trendingProducts={trendingProducts}
        lumoPromiseSettings={lumoPromiseSettings}
        meetMakersSettings={meetMakersSettings}
        promoBannerSettings={promoBannerSettings}
      />
    </Suspense>
  );
}

function Home(props: {
  products: Product[];
  categories: Category[];
  collections: Collections;
  categorySectionSettings: CategorySectionSettings;
  trendingProducts: Product[];
  lumoPromiseSettings: LumoPromiseSettings;
  meetMakersSettings: MeetMakersSettings;
  promoBannerSettings: PromoBannerSettings;
}) {
  const { products, categories, collections, categorySectionSettings, trendingProducts, lumoPromiseSettings, meetMakersSettings, promoBannerSettings } = props;

  const getProductsByIds = (ids: string[]) =>
    ids.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];

  const getCategorySectionStyle = (): React.CSSProperties => {
    const s = categorySectionSettings;
    switch (s.categorySectionBgType) {
      case 'image':
        return { backgroundImage: s.categorySectionBgImage ? `url(${s.categorySectionBgImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: s.categorySectionBgColor || '#f9fafb' };
      case 'gradient':
        return { background: `linear-gradient(${s.categorySectionBgGradientDirection || 'to right'}, ${s.categorySectionBgGradientFrom || '#667eea'}, ${s.categorySectionBgGradientTo || '#764ba2'})` };
      default:
        return { backgroundColor: s.categorySectionBgColor || '#f9fafb' };
    }
  };

  const categoryTextColor = categorySectionSettings.categorySectionTextColor || '#1f2937';
  const bestSellerProducts = getProductsByIds(collections.bestSellers);
  const newArrivalProducts = getProductsByIds(collections.newArrivals);
  const dealProducts = getProductsByIds(collections.deals);
  const showcaseProducts = trendingProducts.length > 0 ? trendingProducts : products;

  return (
    <div className="flex flex-col w-full bg-gray-50/50">
      {/* 1) Trust Bar */}
      <QuickTrustBar />

      {/* 2) Hero */}
      <HeroBanner />

      {/* 3) Categories */}
      <CategorySection categories={categories} style={getCategorySectionStyle()} textColor={categoryTextColor} />

      {/* 4) Product Sections */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <ProductShowcase title="Trending Now" icon={TrendingUp} products={showcaseProducts} viewAllLink="/products" viewAllLabel="Shop All" />

        {bestSellerProducts.length > 0 && (
          <ProductShowcase title="Best Sellers" icon={Crown} products={bestSellerProducts} viewAllLink="/products?filter=bestsellers" />
        )}

        <PromoBannerSection settings={promoBannerSettings} />

        {newArrivalProducts.length > 0 && (
          <ProductShowcase title="New Arrivals" icon={Sparkles} products={newArrivalProducts} viewAllLink="/products?filter=new" />
        )}

        {dealProducts.length > 0 && (
          <ProductShowcase title="Deals & Offers" icon={Tag} products={dealProducts} viewAllLink="/products?filter=deals" />
        )}

        {/* Explore All Products */}
        {products.length > 0 && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <div className="flex items-center gap-2 md:gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10"><ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-primary" /></div>
                <h2 className="text-base md:text-xl font-bold text-gray-900">Explore Products</h2>
                <span className="hidden md:inline text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{products.length} items</span>
              </div>
              <Link href="/products" className="group flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View All <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.slice(0, 10).map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} compact />
              ))}
            </div>
            <div className="md:hidden grid grid-cols-2 gap-2">
              {products.slice(0, 6).map((product, index) => (
                <CompactProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            <div className="md:hidden mt-3 text-center">
              <Link href="/products">
                <Button variant="outline" className="w-full rounded-xl gap-2">View All Products <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </section>
        )}

        <JulaZonePromise settings={lumoPromiseSettings} />
        <SellerCTA />
        <MeetMakers settings={meetMakersSettings} />
      </div>

      <RecentlyViewedProducts allProducts={products} maxItems={4} />
      <DetailedTrustSection className="mt-4" />
    </div>
  );
}
