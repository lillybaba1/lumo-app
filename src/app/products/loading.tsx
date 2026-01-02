import { ProductGridSkeleton } from '@/components/ui/skeleton';

/**
 * Loading state for products page
 * Shows skeleton UI while products are being fetched
 */
export default function ProductsLoading() {
  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters skeleton */}
        <aside className="w-full lg:w-64 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
        </aside>

        {/* Products grid skeleton */}
        <main className="flex-1 space-y-6">
          <div className="flex justify-between items-center animate-pulse">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="h-10 w-32 bg-muted rounded" />
          </div>
          <ProductGridSkeleton count={12} />
        </main>
      </div>
    </div>
  );
}
