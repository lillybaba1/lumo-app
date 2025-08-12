
import ProductForm from '@/components/product-form';
import { getCategories } from '@/services/productService';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function AddProductPage() {
    const categories = await getCategories();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-headline font-bold">Add New Product</h1>
                <p className="text-muted-foreground">Fill in the details below to add a new product to your store.</p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                    <CardDescription>Provide details and an image for your new product.</CardDescription>
                </CardHeader>
                <ProductForm categories={categories} />
            </Card>
        </div>
    );
}
