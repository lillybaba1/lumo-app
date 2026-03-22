"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProductCard from '@/components/product-card';
import { Card, CardContent } from "@/components/ui/card";
import Hero from '@/components/hero';
import { TrendingUp, Sparkles, Tag, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Product, Category, PromoBannerSettings } from '@/lib/types';
import { ProductGridSkeleton, CategoryGridSkeleton } from '@/components/skeletons';
import { CATEGORY_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils';
import { PromoBanner, DetailedTrustSection } from '@/components/service-highlights';
import CategoryProductSection from '@/components/category-product-section';
import { RecentlyViewedProducts } from '@/components/recently-viewed-products';
import CategoryChips from '@/components/category-chips';
import CompactProductCard from '@/components/compact-product-card';

// ─── Types ───────────────────────────────────────────────────────────────────

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

type HomepageData = {
  settings: SettingsResponse;
  hero: HeroSettings | null;
  categories: Category[];
  collections: Collections;
  collectionProducts: Product[];
  trendingProducts: Product[];
  products: Product[];
  promoBanner: PromoBannerSettings;
};

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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HomePageDataContainer() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/homepage');
        if (!res.ok) throw new Error('Failed to fetch homepage data');
        const json: HomepageData = await res.json();
        setData(json);
      } catch (err) {
        console.error('Homepage fetch error:', err);
        // Set empty defaults so the page still renders
        setData({
          settings: {},
          hero: null,
          categories: [],
          collections: { bestSellers: [], newArrivals: [], deals: [] },
          collectionProducts: [],
          trendingProducts: [],
          products: [],
          promoBanner: DEFAULT_PROMO_BANNER,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col w-full" style={{ backgroundColor: 'var(--color-bg-page)', width: '100%' }}>
        <Hero />
        {/* Categories Skeleton */}
        <div className="w-full py-6 md:py-10 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="h-7 w-40 bg-muted animate-pulse rounded" />
            </div>
            <CategoryGridSkeleton count={6} />
          </div>
        </div>
        {/* Products Skeleton */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-6 w-6 bg-muted animate-pulse rounded" />
            <div className="h-7 w-40 bg-muted animate-pulse rounded" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  // Extract settings
  const settings = data.settings || {};
  const categorySectionSettings: CategorySectionSettings = {
    categorySectionBgType: settings.categorySectionBgType,
    categorySectionBgColor: settings.categorySectionBgColor,
    categorySectionBgImage: settings.categorySectionBgImage,
    categorySectionBgGradientFrom: settings.categorySectionBgGradientFrom,
    categorySectionBgGradientTo: settings.categorySectionBgGradientTo,
    categorySectionBgGradientDirection: settings.categorySectionBgGradientDirection,
    categorySectionTextColor: settings.categorySectionTextColor,
  };
  const lumoPromiseSettings: LumoPromiseSettings = {
    lumoPromiseEnabled: settings.lumoPromiseEnabled ?? true,
    lumoPromiseTitle: settings.lumoPromiseTitle,
    lumoPromiseDescription: settings.lumoPromiseDescription,
    lumoPromiseBgColor: settings.lumoPromiseBgColor,
    lumoPromiseTextColor: settings.lumoPromiseTextColor,
    lumoPromiseTitleSize: settings.lumoPromiseTitleSize,
    lumoPromiseTitleWeight: settings.lumoPromiseTitleWeight,
    lumoPromiseFeature1Icon: settings.lumoPromiseFeature1Icon,
    lumoPromiseFeature1Title: settings.lumoPromiseFeature1Title,
    lumoPromiseFeature1Subtitle: settings.lumoPromiseFeature1Subtitle,
    lumoPromiseFeature2Icon: settings.lumoPromiseFeature2Icon,
    lumoPromiseFeature2Title: settings.lumoPromiseFeature2Title,
    lumoPromiseFeature2Subtitle: settings.lumoPromiseFeature2Subtitle,
    lumoPromiseFeature3Icon: settings.lumoPromiseFeature3Icon,
    lumoPromiseFeature3Title: settings.lumoPromiseFeature3Title,
    lumoPromiseFeature3Subtitle: settings.lumoPromiseFeature3Subtitle,
  };
  const meetMakersSettings: MeetMakersSettings = {
    meetMakersEnabled: settings.meetMakersEnabled ?? true,
    meetMakersTitle: settings.meetMakersTitle,
    meetMakersDescription: settings.meetMakersDescription,
    meetMakersBgColor: settings.meetMakersBgColor,
    meetMakersTextColor: settings.meetMakersTextColor,
    meetMakersTitleSize: settings.meetMakersTitleSize,
    meetMakersTitleWeight: settings.meetMakersTitleWeight,
  };

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <Home
        categories={data.categories}
        collections={data.collections}
        collectionProducts={data.collectionProducts}
        trendingProducts={data.trendingProducts}
        products={data.products}
        categorySectionSettings={categorySectionSettings}
        lumoPromiseSettings={lumoPromiseSettings}
        meetMakersSettings={meetMakersSettings}
        promoBannerSettings={data.promoBanner}
      />
    </Suspense>
  );
}

// ─── Home Layout ─────────────────────────────────────────────────────────────

function Home(props: {
  categories: Category[];
  collections: Collections;
  collectionProducts: Product[];
  trendingProducts: Product[];
  products: Product[];
  categorySectionSettings: CategorySectionSettings;
  lumoPromiseSettings: LumoPromiseSettings;
  meetMakersSettings: MeetMakersSettings;
  promoBannerSettings: PromoBannerSettings;
}) {
  const {
    categories,
    collections,
    collectionProducts,
    trendingProducts,
    products,
    categorySectionSettings,
    lumoPromiseSettings,
    meetMakersSettings,
    promoBannerSettings,
  } = props;

  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Build a product map for collection lookups
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  // Helper: resolve product IDs → Product[]
  const getProductsByIds = (ids: string[]) =>
    ids.map(id => productMap.get(id)).filter(Boolean) as Product[];

  // All products for category sections
  const allProducts = products;

  // ─── Collection Section Component ──────────────────────────────────────────

  const CollectionSection = ({ title, icon: Icon, productIds, viewAllLink }: {
    title: string;
    icon: any;
    productIds: string[];
    viewAllLink?: string;
  }) => {
    const sectionProducts = getProductsByIds(productIds).slice(0, 5);
    if (sectionProducts.length === 0) return null;

    return (
      <div className="mb-6 md:mb-10">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <h2 className="text-lg md:text-xl font-headline font-bold">{title}</h2>
          </div>
          {viewAllLink && (
            <Link href={viewAllLink}>
              <Button variant="ghost" size="sm" className="gap-1 text-sm px-3">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
          {sectionProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    );
  };

  // ─── Category Section Style ────────────────────────────────────────────────

  const getCategorySectionStyle = (): React.CSSProperties => {
    const {
      categorySectionBgType,
      categorySectionBgColor,
      categorySectionBgImage,
      categorySectionBgGradientFrom,
      categorySectionBgGradientTo,
      categorySectionBgGradientDirection,
    } = categorySectionSettings;

    switch (categorySectionBgType) {
      case 'image':
        return {
          backgroundImage: categorySectionBgImage ? `url(${categorySectionBgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: categorySectionBgColor || '#f3f4f6',
        };
      case 'gradient':
        return {
          background: `linear-gradient(${categorySectionBgGradientDirection || 'to right'}, ${categorySectionBgGradientFrom || '#667eea'}, ${categorySectionBgGradientTo || '#764ba2'})`,
        };
      case 'color':
      default:
        return { backgroundColor: categorySectionBgColor || '#f3f4f6' };
    }
  };

  const categoryTextColor = categorySectionSettings.categorySectionTextColor || '#1f2937';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: 'var(--color-bg-page)', width: '100%' }}>

      {/* ── Mobile Category Chips (fixed below header) ── */}
      <div
        className="md:hidden fixed left-0 right-0 z-40 bg-white px-3 py-2 border-b shadow-sm"
        style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
      >
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={(catId) => {
            setSelectedCategory(catId);
            if (catId !== 'all') {
              router.push(`/products?category=${catId}`);
            } else {
              router.push('/');
            }
          }}
          maxVisible={6}
        />
      </div>
      {/* Spacer for fixed category bar on mobile */}
      <div className="md:hidden w-full" style={{ height: '53px' }} />

      {/* ── Hero ── */}
      <div className="w-full" style={{ width: '100%' }}>
        <Hero />
      </div>

      <div className="w-full">

        {/* ── Categories Grid ── */}
        {categories.length > 0 && (
          <div className="w-full py-5 md:py-8 mb-0" style={getCategorySectionStyle()}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2
                  className="text-lg md:text-xl font-headline font-bold"
                  style={{ color: categoryTextColor }}
                >
                  Shop by Category
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-sm px-3"
                  style={{ color: categoryTextColor }}
                  asChild
                >
                  <Link href="/categories">
                    <span style={{ color: categoryTextColor }}>View All</span>
                    <ChevronRight className="h-4 w-4" style={{ color: categoryTextColor }} />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 md:gap-3">
                {categories.slice(0, 5).map((category) => {
                  const textClr = category.textColor || '#1f2937';
                  return (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.id}`}
                      className="group relative flex flex-col rounded-lg sm:rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 text-left"
                    >
                      <div className="aspect-[3/2] sm:aspect-square relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes={IMAGE_SIZES.category}
                            placeholder="blur"
                            blurDataURL={CATEGORY_BLUR_DATA_URL}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl sm:text-4xl md:text-5xl">{category.icon || '🛍️'}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-1 sm:p-3 md:p-4 text-center border-t">
                        <span
                          className="text-[10px] sm:text-sm font-medium line-clamp-1"
                          style={{ color: textClr }}
                        >
                          {category.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">

          {/* ── MOBILE: Trending — Dense 2×3 compact cards ── */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold">Trending Now</h2>
              </div>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="gap-1 text-xs px-2 h-7">
                  See All <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {trendingProducts.slice(0, 6).map((product, index) => (
                <CompactProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>

          {/* ── DESKTOP: Trending Products ── */}
          {trendingProducts.length > 0 && (
            <div className="hidden md:block mb-8 md:mb-10">
              <div className="flex items-center justify-between mb-3 md:mb-5">
                <div className="flex items-center gap-2 md:gap-3">
                  <TrendingUp className="h-5 w-5 md:h-5 md:w-5 text-primary" />
                  <h2 className="text-lg md:text-xl font-headline font-bold">Trending Now</h2>
                </div>
                <Link href="/products">
                  <Button variant="ghost" size="sm" className="gap-1 text-sm px-3">
                    Shop All <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {trendingProducts.slice(0, 6).map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} compact />
                ))}
              </div>
            </div>
          )}

          {/* ── Best Sellers Collection ── */}
          <CollectionSection
            title="Best Sellers"
            icon={TrendingUp}
            productIds={collections.bestSellers}
            viewAllLink="/products?filter=bestsellers"
          />

          {/* ── Promo Banner ── */}
          {promoBannerSettings.enabled && (
            <div className="mb-8 md:mb-12">
              <PromoBanner
                title={promoBannerSettings.title}
                subtitle={promoBannerSettings.subtitle}
                ctaText={promoBannerSettings.ctaText}
                ctaLink={promoBannerSettings.ctaLink}
                bgGradientFrom={promoBannerSettings.bgGradientFrom}
                bgGradientTo={promoBannerSettings.bgGradientTo}
                textColor={promoBannerSettings.textColor}
                iconType={promoBannerSettings.icon}
              />
            </div>
          )}

          {/* ── New Arrivals Collection ── */}
          <CollectionSection
            title="New Arrivals"
            icon={Sparkles}
            productIds={collections.newArrivals}
            viewAllLink="/products?filter=new"
          />

          {/* ── Deals Collection ── */}
          <CollectionSection
            title="Deals & Offers"
            icon={Tag}
            productIds={collections.deals}
            viewAllLink="/products?filter=deals"
          />

          {/* ── Category-Based Product Sections ── */}
          {categories.length > 0 && allProducts.length > 0 && (
            <div className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-headline font-bold">Shop by Category</h2>
                <Link href="/products">
                  <Button variant="ghost" size="sm" className="gap-1 text-sm px-3">
                    View All Products <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              {categories.slice(0, 6).map((category) => (
                <CategoryProductSection
                  key={category.id}
                  category={category}
                  products={allProducts}
                  maxProducts={8}
                />
              ))}
            </div>
          )}

          {/* ── Shop All Products CTA ── */}
          <div className="my-8 md:my-12 text-center">
            <Link href="/products">
              <Button size="lg" className="gap-2 px-8 py-6 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                <ShoppingBag className="h-5 w-5" />
                Shop All Products
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-3">
              Browse our full collection with filters, search &amp; sorting
            </p>
          </div>

          {/* ── Trust & Story Sections ── */}
          <section className="mt-6 md:mt-16 space-y-4 md:space-y-12">
            {/* The JulaZone Promise */}
            {lumoPromiseSettings.lumoPromiseEnabled !== false && (
              <Card
                className="overflow-hidden rounded-xl md:rounded-2xl border backdrop-blur-sm shadow-sm"
                style={{ backgroundColor: lumoPromiseSettings.lumoPromiseBgColor || '#ffffff' }}
              >
                <CardContent className="p-3 md:p-12">
                  <div className="max-w-3xl mx-auto text-center space-y-1.5 md:space-y-4" style={{ color: lumoPromiseSettings.lumoPromiseTextColor || '#000000' }}>
                    <h2
                      className="font-headline text-base md:text-4xl"
                      style={{ fontWeight: lumoPromiseSettings.lumoPromiseTitleWeight === 'extrabold' ? 800 : lumoPromiseSettings.lumoPromiseTitleWeight === 'bold' ? 700 : lumoPromiseSettings.lumoPromiseTitleWeight === 'semibold' ? 600 : lumoPromiseSettings.lumoPromiseTitleWeight === 'medium' ? 500 : 400 }}
                    >
                      {lumoPromiseSettings.lumoPromiseTitle || 'The JulaZone Promise'}
                    </h2>
                    <p className="text-xs md:text-lg leading-relaxed opacity-80">
                      {lumoPromiseSettings.lumoPromiseDescription || 'Every product in our collection is carefully curated with ethics, craftsmanship, and sustainability at its core.'}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-6 mt-2 md:mt-8">
                      <div className="space-y-0.5 md:space-y-2">
                        <div className="text-lg md:text-2xl">{lumoPromiseSettings.lumoPromiseFeature1Icon || '🌱'}</div>
                        <h3 className="font-semibold text-[10px] md:text-base">{lumoPromiseSettings.lumoPromiseFeature1Title || 'Sustainable'}</h3>
                        <p className="text-[10px] md:text-sm opacity-70 hidden md:block">
                          {lumoPromiseSettings.lumoPromiseFeature1Subtitle || 'Eco-friendly materials and processes'}
                        </p>
                      </div>
                      <div className="space-y-0.5 md:space-y-2">
                        <div className="text-lg md:text-2xl">{lumoPromiseSettings.lumoPromiseFeature2Icon || '✨'}</div>
                        <h3 className="font-semibold text-[10px] md:text-base">{lumoPromiseSettings.lumoPromiseFeature2Title || 'Quality Crafted'}</h3>
                        <p className="text-[10px] md:text-sm opacity-70 hidden md:block">
                          {lumoPromiseSettings.lumoPromiseFeature2Subtitle || 'Handpicked for excellence'}
                        </p>
                      </div>
                      <div className="space-y-0.5 md:space-y-2">
                        <div className="text-lg md:text-2xl">{lumoPromiseSettings.lumoPromiseFeature3Icon || '🤝'}</div>
                        <h3 className="font-semibold text-[10px] md:text-base">{lumoPromiseSettings.lumoPromiseFeature3Title || 'Fair Trade'}</h3>
                        <p className="text-[10px] md:text-sm opacity-70 hidden md:block">
                          {lumoPromiseSettings.lumoPromiseFeature3Subtitle || 'Supporting artisan communities'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meet the Makers */}
            {meetMakersSettings.meetMakersEnabled !== false && (
              <Card
                className="overflow-hidden rounded-xl md:rounded-2xl border backdrop-blur-sm shadow-sm"
                style={{ backgroundColor: meetMakersSettings.meetMakersBgColor || '#ffffff' }}
              >
                <CardContent className="p-3 md:p-12">
                  <div className="max-w-3xl mx-auto space-y-1 md:space-y-4" style={{ color: meetMakersSettings.meetMakersTextColor || '#000000' }}>
                    <h2
                      className="font-headline text-base md:text-4xl text-center"
                      style={{ fontWeight: meetMakersSettings.meetMakersTitleWeight === 'extrabold' ? 800 : meetMakersSettings.meetMakersTitleWeight === 'bold' ? 700 : meetMakersSettings.meetMakersTitleWeight === 'semibold' ? 600 : meetMakersSettings.meetMakersTitleWeight === 'medium' ? 500 : 400 }}
                    >
                      {meetMakersSettings.meetMakersTitle || 'Meet the Makers'}
                    </h2>
                    <p className="text-xs md:text-lg leading-relaxed text-center opacity-80">
                      {meetMakersSettings.meetMakersDescription || 'Behind every product is a story of skilled artisans dedicated to their craft, using traditional techniques passed down through generations.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>

      {/* Recently Viewed Products */}
      <RecentlyViewedProducts allProducts={allProducts} maxItems={4} />

      {/* Detailed Trust Section — Near Footer */}
      <DetailedTrustSection className="mt-8" />
    </div>
  );
}
