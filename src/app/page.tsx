
"use client";

import { useState, useMemo } from 'react';
import ProductCard from '@/components/product-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTheme } from '@/app/admin/appearance/actions';
import { getProducts, getCategories } from '@/services/productService';
import { seedInitialData } from '@/lib/seed';
import Hero3D from '@/components/hero-3d';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
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

// We need a new component to avoid making the whole page a client component
// which would be bad for performance. This component will fetch initial data.
export default function HomePageDataContainer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [theme, setTheme] = useState<any>(defaultTheme);
  const [loading, setLoading] = useState(true);

  useState(() => {
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
  });

  if (loading) {
    // Optional: add a loading skeleton here
    return <div>Loading...</div>
  }

  return <Home products={products} categories={categories} theme={theme} />;
}


function Home({ products, categories, theme }: { products: Product[], categories: Category[], theme: any }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Hero3D theme={theme} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-center mb-8">
                <div className="relative w-full max-w-lg">
                    <Input 
                        placeholder="Search for products..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
            </div>
            <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex flex-wrap h-auto justify-center max-w-4xl mx-auto mb-8">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>{category.name}</TabsTrigger>
                ))}
            </TabsList>
            
            <TabsContent value="all">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
                </div>
            </TabsContent>

            {categories.map((category) => (
                <TabsContent key={category.id} value={category.id}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredProducts.filter(p => p.category === category.name).map((product) => (
                    <ProductCard key={product.id} product={product} />
                    ))}
                </div>
                </TabsContent>
            ))}
            </Tabs>
        </div>
      </main>
    </div>
  );
}
