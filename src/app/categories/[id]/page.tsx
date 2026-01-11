import { getProducts } from '@/services/productService';
import ProductCard from '@/components/product-card';
import type { Product } from '@/lib/types';

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ page?: string, sort?: string }>
}) {
  // Next.js 15: params and searchParams are now promises
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams.page || '1', 10) || 1;
  const perPage = 12;
  const sort = resolvedSearchParams.sort || 'name-asc';

  const all = await getProducts();
  const catId = resolvedParams.id.toLowerCase();
  const filtered = all.filter(p => {
    const catLower = (p.category || '').toLowerCase();
    const catIdField = (p.categoryId || '').toLowerCase();
    return catIdField === catId || catLower === catId;
  });

  // simple sorting
  filtered.sort((a: Product, b: Product) => {
    switch (sort) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'name-desc': return b.name.localeCompare(a.name);
      default: return a.name.localeCompare(b.name);
    }
  });

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  const title = resolvedParams.id.charAt(0).toUpperCase() + resolvedParams.id.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-4">Home / Categories / <span className="font-semibold">{title}</span></nav>
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">{total} products</div>
        <div>
          <select
            defaultValue={sort}
            onChange={(e) => { /* client navigation handled by next/navigation in client component if needed */ }}
            className="border rounded px-2 py-1"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
        {paged.map((p: Product) => (
          <ProductCard key={p.id} product={p} compact={true} />
        ))}
      </div>

      <div className="flex justify-between items-center mt-8">
        <div>
          {page > 1 && (
            <a href={`?page=${page - 1}&sort=${sort}`} className="px-3 py-1 border rounded">Previous</a>
          )}
        </div>
        <div>
          {start + perPage < total && (
            <a href={`?page=${page + 1}&sort=${sort}`} className="px-3 py-1 border rounded">Next</a>
          )}
        </div>
      </div>
    </div>
  );
}
