import { useMemo } from "react"
import { Bell, Check, Clock, Info, AlertCircle, ExternalLink, X } from "lucide-react"
import { useCRMResource } from "@/lib/hooks"
import type { Notification } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLocation } from "wouter"

export function NotificationPanel() {
  const { data: notifications, updateItem } = useCRMResource<Notification>('notifications')
  const [, navigate] = useLocation()

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  )

  const handleMarkAsRead = async (id: string) => {
    await updateItem(id, { isRead: true }, true)
  }

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await updateItem(id, { isRead: true }, true)
  }

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead)
    // Fire all updates in parallel instead of sequential awaits
    await Promise.all(unread.map(n => updateItem(n.id, { isRead: true }, true)))
  }

  // Sort: unresolved first, then by date
  const sortedNotifications = useMemo(() =>
    [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications]
  )

  const renderMessage = (message: string, isRead: boolean) => {
    const parts = message.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong 
            key={i} 
            className={cn(
              "font-black",
              isRead ? "text-slate-500 dark:text-slate-600" : "text-slate-900 dark:text-white"
            )}
          >
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  const getIcon = (type: string, isRead: boolean) => {
    const iconClass = cn(
      "w-4 h-4",
      isRead ? "text-slate-500 dark:text-slate-600" : ""
    )

    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return <AlertCircle className={cn(iconClass, !isRead && "text-rose-500")} />
      case 'info':
        return <Info className={cn(iconClass, !isRead && "text-blue-500")} />
      default:
        return <Bell className={cn(iconClass, !isRead && "text-accent")} />
    }
  }

  return (
    <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[500px]">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-t-xl">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-accent text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            className="text-[10px] font-bold text-accent hover:text-accent/80 h-7 px-2"
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">All caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {sortedNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer group relative",
                  !notification.isRead && "bg-accent-dim/70 dark:bg-accent-dim/25 border-l-2 border-l-accent"
                )}
                onClick={() => {
                  if (!notification.isRead) handleMarkAsRead(notification.id)
                  if (notification.link) navigate(notification.link)
                }}
              >
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    {getIcon(notification.type, notification.isRead)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <p className={cn(
                          "text-sm leading-tight",
                          notification.isRead ? "text-slate-600 dark:text-slate-400 font-medium" : "text-slate-900 dark:text-white font-bold"
                        )}>
                          {notification.title.replace(/^(Low Stock|Out of Stock): /i, '')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-accent rounded-full shrink-0" />
                        )}
                        <button 
                          onClick={(e) => handleDismiss(e, notification.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {renderMessage(notification.message, notification.isRead)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                      {notification.link && (
                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-accent transition-colors" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white h-8"
          onClick={() => navigate('/notifications')}
        >
          View all notifications
        </Button>
      </div>
    </div>
  )
}
