"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ProductCardSkeletonProps {
  count?: number;
}

export function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden h-full rounded-2xl border bg-white/80">
      <CardHeader className="p-0 relative">
        {/* Image skeleton with 4:5 aspect ratio */}
        <Skeleton className="w-full" style={{ aspectRatio: '4/5' }} />
      </CardHeader>
      <CardContent className="flex-grow p-2 md:p-4 flex flex-col">
        {/* Title skeleton */}
        <Skeleton className="h-4 md:h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 md:h-5 w-1/2 mb-2" />
        {/* Description skeleton (hidden on mobile) */}
        <div className="hidden md:block space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
      <CardFooter className="p-2 md:p-4 flex flex-col gap-1.5 md:gap-2 mt-auto">
        {/* Price skeleton */}
        <div className="flex justify-between items-center w-full">
          <Skeleton className="h-5 md:h-6 w-20" />
        </div>
        {/* Button skeleton */}
        <Skeleton className="h-7 md:h-9 w-full rounded-xl" />
      </CardFooter>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 4 }: ProductCardSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center p-3 md:p-4 rounded-xl border bg-white/90">
      <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-full mb-2 md:mb-3" />
      <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
    </div>
  );
}

export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <CategorySkeleton key={index} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '400px' }}>
      <Skeleton className="absolute inset-0" />
      <div className="relative h-full flex items-center py-12 md:py-32 px-6 md:px-12">
        <div className="space-y-4 w-full max-w-lg">
          <Skeleton className="h-10 md:h-16 w-3/4" />
          <Skeleton className="h-5 md:h-6 w-full" />
          <Skeleton className="h-5 md:h-6 w-2/3" />
          <div className="flex gap-3 mt-6">
            <Skeleton className="h-11 w-40 rounded-lg" />
            <Skeleton className="h-11 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchBarSkeleton() {
  return (
    <Skeleton className="h-14 w-full max-w-2xl rounded-full" />
  );
}
