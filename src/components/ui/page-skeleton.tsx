export function PageSkeleton() {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen p-4 md:p-8 animate-pulse">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-10 w-32 bg-teal-600 rounded-xl"></div>
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>

        {/* Table/List Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="h-12 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-b border-slate-200 dark:border-slate-800 last:border-0">
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mx-6 mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
