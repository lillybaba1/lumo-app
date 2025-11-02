'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/product-form';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Product, Category } from '@/lib/types';

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Fetch product and categories in parallel
                const [productResponse, categoriesResponse] = await Promise.all([
                    fetch(`/api/products/${id}`),
                    fetch('/api/categories'),
                ]);

                if (!productResponse.ok) {
                    if (productResponse.status === 404) {
                        router.push('/admin/products');
                        return;
                    }
                    throw new Error('Failed to fetch product');
                }

                if (!categoriesResponse.ok) {
                    throw new Error('Failed to fetch categories');
                }

                const productData = await productResponse.json();
                const categoriesData = await categoriesResponse.json();

                setProduct(productData.product);
                setCategories(categoriesData.categories || []);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load product');
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchData();
        }
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading product...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription>{error || 'Product not found'}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-headline font-bold">Edit Product</h1>
                <p className="text-muted-foreground">Update the details for "{product.name}".</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                    <CardDescription>Update the details and image for your product.</CardDescription>
                </CardHeader>
                <ProductForm product={product} categories={categories} />
            </Card>
        </div>
    );
}
