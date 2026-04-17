

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-44 w-full rounded-xl bg-gray-200 overflow-hidden mb-4">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-gray-200 rounded-lg" />
          <div className="h-4 w-12 bg-gray-100 rounded-md" />
        </div>
        
        <div className="h-6 w-3/4 bg-gray-200 rounded-lg" />
        
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-5/6 bg-gray-100 rounded" />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-gray-50 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gray-200" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
          <div className="h-2 w-12 bg-gray-50 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-7 w-7 rounded-lg bg-gray-50" />
          </div>
          <div className="h-8 w-12 bg-gray-200 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
