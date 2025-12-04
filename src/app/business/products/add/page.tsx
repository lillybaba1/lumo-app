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
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-headline font-bold">Add Product</h1>
          <p className="text-muted-foreground mt-1">Create a new product listing</p>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-headline font-bold">Add Product</h1>
          <p className="text-muted-foreground mt-1">Create a new product listing</p>
        </div>
        <div className="p-6 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Add Product</h1>
        <p className="text-muted-foreground mt-1">Create a new product listing</p>
      </div>
      <ProductForm categories={categories} userType="seller" />
    </div>
  );
}
