import React, { useEffect, useState } from "react"
import { useCRMContext } from "../../lib/CRMContext"
import { formatDistanceToNow } from "date-fns"
import { History, Edit2, Plus, Trash2, ArrowRight } from "lucide-react"

interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  changedBy: {
    name: string
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

  if (loading) return <div className="p-4 text-gray-500 animate-pulse text-sm font-sans">Loading history...</div>

  if (logs.length === 0) return (
    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-xl font-sans">
      <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
      <p className="text-sm">No activity history found.</p>
    </div>
  )

  return (
    <div className="flow-root font-sans">
      <ul role="list" className="-mb-8">
        {logs.map((log, idx) => (
          <li key={log.id}>
            <div className="relative pb-8">
              {idx !== logs.length - 1 && (
                <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-100 dark:bg-zinc-800" aria-hidden="true" />
              )}
              <div className="relative flex items-start space-x-4">
                <div className="relative">
                  <img
                    className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-zinc-800 ring-4 ring-white dark:ring-zinc-950 object-cover"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.changedBy.name)}&background=random&color=fff`}
                    alt={log.changedBy.name}
                  />
                  <span className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-950 rounded-full p-0.5 shadow-sm border border-gray-50 dark:border-zinc-800">
                    <ActionIcon action={log.action} />
                  </span>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="text-sm text-gray-500 dark:text-zinc-400">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {log.changedBy.name}
                    </span>
                    {' '}
                    <span className="lowercase">{log.action === 'INSERT' ? 'created' : log.action === 'UPDATE' ? 'updated' : 'deleted'}</span>
                    {' '}
                    this {entityType.replace(/s$/, '')}
                    {' '}
                    <span className="whitespace-nowrap font-medium text-gray-400 dark:text-zinc-500 text-xs">
                      {formatDistanceToNow(new Date(log.changedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-2">
                    <DiffDisplay action={log.action} diff={log.diff} />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case 'INSERT': return <Plus className="w-3 h-3 text-emerald-500" />
    case 'UPDATE': return <Edit2 className="w-3 h-3 text-amber-500" />
    case 'DELETE': return <Trash2 className="w-3 h-3 text-rose-500" />
    default: return <History className="w-3 h-3 text-gray-400" />
  }
}

function DiffDisplay({ action, diff }: { action: string, diff: any }) {
  if (action === 'UPDATE' && diff?.updates) {
    const changes = Object.entries(diff.updates)
      .filter(([key]) => !['id', 'updatedAt', 'createdAt', 'organizationId', 'userId', 'ownerId'].includes(key))

    if (changes.length === 0) return null

    return (
      <div className="mt-3 space-y-1.5">
        {changes.map(([key, val]: [string, any]) => (
          <div key={key} className="flex flex-col p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-in slide-in-from-left-2 duration-300">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1">{key.replace(/([A-Z])/g, ' $1')}</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-md line-through opacity-60">
                {String(val?.from ?? '—')}
              </span>
              <ArrowRight className="w-3 h-3 text-gray-300" />
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-md font-bold">
                {String(val?.to ?? val)}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }
  return null
}
