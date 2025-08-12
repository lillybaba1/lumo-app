
import ProductForm from '@/components/product-form';
import { getProductById, getCategories } from '@/services/productService';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const product = await getProductById(id);
    const categories = await getCategories();

    if (!product) {
        notFound();
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
