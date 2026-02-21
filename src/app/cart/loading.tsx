import { Loader2 } from 'lucide-react';

export default function CartLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <div className="w-20 h-20 bg-muted animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded-lg p-6 space-y-4 h-fit">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-10 w-full bg-muted animate-pulse rounded mt-4" />
        </div>
      </div>
    </div>
  );
}
