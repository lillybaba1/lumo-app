"use client";

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product-card';
import CompactProductCard from '@/components/compact-product-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProductsPaginated, getCategories } from '@/services/productService';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';

function ProductsLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-muted-foreground">Loading products...</p>
      </div>
    </div>
  );
}

function ProductsPageContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <ProductsLoadingSkeleton />;
  }

  return (
    <Suspense fallback={<ProductsLoadingSkeleton />}>
      <ProductsPage categories={categories} />
    </Suspense>
  );
}

export default function ProductsPageContainer() {
  return (
    <Suspense fallback={<ProductsLoadingSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}

// Collections type for filtering
type Collections = {
  bestSellers: string[];
  newArrivals: string[];
  deals: string[];
  featured: string[];
};

function ProductsPage({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collections | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  
  // Use a derived state for showing desktop filters, but mobile uses Sheet
  // Mobile sheet is controlled by its own trigger
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);

  // Get filter parameter from URL
  const filterParam = searchParams?.get('filter');

  // Fetch collections on mount
  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await fetch('/api/collections');
        const data = await res.json();
        setCollections(data);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      }
    }
    fetchCollections();
  }, []);

  // Initialize filters from URL
  useEffect(() => {
    const cat = searchParams?.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products
  const fetchProducts = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    const currentPage = isLoadMore ? page + 1 : 1;
    
    // Map sort option
    let sortOption: any = 'name_asc';
    if (sortBy === 'name-desc') sortOption = 'name_desc';
    if (sortBy === 'price-asc') sortOption = 'price_asc';
    if (sortBy === 'price-desc') sortOption = 'price_desc';
    if (filterParam === 'new') sortOption = 'newest';

    // Map category
    // If selectedCategory is an ID (which it is from the select), pass it as categoryId
    // If it's 'all', pass undefined
    const categoryId = selectedCategory !== 'all' ? selectedCategory : undefined;
    
    // Special filter params
    let maxPrice = priceRange[1];
    if (filterParam === 'deals') maxPrice = 50;
    
    // Get product IDs from collections based on filter param
    let productIds: string[] | undefined;
    if (collections && filterParam) {
      switch (filterParam) {
        case 'featured':
          productIds = collections.featured.length > 0 ? collections.featured : undefined;
          break;
        case 'bestsellers':
          productIds = collections.bestSellers.length > 0 ? collections.bestSellers : undefined;
          break;
        case 'new':
          productIds = collections.newArrivals.length > 0 ? collections.newArrivals : undefined;
          break;
        case 'deals':
          productIds = collections.deals.length > 0 ? collections.deals : undefined;
          break;
      }
    }

    try {
      const { data, count } = await getProductsPaginated({
        page: currentPage,
        limit: 20,
        search: debouncedSearchQuery,
        categoryId,
        minPrice: priceRange[0],
        maxPrice,
        sortBy: sortOption,
        productIds,
      });

      if (isLoadMore) {
        setProducts(prev => [...prev, ...data]);
        setPage(currentPage);
      } else {
        setProducts(data);
        setPage(1);
      }
      setTotalCount(count);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, debouncedSearchQuery, selectedCategory, sortBy, priceRange, filterParam, collections]);

  // Initial fetch and refetch on filter change
  // Wait for collections to load if a filter param is present
  useEffect(() => {
    // If we have a filter param but collections haven't loaded yet, wait
    if (filterParam && !collections) {
      return;
    }
    fetchProducts(false);
  }, [debouncedSearchQuery, selectedCategory, sortBy, priceRange[0], priceRange[1], filterParam, collections]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get page title based on filter
  const pageTitle = useMemo(() => {
    switch (filterParam) {
      case 'new': return 'New Arrivals';
      case 'bestsellers': return 'Best Sellers';
      case 'deals': return 'Deals & Offers';
      case 'featured': return 'Featured Products';
      default: return 'All Products';
    }
  }, [filterParam]);

  const FilterUI = ({ showSearch = false }: { showSearch?: boolean }) => (
    <div className="space-y-6">
      {showSearch && (
        <>
          <div className="space-y-3">
             <Label className="text-sm font-semibold block">Search</Label>
             <div className="relative">
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             </div>
          </div>
          <Separator />
        </>
      )}

      <div>
        <h3 className="font-semibold mb-3">Filters</h3>
        <p className="text-sm text-muted-foreground">Refine your selection</p>
      </div>

      <Separator />

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold block">Category</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full bg-background">
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

      {/* Price Range Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold block">
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </Label>
        <div className="px-1">
          <Slider
            min={0}
            max={1000}
            step={10}
            value={priceRange}
            onValueChange={setPriceRange}
            className="my-4"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>$1000</span>
        </div>
      </div>

      <Separator />
      
      {/* Availability Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="stock-filter" className="text-sm font-semibold cursor-pointer">In Stock Only</Label>
          <Switch 
            id="stock-filter"
            checked={showInStockOnly}
            onCheckedChange={setShowInStockOnly}
          />
        </div>
      </div>
      
      <Separator />

      {/* Filter Summary */}
      <div className="pt-2 text-center">
        <p className="text-sm font-medium">
          Showing {products.length} of {totalCount} products
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-8 md:py-12 mb-6 md:mb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">{pageTitle}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {filterParam === 'new' && 'Discover our latest products'}
              {filterParam === 'bestsellers' && 'Shop our most popular items'}
              {filterParam === 'deals' && 'Amazing deals you don\'t want to miss'}
              {filterParam === 'featured' && 'Hand-picked favorites just for you'}
              {!filterParam && 'Browse our complete collection'}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-2 md:py-8">
          {/* Search and Sort Bar */}
          <div className="flex flex-col gap-2 mb-4 mx-2 md:flex-row md:items-center md:justify-between md:mb-8 md:mx-0 p-2 rounded-xl bg-white/60 backdrop-blur-sm border shadow-sm md:border-0 md:bg-transparent md:shadow-none md:p-0">
            <div className="relative flex-1 hidden md:block">
              <Input
                placeholder="Search products..."
                className="pl-9 h-9 md:h-10 text-sm bg-white/80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex gap-2 items-center w-full md:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px] h-9 md:h-10 text-xs md:text-sm bg-white/80 flex-1">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Sheet Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden shrink-0 h-9 w-9 bg-white/80">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Filters & Search</SheetTitle>
                  </SheetHeader>
                  <FilterUI showSearch={true} />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Desktop Filters Sidebar */}
            <div className="hidden md:block md:col-span-1">
              <Card className="sticky top-24 border bg-white/60 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <FilterUI showSearch={false} />
                </CardContent>
              </Card>
            </div>

            {/* Products Grid */}
            <div className="md:col-span-3">
              {loading ? (
                 <div className="flex justify-center py-12">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
                    {products.map((product) => (
                      <CompactProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {products.length < totalCount && (
                    <div className="mt-8 flex justify-center">
                      <Button 
                        onClick={() => fetchProducts(true)} 
                        disabled={loadingMore}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More Products'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-2">No products found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
                  <Button 
                    variant="link" 
                    onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setPriceRange([0, 1000]);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
