"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Brain, TrendingUp, Sparkles, Tag, Star, Eye, ShoppingCart, Clock, RefreshCw, ArrowUpDown, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { formatAmount } from '@/lib/currency';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ScoredProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  viewCount: number;
  salesCount: number;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  createdAt: string;
  stock: number;
  score: number;
  placement: string[];
};

type PlacementData = {
  products: ScoredProduct[];
  sections: {
    trending: string[];
    bestSellers: string[];
    newArrivals: string[];
    deals: string[];
  };
  stats: {
    totalProducts: number;
    totalViews: number;
    totalSales: number;
    avgRating: number;
  };
};

export default function SmartPlacementPage() {
  const { toast } = useToast();
  const [data, setData] = useState<PlacementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'views' | 'sales' | 'rating' | 'newest'>('score');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/smart-placement');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load placement data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = data?.products
    ? [...data.products].sort((a, b) => {
        switch (sortBy) {
          case 'views': return b.viewCount - a.viewCount;
          case 'sales': return b.salesCount - a.salesCount;
          case 'rating': return b.averageRating - a.averageRating;
          case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default: return b.score - a.score;
        }
      })
    : [];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Smart Product Placement
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered scoring engine decides where products appear. Admin picks in Collections always override.
            </p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <ShoppingCart className="h-4 w-4" />
                  Active Products
                </div>
                <p className="text-2xl font-bold mt-1">{data.stats.totalProducts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Eye className="h-4 w-4" />
                  Total Views
                </div>
                <p className="text-2xl font-bold mt-1">{data.stats.totalViews.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Total Sales
                </div>
                <p className="text-2xl font-bold mt-1">{data.stats.totalSales.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Star className="h-4 w-4" />
                  Avg Rating
                </div>
                <p className="text-2xl font-bold mt-1">{data.stats.avgRating.toFixed(1)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scoring Formula Explainer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              How the Smart Scoring Engine Works
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              <div className="flex flex-col items-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-blue-600 mb-1" />
                <span className="font-semibold">Sales</span>
                <span className="text-xs text-muted-foreground">×10 per sale</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <Eye className="h-4 w-4 text-purple-600 mb-1" />
                <span className="font-semibold">Views</span>
                <span className="text-xs text-muted-foreground">×0.5 per view</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <Star className="h-4 w-4 text-yellow-600 mb-1" />
                <span className="font-semibold">Rating</span>
                <span className="text-xs text-muted-foreground">rating × reviews × 3</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <Clock className="h-4 w-4 text-green-600 mb-1" />
                <span className="font-semibold">Recency</span>
                <span className="text-xs text-muted-foreground">+30 if &lt;7 days</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <Sparkles className="h-4 w-4 text-red-600 mb-1" />
                <span className="font-semibold">Featured</span>
                <span className="text-xs text-muted-foreground">+15 boost</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Tag className="h-4 w-4 text-gray-600 mb-1" />
                <span className="font-semibold">Stock</span>
                <span className="text-xs text-muted-foreground">−50 if out</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Assignments */}
        {data?.sections && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  Trending Now
                </CardTitle>
                <CardDescription className="text-xs">{data.sections.trending.length} products</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {data.sections.trending.slice(0, 6).map(id => {
                    const p = data.products.find(p => p.id === id);
                    return p ? (
                      <Tooltip key={id}>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs truncate max-w-[120px]">{p.name}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>Score: {p.score.toFixed(0)}</TooltipContent>
                      </Tooltip>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Best Sellers
                </CardTitle>
                <CardDescription className="text-xs">{data.sections.bestSellers.length} products</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {data.sections.bestSellers.slice(0, 6).map(id => {
                    const p = data.products.find(p => p.id === id);
                    return p ? (
                      <Tooltip key={id}>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs truncate max-w-[120px]">{p.name}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>Sales: {p.salesCount}</TooltipContent>
                      </Tooltip>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  New Arrivals
                </CardTitle>
                <CardDescription className="text-xs">{data.sections.newArrivals.length} products</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {data.sections.newArrivals.slice(0, 6).map(id => {
                    const p = data.products.find(p => p.id === id);
                    return p ? (
                      <Tooltip key={id}>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs truncate max-w-[120px]">{p.name}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>{new Date(p.createdAt).toLocaleDateString()}</TooltipContent>
                      </Tooltip>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-600" />
                  Deals & Offers
                </CardTitle>
                <CardDescription className="text-xs">{data.sections.deals.length} products</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {data.sections.deals.slice(0, 6).map(id => {
                    const p = data.products.find(p => p.id === id);
                    return p ? (
                      <Tooltip key={id}>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs truncate max-w-[120px]">{p.name}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>Score: {p.score.toFixed(0)}</TooltipContent>
                      </Tooltip>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sort by:</span>
          {(['score', 'views', 'sales', 'rating', 'newest'] as const).map(key => (
            <Button
              key={key}
              variant={sortBy === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(key)}
              className="text-xs"
            >
              {key === 'score' ? '🧠 Score' : key === 'views' ? '👁 Views' : key === 'sales' ? '🛒 Sales' : key === 'rating' ? '⭐ Rating' : '🕐 Newest'}
            </Button>
          ))}
        </div>

        {/* Product Scores Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Score Rankings</CardTitle>
            <CardDescription>
              Products ranked by the smart scoring engine. Higher scores get placed in premium sections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-mono text-muted-foreground w-6 text-center">
                    #{index + 1}
                  </span>

                  {/* Product Image */}
                  <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">N/A</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatAmount(product.price)}</p>
                  </div>

                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {product.viewCount}
                      </TooltipTrigger>
                      <TooltipContent>Views</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" /> {product.salesCount}
                      </TooltipTrigger>
                      <TooltipContent>Sales</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> {product.averageRating.toFixed(1)} ({product.reviewCount})
                      </TooltipTrigger>
                      <TooltipContent>Rating (Reviews)</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Placement Badges */}
                  <div className="flex flex-wrap gap-1">
                    {product.placement.map(section => (
                      <Badge
                        key={section}
                        variant="secondary"
                        className={`text-[10px] ${
                          section === 'trending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                          section === 'bestSellers' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          section === 'newArrivals' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          section === 'deals' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                          ''
                        }`}
                      >
                        {section === 'trending' ? '🔥 Trending' :
                         section === 'bestSellers' ? '📈 Best Seller' :
                         section === 'newArrivals' ? '✨ New' :
                         section === 'deals' ? '🏷️ Deal' :
                         section}
                      </Badge>
                    ))}
                  </div>

                  {/* Score */}
                  <div className="text-right min-w-[60px]">
                    <span className={`text-sm font-bold ${
                      product.score >= 50 ? 'text-green-600' :
                      product.score >= 20 ? 'text-yellow-600' :
                      'text-muted-foreground'
                    }`}>
                      {product.score.toFixed(0)}
                    </span>
                    <p className="text-[10px] text-muted-foreground">score</p>
                  </div>
                </div>
              ))}

              {sortedProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No active products found. Add some products to see the smart placement engine in action.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
