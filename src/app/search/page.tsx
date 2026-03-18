"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/product-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input';
import { AlertCircle, Search, SlidersHorizontal, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Link from 'next/link';
import type { Product, Category } from '@/lib/types';
import { ProductGridSkeleton } from '@/components/skeletons';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  
  // Use a derived state for showing desktop filters, but mobile uses Sheet
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);

  // Update search query when URL changes
  useEffect(() => {
    const q = searchParams?.get('q') || '';
    setSearchQuery(q);
  }, [searchParams]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products').then(r => r.ok ? r.json() : { products: [] }).catch(() => ({ products: [] })),
        fetch('/api/categories').then(r => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
      ]);
      
      setProducts(Array.isArray(productsRes) ? productsRes : (productsRes.products || []));
      setCategories(categoriesRes.categories || (Array.isArray(categoriesRes) ? categoriesRes : []));
      setLoading(false);
    }
    fetchData();
  }, []);

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 1000);
  }, [products]);

  // Update price range when products change
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query (name, description, or store name)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        (product.sellerName && product.sellerName.toLowerCase().includes(q))
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

  const FilterUI = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">Filters</h3>
        <p className="text-sm text-muted-foreground">Refine your search</p>
      </div>

      <Separator />

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold block">Category</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full border-0 bg-white/80">
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
        <Label className="text-sm font-semibold block">Price Range</Label>
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

      {/* Availability Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold block">Availability</Label>
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
        <p className="text-xs text-muted-foreground">products found</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-5 w-48 bg-muted animate-pulse rounded"></div>
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-3 md:py-6">
        {/* Header */}
        <div className="mb-4 px-2">
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          <h1 className="text-xl md:text-2xl font-bold">
            {searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Search and Sort Bar */}
        <div className="mb-4 mx-2 flex flex-col gap-2 rounded-xl border bg-white/60 backdrop-blur-sm p-2 md:p-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search products..."
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

            {/* Mobile Sheet Trigger for Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden shrink-0">
                   <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <FilterUI />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className={`md:col-span-1 hidden md:block`}>
            <div className="sticky top-24 space-y-6 rounded-2xl border bg-white/60 backdrop-blur-sm p-4 md:p-5 shadow-sm">
               <FilterUI />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} compact={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `We couldn't find any products matching "${searchQuery}"`
                    : 'Try adjusting your filters'}
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceRange([0, maxPrice]);
                  setShowInStockOnly(false);
                }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-bg-page)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-5 w-48 bg-muted animate-pulse rounded"></div>
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
