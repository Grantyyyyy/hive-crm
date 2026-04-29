import React, { useEffect, useState } from "react"
import { useCRMContext } from "../../lib/CRMContext"
import { format } from "date-fns"
import { 
  History, Edit2, Plus, Trash2, 
  ArrowRight, Clock, AlertCircle, 
  CheckCircle2, Info, Activity
} from "lucide-react"
import { cn } from "../../lib/utils"

interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  changedBy: {
    name: string
    avatarUrl?: string
  }
  changedAt: string
  diff: any
}

export function AuditTimeline({ entityType, entityId }: { entityType: string, entityId: string }) {
  const { fetchAuditLogs } = useCRMContext()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs(entityType, entityId).then(data => {
      setLogs(data)
      setLoading(false)
    })
  }, [entityType, entityId, fetchAuditLogs])

  if (loading) return (
    <div className="space-y-3 p-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  )

  if (logs.length === 0) return (
    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-100 dark:border-slate-800/50 rounded-2xl font-sans">
      <History className="w-8 h-8 mx-auto mb-2 opacity-10" />
      <p className="text-xs font-bold uppercase tracking-widest opacity-50">No history recorded</p>
    </div>
  )

  return (
    <div className="relative font-sans py-2">
      {/* Timeline Thread */}
      <div className="absolute left-[20px] top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800/40 rounded-full" />
      
      <div className="space-y-4">
        {logs.map((log, idx) => (
          <div 
            key={log.id} 
            className="relative pl-12 pb-2 group animate-in fade-in slide-in-from-left-2 duration-300" 
          >
            {/* Timeline Marker Icon */}
            <div className={cn(
              "absolute left-[20px] top-0 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 border-white dark:border-zinc-950 shadow-sm",
              log.action === 'INSERT' ? "bg-emerald-500 text-white" :
              log.action === 'UPDATE' ? "bg-blue-500 text-white" :
              "bg-rose-500 text-white"
            )}>
              <ActionTimelineIcon action={log.action} />
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/60 rounded-xl p-3.5 shadow-sm transition-colors duration-200 group-hover:border-slate-300 dark:group-hover:border-slate-700">
               <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                     <div className="flex items-center gap-2.5">
                        <img
                          className="w-7 h-7 rounded-full ring-1 ring-slate-100 dark:ring-slate-800 object-cover"
                          src={log.changedBy?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.changedBy.name)}&background=0d9488&color=fff`}
                          alt={log.changedBy.name}
                        />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">
                            {log.changedBy.name}
                          </span>
                        </div>
                     </div>
                     <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 opacity-60">
                        {format(new Date(log.changedAt), 'MMM d, h:mm a')}
                     </div>
                  </div>

                  <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-normal font-medium">
                     <DescriptionFormatter log={log} entityType={entityType} />
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionTimelineIcon({ action }: { action: string }) {
  switch (action) {
    case 'INSERT': return <Plus className="w-3 h-3" />
    case 'UPDATE': return <CheckCircle2 className="w-3 h-3" />
    case 'DELETE': return <Trash2 className="w-3 h-3" />
    default: return <Activity className="w-3 h-3" />
  }
}


function DescriptionFormatter({ log, entityType }: { log: any, entityType: string }) {
  const { action, diff } = log
  const entityName = entityType.replace(/s$/, '').replace(/_/g, ' ')
  
  if (action === 'INSERT') {
    return (
      <div className="flex items-center gap-2">
        <span>Initialized new</span>
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg font-black uppercase text-[10px] tracking-widest border border-emerald-100 dark:border-emerald-800">
          {entityName}
        </span>
      </div>
    )
  }

  if (action === 'DELETE') {
    return (
      <div className="flex items-center gap-2">
        <span>Permanently removed</span>
        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg font-black uppercase text-[10px] tracking-widest border border-rose-100 dark:border-rose-800">
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
        <p>Performed structural modifications on <span className="text-slate-900 dark:text-white font-black italic">{entityName}</span></p>
      )
    }

    // If only one change, format it nicely like the image
    if (changes.length === 1) {
      const [key, val]: [string, any] = changes[0]
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase()
      const isStatus = key.toLowerCase().includes('status')
      
      return (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          Updated {label} of <span className="text-slate-900 dark:text-white font-black italic">{entityName}</span> 
          from 
          <Badge text={String(val?.from ?? 'empty')} variant="muted" />
          to 
          <Badge text={String(val?.to ?? val)} variant={isStatus ? "accent" : "primary"} />
        </span>
      )
    }

    return (
      <div className="space-y-3">
        <p>Batch update on <span className="text-slate-900 dark:text-white font-black italic tracking-tight">{entityName}</span> properties:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {changes.map(([key, val]: [string, any]) => (
            <div key={key} className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{key.replace(/([A-Z])/g, ' $1')}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 line-through opacity-50 truncate max-w-[80px]">{String(val?.from ?? '—')}</span>
                <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                <span className="text-blue-600 dark:text-blue-400 font-bold truncate">{String(val?.to ?? val)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <p>Executed an administrative action on <span className="text-slate-900 dark:text-white font-black italic">{entityName}</span></p>
  )
}

function Badge({ text, variant }: { text: string, variant: 'muted' | 'accent' | 'primary' }) {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border transition-all",
      variant === 'muted' 
        ? "bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700" 
        : variant === 'accent'
        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100/50 dark:border-blue-800/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
        : "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 border-teal-100/50 dark:border-teal-800/50 shadow-[0_0_10px_rgba(20,184,166,0.1)]"
    )}>
      {text}
    </span>
  )
}

