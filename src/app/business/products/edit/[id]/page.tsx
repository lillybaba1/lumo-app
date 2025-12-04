'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/product-form';
import { Category, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditProductPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${id}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
          fetch('/api/categories', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        ]);

        if (!productRes.ok) {
          if (productRes.status === 404) {
            setError('Product not found.');
            setTimeout(() => router.push('/business/products'), 3000);
          } else {
            throw new Error('Failed to fetch product');
          }
          return;
        }

        if (!categoriesRes.ok) {
          throw new Error('Failed to fetch categories');
        }

        const productData = await productRes.json();
        const categoriesData = await categoriesRes.json();

        setProduct(productData.product);
        setCategories(categoriesData.categories);
      } catch (err) {
        setError('Could not load data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-headline font-bold">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update your product details</p>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-headline font-bold">Edit Product</h1>
        </div>
        <div className="p-6 text-red-500">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-headline font-bold">Edit Product</h1>
        </div>
        <div className="p-6">Product could not be loaded.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Edit Product</h1>
        <p className="text-muted-foreground mt-1">Update your product details</p>
      </div>
      <ProductForm product={product} categories={categories} userType="seller" />
    </div>
  );
}
