export function ListSkeleton() {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen p-4 md:p-8 animate-pulse">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded hidden md:block"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl hidden md:block"></div>
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full max-w-xl"></div>

        {/* Table/List Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="h-12 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800"></div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 border-b border-slate-200 dark:border-slate-800 last:border-0 flex items-center px-6 gap-6">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
              <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded hidden md:block"></div>
              <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded hidden lg:block"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen p-4 md:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Breadcrumb / Back button */}
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>

        {/* Profile/Detail Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
           <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
           <div className="space-y-3 flex-1">
             <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
             <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
             <div className="h-10 w-full md:w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
             <div className="h-10 w-full md:w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
           </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
           <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px]">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-8"></div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
              </div>
           </div>
           <div className="space-y-6 md:space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-8"></div>
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                      <div className="space-y-2 flex-1 pt-1">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen p-4 md:p-8 animate-pulse">
      <div className="max-w-full mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>

        {/* 4 KPI Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 h-36 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                 <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                 <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded mt-4"></div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
           <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                 <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-8"></div>
                 <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-950/50 rounded-2xl"></div>
              </div>
           </div>
           <div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                 <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-8"></div>
                 <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-950/50 rounded-xl"></div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton — Matches SettingsHeader */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-5 w-32 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full"></div>
        </div>
        <div className="h-6 w-1/3 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg"></div>
      </div>

      {/* Content Area Skeleton */}
      <div className="space-y-6">
        {/* Search Bar / Action Bar Mock */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="h-10 w-full md:w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>

        {/* Data Card/Table Mock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="h-12 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-b border-slate-200 dark:border-slate-800 last:border-0 flex items-center px-6 gap-6">
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded hidden md:block"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
