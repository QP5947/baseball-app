export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

export function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500"></div>
    </div>
  );
}

export function InlineLoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-3 border-gray-300 border-t-blue-500"></div>
    </div>
  );
}

export function LoadingCard() {
  return <div className="bg-gray-200 rounded-lg p-4 h-32 animate-pulse"></div>;
}

export function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="space-y-2">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
      ))}
    </div>
  );
}
