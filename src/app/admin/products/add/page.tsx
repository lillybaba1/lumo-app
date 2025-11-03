'use client';

import { useState, useEffect } from 'react';
import ProductForm from '@/components/product-form';
import { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data.categories);
      } catch (err) {
        setError('Could not load categories. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return <ProductForm categories={categories} />;
}
