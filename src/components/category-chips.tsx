"use client";

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Category } from '@/lib/types';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
  maxVisible?: number;
}

export default function CategoryChips({ 
  categories, 
  selectedCategory,
  onCategorySelect,
  maxVisible = 8 
}: CategoryChipsProps) {
  const visibleCategories = categories.slice(0, maxVisible);
  const hasMore = categories.length > maxVisible;

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1" 
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* All Categories chip */}
        <button
          onClick={() => onCategorySelect?.('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
            selectedCategory === 'all' || !selectedCategory
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>

        {visibleCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect?.(category.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === category.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.icon && <span className="text-sm">{category.icon}</span>}
            {category.name}
          </button>
        ))}

        {/* View All link */}
        {hasMore && (
          <Link
            href="/categories"
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-primary hover:bg-gray-200 transition-all whitespace-nowrap flex items-center gap-0.5"
          >
            More
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
