
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTheme } from '@/app/admin/appearance/actions';
import { getProducts, getCategories } from '@/services/productService';
import { seedInitialData } from '@/lib/seed';
import Hero3D from '@/components/hero-3d';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { Product, Category } from '@/lib/types';

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "https://placehold.co/1200x800.png",
  foregroundImage: "https://placehold.co/400x400.png",
  foregroundImageScale: 100,
  foregroundImagePositionX: 50,
  foregroundImagePositionY: 50,
};

export default function HomePageDataContainer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [theme, setTheme] = useState<any>(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      await seedInitialData();
      const [productsData, categoriesData, themeData] = await Promise.all([
        getProducts(),
        getCategories(),
        getTheme(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setTheme(themeData ?? defaultTheme);
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

  return <Home products={products} categories={categories} theme={theme} />;
}

function Home({ products, categories, theme }: { products: Product[], categories: Category[], theme: any }) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Hero3D theme={theme} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                      <Label className="text-sm font-semibold mb-3 block">Category</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            value="all"
                            checked={selectedCategory === 'all'}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="rounded-full"
                          />
                          <span className="text-sm">All Products</span>
                        </label>
                        {categories.map((category) => (
                          <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              value={category.id}
                              checked={selectedCategory === category.id}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="rounded-full"
                            />
                            <span className="text-sm">{category.name}</span>
                          </label>
                        ))}
                      </div>
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
