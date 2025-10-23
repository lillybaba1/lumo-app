import { getProducts } from '@/services/productService';
import ProductCard from '@/components/product-card';
import type { Product } from '@/lib/types';

export default async function CategoryPage({ params }: { params: { id: string } }) {
  const all = await getProducts();
  const products = all.filter(p => p.category === params.id || p.category.toLowerCase() === params.id.toLowerCase());

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Category</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p: Product) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
