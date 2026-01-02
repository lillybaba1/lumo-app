"use client";

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProductsPaginated, getCategories } from '@/services/productService';
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

function ProductsPage({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
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
  const [showFilters, setShowFilters] = useState(true);

  // Get filter parameter from URL
  const filterParam = searchParams?.get('filter');

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

    try {
      const { data, count } = await getProductsPaginated({
        page: currentPage,
        limit: 20,
        search: debouncedSearchQuery,
        categoryId,
        minPrice: priceRange[0],
        maxPrice,
        sortBy: sortOption,
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
  }, [page, debouncedSearchQuery, selectedCategory, sortBy, priceRange, filterParam]);

  // Initial fetch and refetch on filter change
  useEffect(() => {
    fetchProducts(false);
  }, [debouncedSearchQuery, selectedCategory, sortBy, priceRange[0], priceRange[1], filterParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get page title based on filter
  const pageTitle = useMemo(() => {
    switch (filterParam) {
      case 'new': return 'New Arrivals';
      case 'bestsellers': return 'Best Sellers';
      case 'deals': return 'Deals & Offers';
      default: return 'All Products';
    }
  }, [filterParam]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-12 mb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-2">{pageTitle}</h1>
            <p className="text-muted-foreground">
              {filterParam === 'new' && 'Discover our latest products'}
              {filterParam === 'bestsellers' && 'Shop our most popular items'}
              {filterParam === 'deals' && 'Amazing deals you don\'t want to miss'}
              {!filterParam && 'Browse our complete collection'}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Sort Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Input
                placeholder="Search for products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-4 py-2 border rounded-md hover:bg-accent"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="md:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Filters</h3>
                    </div>

                    <Separator />

                    {/* Category Filter */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">
                        Category
                      </Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
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
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </Label>
                      <Slider
                        min={0}
                        max={1000}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span>
                        <span>$1000</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Filter Summary */}
                    <div className="pt-4 text-sm text-muted-foreground">
                      Showing {products.length} of {totalCount} products
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Products Grid */}
            <div className={showFilters ? "md:col-span-3" : "md:col-span-4"}>
              {loading ? (
                 <div className="flex justify-center py-12">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
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
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
