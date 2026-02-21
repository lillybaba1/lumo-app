export default function OrdersLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="h-8 w-40 bg-muted animate-pulse rounded mb-8" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-36 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
