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
          fetch(`/api/products/${id}`),
          fetch('/api/categories'),
        ]);

        if (!productRes.ok) {
          if (productRes.status === 404) {
            setError('Product not found.');
            setTimeout(() => router.push('/admin/products'), 3000);
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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!product) {
    return <div className="p-6">Product could not be loaded.</div>;
  }

  return <ProductForm product={product} categories={categories} />;
}
