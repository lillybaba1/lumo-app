"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, TrendingUp, Sparkles, Tag, Plus, X, Search, Flame, Star, Wand2 } from 'lucide-react';
import { getCollections, saveCollections, getBestSellersAnalytics, getTrendingProducts, saveTrendingProducts, getAutoBestSellers, getAutoTrending, getAutoNewArrivals, getAutoDeals, getAutoFeatured } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

type Collections = {
  bestSellers: string[];
  newArrivals: string[];
  deals: string[];
  featured: string[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  productImages?: string[];
  imageUrls?: string[];
  category: string;
};

type AnalyticsSuggestion = {
  product: Product;
  unitsSold: number;
  revenue: number;
};

export default function CollectionsPage() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collections | null>(null);
  const [trendingProducts, setTrendingProducts] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTrending, setIsSavingTrending] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [autoLoading, setAutoLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [collectionsData, productsData, trendingData] = await Promise.all([
        getCollections(),
        fetch('/api/products').then(r => r.json()),
        getTrendingProducts()
      ]);
      setCollections(collectionsData || { bestSellers: [], newArrivals: [], deals: [], featured: [] });
      setAllProducts(Array.isArray(productsData) ? productsData : []);
      setTrendingProducts(trendingData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setCollections({ bestSellers: [], newArrivals: [], deals: [], featured: [] });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await getBestSellersAnalytics();
      setAnalytics(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleSave = async () => {
    if (!collections) return;
    setIsSaving(true);
    try {
      await saveCollections(collections);
      toast({
        title: "Collections Updated",
        description: "Your homepage collections have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save collections.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTrending = async () => {
    setIsSavingTrending(true);
    try {
      await saveTrendingProducts(trendingProducts);
      toast({
        title: "Trending Updated",
        description: "Trending products have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save trending products.",
        variant: "destructive"
      });
    } finally {
      setIsSavingTrending(false);
    }
  };

  const addToTrending = (productId: string) => {
    if (!trendingProducts.includes(productId)) {
      setTrendingProducts([...trendingProducts, productId]);
    }
  };

  const removeFromTrending = (productId: string) => {
    setTrendingProducts(trendingProducts.filter(id => id !== productId));
  };

  // Auto-add handlers
  const handleAutoAddTrending = async () => {
    setAutoLoading('trending');
    try {
      const autoProducts = await getAutoTrending();
      if (autoProducts.length === 0) {
        toast({
          title: "No Data",
          description: "No trending products found from recent orders. Try adding some manually.",
        });
      } else {
        const merged = [...new Set([...trendingProducts, ...autoProducts])];
        setTrendingProducts(merged);
        toast({
          title: "Auto-Added",
          description: `Added ${autoProducts.length} trending products based on recent sales.`,
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to auto-detect trending products.", variant: "destructive" });
    } finally {
      setAutoLoading(null);
    }
  };

  const handleAutoAddCollection = async (type: keyof Collections) => {
    if (!collections) return;
    setAutoLoading(type);
    try {
      let autoProducts: string[] = [];
      let description = '';
      
      switch (type) {
        case 'bestSellers':
          autoProducts = await getAutoBestSellers();
          description = 'best-selling products based on order history';
          break;
        case 'newArrivals':
          autoProducts = await getAutoNewArrivals();
          description = 'newest products based on creation date';
          break;
        case 'deals':
          autoProducts = await getAutoDeals();
          description = 'products with active discounts';
          break;
        case 'featured':
          autoProducts = await getAutoFeatured();
          description = 'top-rated products';
          break;
      }
      
      if (autoProducts.length === 0) {
        toast({
          title: "No Data",
          description: `No ${type} products found automatically. Try adding some manually.`,
        });
      } else {
        const merged = [...new Set([...collections[type], ...autoProducts])];
        setCollections({ ...collections, [type]: merged });
        toast({
          title: "Auto-Added",
          description: `Added ${autoProducts.length} ${description}.`,
        });
      }
    } catch (error) {
      toast({ title: "Error", description: `Failed to auto-detect ${type}.`, variant: "destructive" });
    } finally {
      setAutoLoading(null);
    }
  };

  const addToCollection = (type: keyof Collections, productId: string) => {
    if (!collections) return;
    if (!collections[type].includes(productId)) {
      setCollections({
        ...collections,
        [type]: [...collections[type], productId]
      });
    }
  };

  const removeFromCollection = (type: keyof Collections, productId: string) => {
    if (!collections) return;
    setCollections({
      ...collections,
      [type]: collections[type].filter(id => id !== productId)
    });
  };

  const getProductById = (id: string) => allProducts.find(p => p.id === id);

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-headline font-bold">Homepage Collections</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Trending Editor Component
  const TrendingEditor = () => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const availableProducts = allProducts.filter(p => !trendingProducts.includes(p.id));
    const filteredProducts = availableProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <CardTitle>Trending Now</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{trendingProducts.length} selected</Badge>
              <Button onClick={handleSaveTrending} disabled={isSavingTrending} size="sm">
                {isSavingTrending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSavingTrending ? 'Saving...' : 'Save Trending'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Manually select products to appear in the Trending section. The top 15 best-selling products from the last 30 days will also be included automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              onClick={handleAutoAddTrending}
              disabled={autoLoading === 'trending'}
              className="flex-1"
            >
              {autoLoading === 'trending' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Auto-Add from Recent Sales
            </Button>
            <Button
              variant="outline"
              onClick={loadAnalytics}
              disabled={loadingAnalytics}
              className="flex-1"
            >
              {loadingAnalytics ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              {loadingAnalytics ? 'Loading...' : 'View Top Selling Products'}
            </Button>

            {analytics.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Top Sellers (Last 90 Days) - These are auto-included</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analytics.slice(0, 15).map(({ product, unitsSold, revenue }) => (
                    <div key={product.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 relative bg-muted rounded">
                          {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                            <Image
                              src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                              alt={product.name}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {unitsSold} sold • ${revenue.toFixed(2)} revenue
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">Auto-included</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-2">Manually Selected Products</p>
            <Popover open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setSearchQuery(''); }}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Products to Trending
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px]">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No products found.
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredProducts.slice(0, 50).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            addToTrending(product.id);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors text-left"
                        >
                          <div className="w-10 h-10 relative bg-muted rounded flex-shrink-0">
                            {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                              <Image
                                src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                                alt={product.name}
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="space-y-2 mt-4">
              {trendingProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No products manually selected. Top selling products will still appear in Trending automatically.
                </p>
              ) : (
                trendingProducts.map(productId => {
                  const product = getProductById(productId);
                  if (!product) return null;
                  return (
                    <div key={productId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 relative bg-muted rounded">
                          {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                            <Image
                              src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                              alt={product.name}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${product.price.toFixed(2)} • {product.category}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromTrending(productId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CollectionEditor = ({
    type,
    title,
    icon: Icon,
    description,
    showAnalytics = false
  }: {
    type: keyof Collections;
    title: string;
    icon: any;
    description: string;
    showAnalytics?: boolean;
  }) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const selectedProducts = collections?.[type] || [];
    const availableProducts = allProducts.filter(p => !selectedProducts.includes(p.id));
    const filteredProducts = availableProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <CardTitle>{title}</CardTitle>
            </div>
            <Badge variant="secondary">{selectedProducts.length} products</Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-Add Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => handleAutoAddCollection(type)}
              disabled={autoLoading === type}
              className="w-full"
            >
              {autoLoading === type ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {autoLoading === type ? 'Analyzing...' : `Auto-Add ${title}`}
            </Button>
          </div>

          {showAnalytics && (
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={loadAnalytics}
                disabled={loadingAnalytics}
                className="w-full"
              >
                {loadingAnalytics ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="mr-2 h-4 w-4" />
                )}
                {loadingAnalytics ? 'Loading...' : 'View Analytics Suggestions'}
              </Button>

              {analytics.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold">Top Sellers (Last 90 Days)</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analytics.map(({ product, unitsSold, revenue }) => (
                      <div key={product.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative bg-muted rounded">
                            {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                              <Image
                                src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                                alt={product.name}
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {unitsSold} sold • ${revenue.toFixed(2)} revenue
                            </p>
                          </div>
                        </div>
                        {!selectedProducts.includes(product.id) ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addToCollection(type, product.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Badge variant="secondary">Added</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Popover open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setSearchQuery(''); }}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Products
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No products found.
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredProducts.slice(0, 50).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          addToCollection(type, product.id);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors text-left"
                      >
                        <div className="w-10 h-10 relative bg-muted rounded flex-shrink-0">
                          {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                            <Image
                              src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                              alt={product.name}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="space-y-2">
            {selectedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No products selected. Add products to display in this collection.
              </p>
            ) : (
              selectedProducts.map(productId => {
                const product = getProductById(productId);
                if (!product) return null;
                return (
                  <div key={productId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 relative bg-muted rounded">
                        {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                          <Image
                            src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${product.price.toFixed(2)} • {product.category}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCollection(type, productId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Homepage Collections</h1>
          <p className="text-muted-foreground mt-1">
            Manage which products appear in Best Sellers, New Arrivals, Featured, and Deals
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="trending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trending">
            <Flame className="mr-2 h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="best-sellers">
            <TrendingUp className="mr-2 h-4 w-4" />
            Best Sellers
          </TabsTrigger>
          <TabsTrigger value="new-arrivals">
            <Sparkles className="mr-2 h-4 w-4" />
            New Arrivals
          </TabsTrigger>
          <TabsTrigger value="featured">
            <Star className="mr-2 h-4 w-4" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="deals">
            <Tag className="mr-2 h-4 w-4" />
            Deals & Offers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <TrendingEditor />
        </TabsContent>

        <TabsContent value="best-sellers" className="space-y-4">
          <CollectionEditor
            type="bestSellers"
            title="Best Sellers"
            icon={TrendingUp}
            description="Feature your top-selling products based on analytics or manual selection"
            showAnalytics={true}
          />
        </TabsContent>

        <TabsContent value="new-arrivals" className="space-y-4">
          <CollectionEditor
            type="newArrivals"
            title="New Arrivals"
            icon={Sparkles}
            description="Showcase your newest products to customers"
          />
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <CollectionEditor
            type="featured"
            title="Featured Products"
            icon={Star}
            description="Hand-picked products to highlight on the homepage and in the Featured widget"
          />
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <CollectionEditor
            type="deals"
            title="Deals & Offers"
            icon={Tag}
            description="Highlight products with special discounts and promotions"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
