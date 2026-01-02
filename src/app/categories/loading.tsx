import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for categories page
 */
export default function CategoriesLoading() {
  return (
    <div className="container px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-3" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
