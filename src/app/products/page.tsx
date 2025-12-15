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
import { getProducts, getCategories } from '@/services/productService';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { Product, Category } from '@/lib/types';

export default function ProductsPageContainer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-muted-foreground">Loading products...</p>
      </div>
    </div>;
  }

  return <ProductsPage products={products} categories={categories} />;
}

function ProductsPage({ products, categories }: { products: Product[], categories: Category[] }) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Get filter parameter from URL
  const filterParam = searchParams?.get('filter');

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 1000);
  }, [products]);

  // Update price range when products change
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  // Read category from URL params
  useEffect(() => {
    const cat = searchParams?.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // Get page title based on filter
  const pageTitle = useMemo(() => {
    switch (filterParam) {
      case 'new':
        return 'New Arrivals';
      case 'bestsellers':
        return 'Best Sellers';
      case 'deals':
        return 'Deals & Offers';
      default:
        return 'All Products';
    }
  }, [filterParam]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Apply special filters based on URL parameter
    if (filterParam === 'new') {
      // New Arrivals: Show products sorted by ID (proxy for recent)
      // Get the top 20% newest products
      const sortedByIdDesc = [...products].sort((a, b) => b.id.localeCompare(a.id));
      const newCount = Math.max(Math.floor(products.length * 0.2), 5);
      const newProductIds = new Set(sortedByIdDesc.slice(0, newCount).map(p => p.id));
      filtered = filtered.filter(p => newProductIds.has(p.id));
    } else if (filterParam === 'bestsellers') {
      // Best Sellers: Products with stock below initial level (sold more)
      // As a proxy, show products with stock < 50 (assuming they started with more)
      filtered = filtered.filter(p => p.stock < 50 && p.stock > 0);
      // Sort by stock ascending (lowest stock = most sold)
      filtered.sort((a, b) => a.stock - b.stock);
    } else if (filterParam === 'deals') {
      // Deals & Offers: Products with price below $50 or high stock (clearance)
      filtered = filtered.filter(p => p.price < 50 || p.stock > 100);
    }

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

    // Sort products (unless it's a special filter with custom sorting)
    if (filterParam !== 'bestsellers') {
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
    }

    return filtered;
  }, [products, categories, searchQuery, selectedCategory, priceRange, showInStockOnly, sortBy, filterParam]);

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
                  <SelectItem value="stock">Most in Stock</SelectItem>
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
                        max={maxPrice}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span>
                        <span>${maxPrice}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* In Stock Filter */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="in-stock" className="text-sm font-semibold cursor-pointer">
                        In Stock Only
                      </Label>
                      <Switch
                        id="in-stock"
                        checked={showInStockOnly}
                        onCheckedChange={setShowInStockOnly}
                      />
                    </div>

                    {/* Filter Summary */}
                    <div className="pt-4 text-sm text-muted-foreground">
                      Showing {filteredAndSortedProducts.length} of {products.length} products
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Products Grid */}
            <div className={showFilters ? "md:col-span-3" : "md:col-span-4"}>
              {filteredAndSortedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </main>
    </div>
  );
}
