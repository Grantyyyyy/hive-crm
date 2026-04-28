import { useState, useMemo, useEffect } from "react"
import { Bell, Check, Trash2, Clock, Inbox, AlertCircle, Info } from "lucide-react"
import { useCRMResource } from "@/lib/hooks"
import type { Notification } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ListSkeleton } from "@/components/ui/skeletons"
import { StatusTabs, type StatusTab } from "@/components/reusables/StatusTabs"
import { Pagination } from "@/components/ui/Pagination"

export function Notifications() {
  const { data: notifications, updateItem, deleteItem, isLoaded } = useCRMResource<Notification>('notifications')
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const handleMarkAsRead = async (id: string) => {
    await updateItem(id, { isRead: true })
  }

  const handleDelete = async (id: string) => {
    await deleteItem(id)
  }

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead)
    for (const n of unread) {
      await updateItem(n.id, { isRead: true }, true)
    }
  }

  const filtered = useMemo(() => {
    let result = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (activeTab === 'unread') {
      result = result.filter(n => !n.isRead)
    } else if (activeTab === 'read') {
      result = result.filter(n => n.isRead)
    }

    return result
  }, [notifications, activeTab])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const renderMessage = (message: string) => {
    const parts = message.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  const getIcon = (type: string, isRead: boolean) => {
    const className = cn("w-5 h-5", !isRead && "animate-pulse")
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return <AlertCircle className={cn(className, "text-rose-500")} />
      case 'info':
        return <Info className={cn(className, "text-blue-500")} />
      default:
        return <Bell className={cn(className, isRead ? "text-slate-400" : "text-teal-600")} />
    }
  }

  const tabOptions: StatusTab<any>[] = [
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Archived' },
  ]

  if (!isLoaded) return <ListSkeleton />

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Section (compact for sub-page) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Recent Alerts</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Stay updated with system events.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead} 
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

        {/* Tabs Section */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <StatusTabs
            tabs={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
            allLabel="All Alerts"
          />
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {filtered.length} {filtered.length === 1 ? 'Alert' : 'Alerts'}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                <Inbox className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</p>
                <p className="text-slate-500 text-sm">No notifications here.</p>
              </div>
            </div>
          ) : (
            paginated.map((n) => (
              <div 
                key={n.id}
                onClick={() => {
                  if (!n.isRead) handleMarkAsRead(n.id)
                  if (n.link) window.location.hash = `#${n.link}`
                }}
                className={cn(
                  "bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                  !n.isRead 
                    ? "border-teal-200 dark:border-teal-800/50 shadow-sm shadow-teal-500/5" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-600" />
                )}
                
                <div className="p-5 flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                    !n.isRead 
                      ? "bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800" 
                      : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                  )}>
                    {getIcon(n.type, n.isRead)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <h3 className={cn(
                          "text-[15px] font-bold truncate transition-colors",
                          !n.isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                        )}>
                          {n.title.replace(/^(Low Stock|Out of Stock): /i, '')}
                        </h3>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border shrink-0",
                          n.type === 'low_stock' || n.type === 'out_of_stock' 
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        )}>
                          {n.type.replace('_', ' ')}
                        </span>
                        {!n.isRead && (
                          <span className="flex h-2 w-2 rounded-full bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.5)]" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {!n.isRead && (
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id) }} 
                              className="text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }} 
                            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {renderMessage(n.message)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {isLoaded && filtered.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            itemLabel="alerts"
          />
        )}
    </div>
  )
}


