import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for individual boutique page
 */
export default function BoutiqueLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Banner skeleton */}
      <div className="h-48 md:h-64 bg-muted animate-pulse" />
      
      {/* Content skeleton */}
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Boutique info skeleton */}
          <div className="md:w-1/3 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          
          {/* Products skeleton */}
          <div className="md:w-2/3 space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card">
                  <Skeleton className="aspect-square w-full rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
