export default function LoginLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded mx-auto" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
