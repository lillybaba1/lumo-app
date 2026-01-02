import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/**
 * Product card skeleton for loading states
 */
function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Skeleton className="aspect-square w-full rounded-t-lg" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Product grid skeleton
 */
function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Boutique card skeleton
 */
function BoutiqueCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Section skeleton with title
 */
function SectionSkeleton({
  title = true,
  children,
}: {
  title?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
      {children || <ProductGridSkeleton count={4} />}
    </div>
  );
}

export { 
  Skeleton, 
  ProductCardSkeleton, 
  ProductGridSkeleton, 
  BoutiqueCardSkeleton,
  SectionSkeleton
}
