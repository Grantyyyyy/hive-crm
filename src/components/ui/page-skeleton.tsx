export function PageSkeleton() {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen p-4 md:p-8 animate-pulse">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3"></div>
        
        {/* Search Bar Skeleton */}
        <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
        
        {/* Table/List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
