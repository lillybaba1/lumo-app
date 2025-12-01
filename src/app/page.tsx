
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import type { Product, Category } from '@/lib/types';

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

export default function HomePageDataContainer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collections>({ bestSellers: [], newArrivals: [], deals: [] });
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch all data in parallel using API routes for better performance
      const nocache = Date.now();
      const [productsRes, categoriesRes, collectionsRes, settingsRes, heroRes] = await Promise.all([
        fetch(`/api/products?nocache=${nocache}`).then(r => r.ok ? r.json() : { products: [] }).catch(() => ({ products: [] })),
        fetch(`/api/categories?nocache=${nocache}`).then(r => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
        fetch('/api/collections').then(r => r.ok ? r.json() : { bestSellers: [], newArrivals: [], deals: [] }).catch(() => ({ bestSellers: [], newArrivals: [], deals: [] })),
        fetch(`/api/settings?nocache=${nocache}`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetch(`/api/hero?nocache=${nocache}`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      ]);
      
      setProducts(Array.isArray(productsRes) ? productsRes : (productsRes.products || []));
      setCategories(categoriesRes.categories || (Array.isArray(categoriesRes) ? categoriesRes : []));
      setCollections(collectionsRes);
      setHeroSettings({ ...settingsRes, ...heroRes });
      setLoading(false);
    }
    fetchData();
  }, []);

  // Show Hero immediately with settings even while loading other content
  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Hero initialSettings={heroSettings || undefined} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return <Home products={products} categories={categories} collections={collections} />;
}

function Home({ products, categories, collections }: { products: Product[], categories: Category[], collections: Collections }) {
  const searchParams = useSearchParams();
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
    if (cat) setSelectedCategory(cat);
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
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: 'var(--color-bg-page)' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-4 md:py-6 mt-12 lg:mt-0">
        <Hero />
      </div>

      <div className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          {/* Categories Section - Show immediately after Hero */}
          {categories.length > 0 && (
            <div className="mb-8 md:mb-12">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-headline font-bold">Shop by Category</h2>
                <Button variant="ghost" className="gap-1 md:gap-2 text-sm md:text-base px-2 md:px-4" asChild>
                  <Link href="/categories">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
                {categories.slice(0, 6).map((category) => {
                  const cardBg = category.bgColor || '#ffffff';
                  const iconBg = category.iconBgColor || 'rgba(139, 92, 246, 0.15)';
                  const textClr = category.textColor || '#1f2937';
                  
                  return (
                    <Link
                      key={category.id}
                      href={`/?category=${category.id}`}
                      className="group flex flex-col items-center p-3 md:p-4 rounded-xl border hover:border-primary hover:shadow-md transition-all"
                      style={{ backgroundColor: cardBg }}
                    >
                      <div 
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: iconBg }}
                      >
                        <span className="text-2xl md:text-3xl">
                          {category.icon || '🛍️'}
                        </span>
                      </div>
                      <span 
                        className="text-xs md:text-sm font-medium text-center line-clamp-2"
                        style={{ color: textClr }}
                      >
                        {category.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trending Products - Always show some products immediately */}
          {products.length > 0 && (
            <div className="mb-8 md:mb-12">
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
                {products.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
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

          {/* Featured Products - Shows when collections are empty */}
          {collections.bestSellers.length === 0 && collections.newArrivals.length === 0 && products.length > 0 && (
            <div className="mb-8 md:mb-12">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <h2 className="text-xl md:text-2xl font-headline font-bold">Featured Products</h2>
                </div>
                <Link href="/products">
                  <Button variant="ghost" className="gap-1 md:gap-2 text-sm md:text-base px-2 md:px-4">
                    View All <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                {products.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Search and Sort Bar */}
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-white/60 backdrop-blur-sm p-3 md:p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Input
                placeholder="Search for products..."
                className="pl-10 border-0 bg-white/80 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderRadius: 'var(--radius-input)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                style={{ color: 'var(--color-text-secondary)' }}
              />
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground hidden md:inline">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  className="w-full md:w-[200px] border-0 bg-white/80 flex-1"
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
                className="md:hidden px-4 py-2 border hover:bg-accent transition-colors rounded-xl"
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

            {/* Products Grid */}
            <div className={showFilters ? "md:col-span-3" : "md:col-span-4"}>
              {filteredAndSortedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-2">No products found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
                </div>
              )}
            </div>
          </div>

          {/* Trust & Story Sections */}
          <section className="mt-16 space-y-12">
            {/* The Lumo Promise */}
            <Card className="overflow-hidden rounded-2xl border bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-sm">
              <CardContent className="p-8 md:p-12">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                  <h2 className="font-headline font-bold text-3xl md:text-4xl">
                    The Lumo Promise
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Every product in our collection is carefully curated with ethics,
                    craftsmanship, and sustainability at its core. We partner with artisans
                    and makers who share our commitment to quality and responsible practices.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="space-y-2">
                      <div className="text-2xl">🌱</div>
                      <h3 className="font-semibold">Sustainable</h3>
                      <p className="text-sm text-muted-foreground">
                        Eco-friendly materials and processes
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl">✨</div>
                      <h3 className="font-semibold">Quality Crafted</h3>
                      <p className="text-sm text-muted-foreground">
                        Handpicked for excellence
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl">🤝</div>
                      <h3 className="font-semibold">Fair Trade</h3>
                      <p className="text-sm text-muted-foreground">
                        Supporting artisan communities
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meet the Makers */}
            <Card className="overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm">
              <CardContent className="p-8 md:p-12">
                <div className="max-w-3xl mx-auto space-y-4">
                  <h2 className="font-headline font-bold text-3xl md:text-4xl text-center">
                    Meet the Makers
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed text-center">
                    Behind every product is a story of skilled artisans dedicated to their craft.
                    From traditional techniques passed down through generations to innovative
                    approaches that honor heritage while embracing the future, each piece
                    represents a commitment to authenticity and excellence.
                  </p>
                  <p className="text-base text-muted-foreground leading-relaxed text-center">
                    We're proud to work directly with makers from diverse communities,
                    ensuring fair compensation and celebrating the unique cultural traditions
                    that make each product special.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
