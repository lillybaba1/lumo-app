"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  bgColor?: string;
  textColor?: string;
  iconBgColor?: string;
}

// Default category emoji mapping (fallback)
const getCategoryEmoji = (name: string) => {
  const emojiMap: Record<string, string> = {
    'Fashion': '👗',
    'Beauty': '💄',
    'Home': '🏠',
    'Electronics': '📱',
    'Food': '🍽️',
    'Health': '💊',
    'Sports': '⚽',
    'Kids': '🧸',
    'Books': '📚',
    'Art': '🎨',
    'Jewelry': '💎',
    'Toys': '🎮',
    'Garden': '🌱',
    'Automotive': '🚗',
    'Music': '🎵',
    'Pets': '🐕',
    'Office': '💼',
    'Travel': '✈️',
  };
  return emojiMap[name] || '🛍️';
};

// Default colors - Modern Premium v2.0 palette
const DEFAULT_BG = '#ffffff';
const DEFAULT_TEXT = '#1e293b';
const DEFAULT_ICON_BG = 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(20, 184, 166, 0.05) 100%)';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-headline font-bold">Shop by Category</h1>
        <p className="text-muted-foreground mt-2">Browse our wide selection of product categories</p>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-2xl bg-muted"></div>
              <div className="h-4 bg-muted rounded mt-3 w-3/4 mx-auto"></div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No categories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/?category=${category.id}`}
              className="group flex flex-col items-center p-6 rounded-2xl border hover:shadow-lg transition-all"
              style={{ 
                backgroundColor: category.bgColor || DEFAULT_BG,
                color: category.textColor || DEFAULT_TEXT,
              }}
            >
              <div 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden"
                style={{ 
                  background: category.iconBgColor 
                    ? category.iconBgColor 
                    : DEFAULT_ICON_BG 
                }}
              >
                {category.image ? (
                  <Image 
                    src={category.image} 
                    alt={category.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl md:text-5xl">
                    {category.icon || getCategoryEmoji(category.name)}
                  </span>
                )}
              </div>
              <span 
                className="text-sm md:text-base font-medium text-center"
                style={{ color: category.textColor || DEFAULT_TEXT }}
              >
                {category.name}
              </span>
              {category.description && (
                <span 
                  className="text-xs text-center mt-1 line-clamp-2 opacity-70"
                  style={{ color: category.textColor || DEFAULT_TEXT }}
                >
                  {category.description}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Browse <ChevronRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
