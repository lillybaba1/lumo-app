"use client";

import { useState, useEffect } from 'react';
import ProductCard from '@/components/product-card';
import CompactProductCard from '@/components/compact-product-card';
import type { Product } from '@/lib/types';
import { Sparkles, Users, ShoppingBag, History, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ─── For You (Personalized) ─────────────────────────────────────────────────

export function ForYouSection({ className }: { className?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recommendations?type=for-you&limit=12')
      .then(r => r.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-headline font-bold">Recommended For You</h2>
        </div>
        <Link href="/products">
          <Button variant="ghost" size="sm" className="gap-1 text-sm px-3">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
      {/* Mobile: compact 2-column */}
      <div className="md:hidden grid grid-cols-2 gap-2">
        {products.slice(0, 6).map((product, i) => (
          <CompactProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
      {/* Desktop: full cards */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {products.slice(0, 6).map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} compact />
        ))}
      </div>
    </div>
  );
}

// ─── Customers Also Viewed ──────────────────────────────────────────────────

export function AlsoViewedSection({ productId, className }: { productId: string; className?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recommendations?type=also-viewed&productId=${productId}&limit=6`)
      .then(r => r.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || products.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        <h2 className="text-base md:text-lg font-semibold">Customers Also Viewed</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} compact />
        ))}
      </div>
    </div>
  );
}

// ─── Frequently Bought Together ──────────────────────────────────────────────

export function BoughtTogetherSection({ productId, currentPrice, className }: {
  productId: string;
  currentPrice: number;
  className?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recommendations?type=bought-together&productId=${productId}&limit=4`)
      .then(r => r.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || products.length === 0) return null;

  const bundleTotal = products.reduce((sum, p) => sum + p.price, currentPrice);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        <h2 className="text-base md:text-lg font-semibold">Frequently Bought Together</h2>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {products.map((product, i) => (
          <div key={product.id} className="flex items-center gap-2">
            {i > 0 && <span className="text-2xl text-muted-foreground font-light">+</span>}
            <Link href={`/products/${product.id}`} className="w-24 md:w-32">
              <ProductCard product={product} index={i} compact />
            </Link>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Bundle total: <span className="font-semibold text-foreground">D{bundleTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </p>
    </div>
  );
}

// ─── Because You Viewed [Product] ───────────────────────────────────────────

export function BecauseYouViewedSection({ productId, className }: {
  productId: string;
  className?: string;
}) {
  const [data, setData] = useState<{ sourceProduct: { id: string; name: string }; products: Product[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recommendations?type=because-viewed&productId=${productId}&limit=6`)
      .then(r => r.json())
      .then(res => setData(res.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || !data || data.products.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <History className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        <h2 className="text-base md:text-lg font-semibold">
          Because you viewed <span className="text-primary">{data.sourceProduct.name}</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
        {data.products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} compact />
        ))}
      </div>
    </div>
  );
}
