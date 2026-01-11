
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ProductCard from '@/components/product-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Hero from '@/components/hero';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, TrendingUp, Sparkles, Tag, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Product, Category, PromoBannerSettings } from '@/lib/types';
import { ProductGridSkeleton, CategoryGridSkeleton } from '@/components/skeletons';
import { CATEGORY_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils';
import ServiceHighlights, { PromoBanner, DetailedTrustSection } from '@/components/service-highlights';
import SearchBar from '@/components/search-bar';
import CategoryProductSection, { CategoryProductGrid } from '@/components/category-product-section';
import { RecentlyViewedProducts } from '@/components/recently-viewed-products';
import CategoryChips from '@/components/category-chips';
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
      // Use proper caching - let browser and server cache responses
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

  // Show skeleton loading state while fetching data
  if (loading) {
    return (
      <div className="flex flex-col w-full" style={{ backgroundColor: 'var(--color-bg-page)', width: '100%' }}>
        <Hero initialSettings={heroSettings || undefined} />

        {/* Categories Skeleton */}
        <div className="w-full py-6 md:py-10 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="h-7 w-40 bg-muted animate-pulse rounded"></div>
            </div>
            <CategoryGridSkeleton count={6} />
          </div>
        </div>

        {/* Products Skeleton */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-6 w-6 bg-muted animate-pulse rounded"></div>
            <div className="h-7 w-40 bg-muted animate-pulse rounded"></div>
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
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
  products: Product[], 
  categories: Category[], 
  collections: Collections,
  categorySectionSettings: CategorySectionSettings,
  trendingProducts: Product[],
  lumoPromiseSettings: LumoPromiseSettings,
  meetMakersSettings: MeetMakersSettings,
  promoBannerSettings: PromoBannerSettings
}) {
  const { products, categories, collections, categorySectionSettings, trendingProducts, lumoPromiseSettings, meetMakersSettings, promoBannerSettings } = props;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Open filters by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowFilters(true);
      } else {
        setShowFilters(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 1000);
  }, [products]);

  // Update price range when products change
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  // read category from URL params when component mounts or params change
  useEffect(() => {
    const cat = searchParams?.get('category');
    if (cat) {
      setSelectedCategory(cat);
      // Scroll to products section when category is selected
      setTimeout(() => {
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    
    const search = searchParams?.get('search');
    if (search) {
      setSearchQuery(search);
      // Scroll to products section after a short delay
      setTimeout(() => {
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [searchParams]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(p => p.category === category.name);
      }
    }

    // Filter by price range
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filter by stock
    if (showInStockOnly) {
      filtered = filtered.filter(p => p.stock > 0);
    }

    // Sort products
    const sorted = [...filtered];
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'stock':
        sorted.sort((a, b) => b.stock - a.stock);
        break;
    }

    return sorted;
  }, [products, categories, searchQuery, selectedCategory, priceRange, showInStockOnly, sortBy]);

  // Helper function to get products by IDs
  const getProductsByIds = (ids: string[]) => {
    return ids.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  };

  const CollectionSection = ({ title, icon: Icon, productIds, viewAllLink }: {
    title: string;
    icon: any;
    productIds: string[];
    viewAllLink?: string;
  }) => {
    const collectionProducts = getProductsByIds(productIds).slice(0, 4);

    if (collectionProducts.length === 0) return null;

    return (
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-headline font-bold">{title}</h2>
          </div>
          {viewAllLink && (
            <Link href={viewAllLink}>
              <Button variant="ghost" className="gap-1 md:gap-2 text-sm md:text-base px-2 md:px-4">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
          {collectionProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    );
  };

  // Generate category section background style
  const getCategorySectionStyle = (): React.CSSProperties => {
    const { 
      categorySectionBgType, 
      categorySectionBgColor, 
      categorySectionBgImage,
      categorySectionBgGradientFrom,
      categorySectionBgGradientTo,
      categorySectionBgGradientDirection
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
        return {
          backgroundColor: categorySectionBgColor || '#f3f4f6',
        };
    }
  };

  const categoryTextColor = categorySectionSettings.categorySectionTextColor || '#1f2937';

  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: 'var(--color-bg-page)', width: '100%' }}>
      {/* Category Chips - Mobile only, STICKY below header (scrolls until it hits header, then sticks) */}
      <div 
        className="md:hidden sticky z-40 bg-white px-3 py-2 border-b -mt-px"
        style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px) - 1px)' }}
      >
        <CategoryChips 
          categories={categories} 
          selectedCategory={selectedCategory}
          onCategorySelect={(catId) => {
            setSelectedCategory(catId);
            if (catId !== 'all') {
              router.push(`/?category=${catId}`, { scroll: false });
            } else {
              router.push('/', { scroll: false });
            }
          }}
          maxVisible={6}
        />
      </div>

      <div className="w-full" style={{ width: '100%' }}>
        <Hero />
      </div>

      <div className="w-full">
        {/* Categories Section - With customizable background */}
        {categories.length > 0 && (
          <div 
            className="w-full py-6 md:py-10 mb-0"
            style={getCategorySectionStyle()}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 
                  className="text-xl md:text-2xl font-headline font-bold"
                  style={{ color: categoryTextColor }}
                >
                  Shop by Category
                </h2>
                <Button 
                  variant="ghost" 
                  className="gap-1 md:gap-2 text-sm md:text-base px-2 md:px-4" 
                  style={{ color: categoryTextColor }}
                  asChild
                >
                  <Link href="/categories">
                    <span style={{ color: categoryTextColor }}>View All</span> 
                    <ChevronRight className="h-4 w-4" style={{ color: categoryTextColor }} />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-3 md:gap-4">
                {categories.slice(0, 5).map((category) => {
                  const textClr = category.textColor || '#1f2937';
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        router.push(`/?category=${category.id}`, { scroll: false });
                        setTimeout(() => {
                          const productsSection = document.getElementById('products-section');
                          if (productsSection) {
                            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="group relative flex flex-col rounded-lg sm:rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 text-left"
                    >
                      {/* Image Container - compact on mobile */}
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
                      {/* Label - minimal on mobile */}
                      <div className="p-1 sm:p-3 md:p-4 text-center border-t">
                        <span 
                          className="text-[10px] sm:text-sm font-medium line-clamp-1"
                          style={{ color: textClr }}
                        >
                          {category.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          {/* MOBILE: Dense Product Grid - Show 6+ products above fold */}
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
            {/* Dense 2x3 grid for mobile - 6 products visible */}
            <div className="grid grid-cols-2 gap-2">
              {(trendingProducts.length > 0 ? trendingProducts : products).slice(0, 6).map((product, index) => (
                <CompactProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>

          {/* DESKTOP: Original Trending Products layout */}
          {trendingProducts && trendingProducts.length > 0 && (
            <div className="hidden md:block mb-8 md:mb-12">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <h2 className="text-xl md:text-2xl font-headline font-bold">Trending Now</h2>
                </div>
                <Link href="/products">
                  <Button variant="ghost" className="gap-1 md:gap-2 text-sm md:text-base px-2 md:px-4">
                    Shop All <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                {trendingProducts.slice(0, 4).map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Featured Collections */}
          <CollectionSection
            title="Best Sellers"
            icon={TrendingUp}
            productIds={collections.bestSellers}
            viewAllLink="/products?filter=bestsellers"
          />
          
          {/* Promotional Banner */}
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

          <CollectionSection
            title="New Arrivals"
            icon={Sparkles}
            productIds={collections.newArrivals}
            viewAllLink="/products?filter=new"
          />
          <CollectionSection
            title="Deals & Offers"
            icon={Tag}
            productIds={collections.deals}
            viewAllLink="/products?filter=deals"
          />

          {/* Category-Based Product Sections - Show products organized by category */}
          {categories.length > 0 && products.length > 0 && (
            <div className="mb-8 md:mb-12">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-headline font-bold">Shop by Category</h2>
                <Link href="/products">
                  <Button variant="ghost" className="gap-1 text-xs md:text-sm px-2 md:px-3">
                    View All Products <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              
              {/* Horizontal category product sections */}
              {categories.slice(0, 6).map((category) => (
                <CategoryProductSection 
                  key={category.id}
                  category={category}
                  products={products}
                  maxProducts={8}
                />
              ))}
            </div>
          )}

          {/* Enhanced Search and Sort Bar */}
          <div id="products-section" className="mb-4 flex flex-col gap-2 rounded-xl border bg-white/60 backdrop-blur-sm p-2 md:p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Input
                placeholder="Search for products..."
                className="pl-9 h-9 text-sm border-0 bg-white/80 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderRadius: 'var(--radius-input)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: 'var(--color-text-secondary)' }}
              />
            </div>

            <div className="flex gap-1.5 items-center">
              <span className="text-sm text-muted-foreground hidden md:inline">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  className="w-full md:w-[200px] border-0 bg-white/80 flex-1 h-9 text-xs md:text-sm"
                  style={{
                    borderRadius: 'var(--radius-button)',
                  }}
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="stock">Most in Stock</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-3 py-1.5 border hover:bg-accent transition-colors rounded-lg"
                style={{
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
            {/* Enhanced Filters Sidebar */}
            <aside className={`
              ${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden'}
              md:relative md:block md:z-0 md:bg-transparent md:p-0 md:overflow-visible md:col-span-1
            `}>
                <div className="md:sticky md:top-20 w-full rounded-2xl border-0 md:border bg-white/70 backdrop-blur-sm p-0 md:p-5 shadow-none md:shadow-sm space-y-6 h-full md:h-auto">
                  {/* Filter Header */}
                  <div className="flex items-center justify-between md:block">
                    <div>
                      <h3 className="font-headline font-bold text-lg">Filters</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Refine your search
                      </p>
                    </div>
                    <button onClick={() => setShowFilters(false)} className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                  </div>

                  <Separator />

                  {/* Category Filter Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold block">
                      Category
                    </Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="border-0 bg-white/80">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Price Range Filter Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold block">
                      Price Range
                    </Label>
                    <div className="text-sm font-medium text-center py-2 px-3 bg-white/80 rounded-lg">
                      ${priceRange[0]} - ${priceRange[1]}
                    </div>
                    <Slider
                      min={0}
                      max={maxPrice}
                      step={10}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="my-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>${maxPrice}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Availability Filter Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold block">
                      Availability
                    </Label>
                    <div className="flex items-center justify-between p-3 bg-white/80 rounded-lg">
                      <Label htmlFor="in-stock" className="text-sm cursor-pointer">
                        In Stock Only
                      </Label>
                      <Switch
                        id="in-stock"
                        checked={showInStockOnly}
                        onCheckedChange={setShowInStockOnly}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Filter Summary */}
                  <div className="pt-2 text-center">
                    <p className="text-sm font-medium">
                      {filteredAndSortedProducts.length} of {products.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      products found
                    </p>
                  </div>
                </div>
              </aside>

            {/* Products Grid - Dense on mobile, standard on desktop */}
            <div className={showFilters ? "md:col-span-3" : "md:col-span-4"}>
              {filteredAndSortedProducts.length > 0 ? (
                <>
                  {/* Mobile: Dense 2-column grid with compact cards */}
                  <div className="md:hidden grid grid-cols-2 gap-2">
                    {filteredAndSortedProducts.map((product, index) => (
                      <CompactProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                  {/* Desktop: Standard grid */}
                  <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-2">No products found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
                </div>
              )}
            </div>
          </div>

          {/* Trust & Story Sections */}
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
                      className={`font-headline text-base md:text-4xl font-${lumoPromiseSettings.lumoPromiseTitleWeight || 'bold'}`}
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
                      className={`font-headline text-base md:text-4xl text-center`}
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

      {/* Recently Viewed Products - Only shows if preference cookies enabled */}
      <RecentlyViewedProducts allProducts={products} maxItems={4} />

      {/* Detailed Trust Section - Near Footer */}
      <DetailedTrustSection className="mt-8" />
    </div>
  );
}
