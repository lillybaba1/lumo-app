export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="h-8 w-40 bg-muted animate-pulse rounded mx-auto mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
          <div className="border rounded-lg p-6 space-y-4">
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
            <div className="h-14 bg-muted animate-pulse rounded" />
            <div className="h-14 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="border rounded-lg p-6 space-y-4 h-fit">
          <div className="h-6 w-36 bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-16 h-16 bg-muted animate-pulse rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-10 bg-muted animate-pulse rounded mt-4" />
        </div>
      </div>
    </div>
  );
}
