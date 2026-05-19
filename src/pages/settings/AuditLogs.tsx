import React, { useState, useMemo, useEffect } from "react"
import { useCRMContext } from "@/lib/CRMContext"
import { format } from "date-fns"
import { History, Search, ArrowRight, Clock, Activity, CheckCircle2, Plus, Trash2, LogIn, LogOut } from "lucide-react"
import { Link } from "wouter"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/ui/Pagination"
import { SettingsHeader } from "@/components/reusables/SettingsHeader"

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
      log.entityType !== 'notifications' && (
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [logs, searchTerm])

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <SettingsHeader 
        category="System Configuration"
        title="System Activity Stream"
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            {/* Minimized Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-accent/20 focus:border-accent placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

          </div>
        }
      />

      <div className="relative">
        {/* Timeline Thread */}
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800/40 rounded-full" />

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative pl-14 animate-pulse">
                <div className="absolute left-[23px] top-0 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-950" />
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 h-24 border border-slate-100 dark:border-slate-800/50" />
              </div>
            ))
          ) : paginatedLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p className="text-xs font-black uppercase tracking-widest opacity-40">No activity logs found</p>
            </div>
          ) : (
            paginatedLogs.map((log, idx) => (
              <div
                key={log.id}
                className="relative pl-14 group animate-in fade-in slide-in-from-left-4 duration-300"
              >
                {/* Timeline Marker Icon */}
                <div className={cn(
                  "absolute left-[23px] top-0 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 border-white dark:border-zinc-950 transition-transform duration-300",
                  log.action === 'INSERT' || log.action === 'LOGIN' ? "bg-emerald-500 text-white" :
                    log.action === 'UPDATE' ? "bg-blue-500 text-white" :
                      "bg-rose-500 text-white"
                )}>
                  <ActionIcon action={log.action} />
                </div>

                {/* Content Card */}
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm transition-colors duration-300 relative overflow-hidden group-hover:border-slate-300 dark:group-hover:border-slate-700">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={log.changedBy?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.changedBy?.name || 'U')}&background=0f172a&color=fff`}
                            className="w-9 h-9 rounded-full ring-2 ring-slate-50 dark:ring-slate-800 object-cover"
                            alt=""
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                            {log.changedBy?.name || "System"}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-accent font-bold uppercase tracking-widest">{log.entityType.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <Clock className="w-3 h-3 opacity-50" />
                          {format(new Date(log.changedAt), 'MMM d, h:mm a')}
                        </div>

                        {log.entityId && log.action !== 'DELETE' && log.entityType !== 'auth' && (
                          <Link href={getEntityLink(log.entityType, log.entityId)}>
                            <button className="p-1.5 text-slate-400 hover:text-accent transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50/30 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
                      <DescriptionFormatter log={log} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!loading && filteredLogs.length > itemsPerPage && (
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            itemLabel="activity logs"
          />
        </div>
      )}
    </div>
  )
}

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case 'INSERT': return <Plus className="w-3 h-3" />
    case 'UPDATE': return <CheckCircle2 className="w-3 h-3" />
    case 'DELETE': return <Trash2 className="w-3 h-3" />
    case 'LOGIN': return <LogIn className="w-3 h-3" />
    case 'LOGOUT': return <LogOut className="w-3 h-3" />
    default: return <Activity className="w-3 h-3" />
  }
}

function DescriptionFormatter({ log }: { log: any }) {
  const { action, diff, entityType } = log
  const entityName = entityType.replace(/s$/, '').replace(/_/g, ' ')

  if (entityType === 'auth') {
    const event = diff?.event || action
    const isLogin = event === 'LOGIN' || event === 'SIGNED_IN'
    return (
      <div className="flex items-center gap-3">
        <span className="text-slate-500 font-medium">
          {isLogin ? "User authenticated successfully" : "User session terminated"}
        </span>
        <Badge
          text={isLogin ? "LOGIN" : "LOGOUT"}
          variant={isLogin ? "accent" : "muted"}
        />
      </div>
    )
  }

  if (action === 'INSERT') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-slate-500 font-medium">Initialized new system resource:</span>
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] border border-emerald-100 dark:border-emerald-800 shadow-sm">
          {entityName}
        </span>
      </div>
    )
  }

  if (action === 'DELETE') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-slate-500 font-medium">Permanently purged record:</span>
        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] border border-rose-100 dark:border-rose-800 shadow-sm">
          {entityName}
        </span>
      </div>
    )
  }

  if (action === 'UPDATE' && diff?.updates) {
    const changes = Object.entries(diff.updates)
      .filter(([key]) => !['id', 'updatedAt', 'createdAt', 'organizationId', 'userId', 'ownerId'].includes(key))

    if (changes.length === 0) {
      return (
        <p className="text-slate-600 dark:text-slate-400 font-medium italic">Executed structural update on <span className="text-slate-900 dark:text-white font-black">{entityName}</span> metadata.</p>
      )
    }

    if (changes.length === 1) {
      const [key, val]: [string, any] = changes[0]
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase()
      const isStatus = key.toLowerCase().includes('status')

      return (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          Updated {label} of <span className="text-slate-900 dark:text-white font-black italic tracking-tight">{entityName}</span>
          from
          <Badge text={String(val?.from ?? 'empty')} variant="muted" />
          to
          <Badge text={String(val?.to ?? val)} variant={isStatus ? "accent" : "primary"} />
        </span>
      )
    }

    return (
      <div className="space-y-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Synchronized multiple <span className="text-slate-900 dark:text-white italic">{entityName}</span> properties:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {changes.map(([key, val]: [string, any]) => (
            <div key={key} className="flex flex-col p-4 rounded-[20px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:border-blue-500/30">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5">{key.replace(/([A-Z])/g, ' $1')}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400 line-through opacity-40 truncate max-w-[100px] italic">{String(val?.from ?? '—')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="text-blue-600 dark:text-blue-400 font-black truncate">{String(val?.to ?? val)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <p className="text-slate-600 dark:text-slate-400 font-medium">Performed interaction with <span className="text-slate-900 dark:text-white font-black italic">{entityName}</span> system module.</p>
  )
}


function Badge({ text, variant }: { text: string, variant: 'muted' | 'accent' | 'primary' }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border transition-all",
      variant === 'muted'
        ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
        : variant === 'accent'
          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          : "bg-accent-dim text-accent border-accent/10 shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
    )}>
      {text}
    </span>
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
