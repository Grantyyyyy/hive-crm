import React, { useEffect, useState, useMemo } from "react"
import { useCRMContext } from "@/lib/CRMContext"
import { formatDistanceToNow } from "date-fns"
import { History, Search, Filter, ArrowRight } from "lucide-react"
import { Link } from "wouter"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/ui/Pagination"

export function AuditLogs() {
  const ctx = useCRMContext()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (ctx?.fetchAllAuditLogs) {
      ctx.fetchAllAuditLogs().then(data => {
        setLogs(data)
        setLoading(false)
      })
    }
  }, [ctx])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [logs, searchTerm])

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to first page on search
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">System Audit Logs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor all administrative actions.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filter logs..." 
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64 shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-teal-500 transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Entity</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Details</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                   Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-6">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
                      </td>
                    </tr>
                   ))
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center text-slate-400">
                       <History className="w-16 h-16 mx-auto mb-4 opacity-10" />
                       <p className="text-sm font-bold uppercase tracking-widest opacity-50">No activity logs found matching your criteria</p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900 dark:text-white italic tracking-tight">
                          {formatDistanceToNow(new Date(log.changedAt), { addSuffix: true })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {new Date(log.changedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                         <div className="flex items-center gap-3">
                            <img 
                              src={log.changedBy?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.changedBy?.name || 'U')}&background=0d9488&color=fff`} 
                              className="w-10 h-10 rounded-full ring-4 ring-slate-50 dark:ring-slate-800 shadow-sm object-cover"
                              alt=""
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {log.changedBy?.name || "System"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Actor</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] shadow-sm",
                          log.action === 'INSERT' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" :
                          log.action === 'UPDATE' ? "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" :
                          "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter italic">
                            {log.entityType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-widest">
                            ID: {log.entityId.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-xs text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          {log.action === 'UPDATE' && log.diff?.updates ? (
                             <div className="flex flex-col gap-1.5 mt-1">
                                {Object.entries(log.diff.updates).map(([k, val]: [string, any]) => (
                                  <div key={k} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k}:</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="line-through opacity-40 italic">{String(val?.from ?? '—')}</span>
                                      <ArrowRight className="w-3 h-3 text-slate-300" />
                                      <span className="font-bold text-teal-600 dark:text-teal-400">{String(val?.to ?? val)}</span>
                                    </div>
                                  </div>
                                ))}
                             </div>
                          ) : log.action === 'INSERT' ? (
                             <span className="italic opacity-60 font-bold uppercase tracking-widest text-[10px]">New Resource Initialization</span>
                          ) : <span className="text-rose-500 font-bold uppercase tracking-widest text-[10px]">Permanent Resource Deletion</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {log.entityId && log.action !== 'DELETE' && (
                          <Link href={getEntityLink(log.entityType, log.entityId)}>
                            <button className="p-3 bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all rounded-2xl group-hover:scale-110">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredLogs.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              itemLabel="logs"
            />
          )}
      </div>
    </div>
  )
}

function getEntityLink(type: string, id: string) {
  switch (type) {
    case 'leads': return `/leads/${id}`
    case 'contacts': return `/contacts/${id}`
    case 'deals': return `/deals/${id}`
    case 'tasks': return `/tasks` 
    case 'orders': return `/orders/${id}`
    case 'quotes': return `/quotes/${id}`
    case 'inventory': return `/inventory/${id}`
    case 'purchase_orders': return `/purchase-orders/${id}`
    case 'purchase_requests': return `/purchase-requests/${id}`
    default: return '#'
  }
}
