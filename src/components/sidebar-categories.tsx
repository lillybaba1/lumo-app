"use client";

import React, { useState } from 'react';
import CategoryLink from './category-link';
import { ChevronDown, ChevronRight } from 'lucide-react';

type Category = { id: string; name: string; description?: string };

export default function SidebarCategories({ categories, counts }: { categories: Category[]; counts?: Record<string, number> }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(s => !s)}
        className="w-full flex items-center justify-between px-2 py-1 text-sm font-semibold"
        aria-expanded={open}
      >
        <span>Categories</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          <CategoryLink href="/" >
            <span>All Products</span>
            <span className="ml-auto text-xs text-muted-foreground">{categories.length}</span>
          </CategoryLink>
          {categories.map((c) => (
            <CategoryLink key={c.id} href={`/categories/${c.id}`}>
              <span>{c.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{counts?.[c.id] ?? '-'}</span>
            </CategoryLink>
          ))}
        </div>
      )}
    </div>
  );
}
