"use client";

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product-card';
import type { Product, Category } from '@/lib/types';

interface CategoryProductSectionProps {
  category: Category;
  products: Product[];
  maxProducts?: number;
}

export default function CategoryProductSection({ 
  category, 
  products, 
  maxProducts = 6 
}: CategoryProductSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter products that belong to this category
  const categoryProducts = products
    .filter(p => p.category === category.name)
    .slice(0, maxProducts);

  // Don't render if no products in this category
  if (categoryProducts.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-6 md:mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          {category.icon && (
            <span className="text-lg md:text-xl">{category.icon}</span>
          )}
          <h2 className="text-lg md:text-xl font-headline font-bold">
            Best in {category.name}
          </h2>
          <span className="text-xs md:text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {categoryProducts.length} items
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Scroll buttons - hidden on mobile, shown on md+ */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex h-8 w-8"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex h-8 w-8"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Link href={`/?category=${category.id}`}>
            <Button variant="ghost" className="gap-1 text-xs md:text-sm px-2 md:px-3 h-8">
              See All <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categoryProducts.map((product) => (
          <div 
            key={product.id} 
            className="flex-shrink-0 w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18%] snap-start"
          >
            <ProductCard product={product} compact />
          </div>
        ))}
        
        {/* "View More" Card - matches square product card aspect */}
        <Link 
          href={`/?category=${category.id}`}
          className="flex-shrink-0 w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18%] snap-start"
        >
          <div className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ChevronRight className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">View All</span>
            <span className="text-xs text-muted-foreground">{category.name}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Grid version for 4-column display like Amazon
export function CategoryProductGrid({ 
  category, 
  products, 
  maxProducts = 4 
}: CategoryProductSectionProps) {
  const categoryProducts = products
    .filter(p => p.category === category.name)
    .slice(0, maxProducts);

  if (categoryProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm md:text-base">
          {category.icon && <span className="mr-1">{category.icon}</span>}
          {category.name}
        </h3>
        <Link href={`/?category=${category.id}`} className="text-xs text-primary hover:underline">
          See more
        </Link>
      </div>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {categoryProducts.slice(0, 4).map((product) => {
          const imageUrl = (product.productImages && product.productImages.length > 0)
            ? product.productImages[0]
            : (product.imageUrls && product.imageUrls.length > 0)
              ? product.imageUrls[0]
              : '';
          
          return (
            <Link 
              key={product.id} 
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    📦
                  </div>
                )}
              </div>
              <p className="text-xs mt-1 line-clamp-1 group-hover:text-primary">
                {product.name}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
