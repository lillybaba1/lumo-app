import { ProductGridSkeleton, SectionSkeleton } from '@/components/ui/skeleton';

/**
 * Loading state for boutiques page
 * Shows skeleton UI while page data is being fetched
 */
export default function BoutiquesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background py-16 md:py-24">
        <div className="container px-4 md:px-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-40 bg-muted rounded mx-auto" />
            <div className="h-12 w-80 bg-muted rounded mx-auto" />
            <div className="h-4 w-96 bg-muted rounded mx-auto" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container px-4 md:px-6 py-12 space-y-12">
        <SectionSkeleton title />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden animate-pulse">
              <div className="h-32 bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
