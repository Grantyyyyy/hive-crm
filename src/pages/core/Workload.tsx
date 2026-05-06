import { useMemo } from "react"
import { useCRMResource } from "@/lib/hooks"
import { useUser, useAuth } from "@/lib/AuthContext"
import { DashboardSkeleton } from "@/components/ui/skeletons"
import { StatCard } from "@/components/reusables/StatCard"
import type { Task, AppUser } from "@/lib/types"
import { cn } from "@/lib/utils"
import { isOverdue, getTasksDueSoon } from "@/lib/helpers"
import {
  Clock,
  AlertCircle,
  Users,
  BarChart3,
  Calendar,
  ArrowUpRight,
} from "lucide-react"

function formatDueLabel(dueDate: string): { label: string; overdue: boolean } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { label: 'Today', overdue: false }
  if (diff === 1) return { label: 'Tomorrow', overdue: false }
  return { label: `In ${diff}d`, overdue: false }
}

function shortId(id: string): string {
  return id.length > 12 ? id.slice(0, 6) + '...' + id.slice(-4) : id
}

function getInitials(name: string): string {
  if (!name || name.includes('...')) return "??"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    const first = parts[0][0] || ""
    const last = parts[parts.length - 1][0] || ""
    return `${first}${last}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Workload() {
  const { user: currentUser } = useUser()
  const { organizationId } = useAuth()
  const { data: tasks, isLoaded: tasksLoaded } = useCRMResource<Task>('tasks')
  const { data: allUsers, isLoaded: usersLoaded } = useCRMResource<AppUser>('users')

  const userMap = useMemo(() => {
    const map: Record<string, AppUser> = {}

    // 1. Load users from current organization
    if (allUsers) {
      allUsers
        .filter(u => !organizationId || u.organizationId === organizationId)
        .forEach(u => {
          if (u.id) map[u.id] = u
          if (u.authUserId) map[u.authUserId] = u
        })
    }

    // 2. Add current user as fallback if missing
    if (currentUser?.id && !map[currentUser.id]) {
      map[currentUser.id] = {
        id: currentUser.id,
        authUserId: currentUser.id,
        name: currentUser.user_metadata?.full_name || currentUser.email || "Me",
        email: currentUser.email || "",
        ownerId: currentUser.id,
        createdAt: "",
        updatedAt: ""
      }
    }

    return map
  }, [allUsers, organizationId, currentUser])

  const memberIds = useMemo(() => {
    if (!tasks) return []
    return Array.from(
      new Set(tasks.flatMap(t => t.assignedTo ?? []))
    ).filter(Boolean)
  }, [tasks])

  const memberData = useMemo(() => {
    if (!tasks || memberIds.length === 0) return []

    return memberIds.map(memberId => {
      const memberTasks = tasks.filter(t =>
        (t.assignedTo ?? []).includes(memberId)
      )

      const open = memberTasks.filter(
        t => t.status === 'open' || t.status === 'in-progress'
      ).length
      const overdue = memberTasks.filter(t => isOverdue(t)).length
      const completed = memberTasks.filter(t => t.status === 'completed').length
      const total = memberTasks.length

      const byPriority = {
        urgent: memberTasks.filter(t => t.priority === 'urgent').length,
        high: memberTasks.filter(t => t.priority === 'high').length,
        medium: memberTasks.filter(t => t.priority === 'medium').length,
        low: memberTasks.filter(t => t.priority === 'low').length,
      }

      const upcoming = getTasksDueSoon(memberTasks, 7)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3)
      return {
        memberId,
        open,
        overdue,
        completed,
        total,
        byPriority,
        upcoming,
      }
    })
  }, [tasks, memberIds])

  const sortedMembers = useMemo(() => {
    return [...memberData].sort((a, b) => b.open - a.open)
  }, [memberData])

  const totalOpen = useMemo(() => {
    if (!tasks) return 0
    return tasks.filter(t => t.status === 'open' || t.status === 'in-progress').length
  }, [tasks])

  const totalOverdue = useMemo(() => {
    if (!tasks) return 0
    return tasks.filter(t => isOverdue(t)).length
  }, [tasks])

  if (!tasksLoaded || !usersLoaded) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header & Integrated Summary Bar */}
        <div className="flex flex-col gap-6 pb-2">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Workload</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Team resource allocation.</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              label="Open"
              value={totalOpen.toString()}
              icon={<BarChart3 className="w-5 h-5" />}
              accentColor="accent"
              size="compact"
            />
            <StatCard
              label="Due"
              value={totalOverdue.toString()}
              icon={<AlertCircle className="w-5 h-5" />}
              accentColor="rose"
              size="compact"
            />
            <StatCard
              label="Active Team"
              value={memberIds.length.toString()}
              icon={<Users className="w-5 h-5" />}
              accentColor="slate"
              size="compact"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        {/* Compact Cards Grid */}
        {sortedMembers.length === 0 ? (
          <div className="glass rounded-2xl sm:rounded-[2rem] p-8 sm:p-6 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">No workload data</p>
            <p className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Assign tasks to members to see resource mapping.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
            {sortedMembers.map((member) => {
              const completionPct = member.total > 0
                ? Math.min(Math.round((member.completed / member.total) * 100), 100)
                : 0

              const user = userMap[member.memberId]
              const displayName = user?.name || shortId(member.memberId)

              return (
                <div
                  key={member.memberId}
                  className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-premium-hover overflow-hidden flex flex-col group/card"
                >
                  {/* Header */}
                  <div className="p-3 sm:p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center text-accent text-[10px] sm:text-xs font-bold uppercase ring-1 ring-accent/20">
                      {getInitials(displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {member.open} active
                      </p>
                    </div>
                    <div className={cn(
                      "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0",
                      member.overdue > 0 ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                    )} />
                  </div>

                  {/* Body - Stats Grid */}
                  <div className="p-3 sm:p-4 space-y-4 flex-1">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{member.open}</p>
                        <p className="text-[7px] sm:text-[8px] uppercase font-bold text-slate-500 tracking-tighter">Open</p>
                      </div>
                      <div className={cn(
                        "text-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl border",
                        member.overdue > 0
                          ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
                      )}>
                        <p className={cn("text-xs sm:text-sm font-black", member.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white")}>
                          {member.overdue}
                        </p>
                        <p className="text-[7px] sm:text-[8px] uppercase font-bold text-slate-500 tracking-tighter">Due</p>
                      </div>
                      <div className="text-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">{member.completed}</p>
                        <p className="text-[7px] sm:text-[8px] uppercase font-bold text-slate-500 tracking-tighter">Done</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Health</p>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300">{completionPct}%</p>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 sm:h-1.5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            completionPct > 75 ? "bg-emerald-500" : completionPct > 30 ? "bg-accent" : "bg-slate-400"
                          )}
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Load Balance */}
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Load Balance</p>
                      <div className="flex gap-1 h-0.5 sm:h-1">
                        {Array.from({ length: 4 }).map((_, i) => {
                          const priorities = ['urgent', 'high', 'medium', 'low'] as const
                          const p = priorities[i]
                          const count = member.byPriority[p]
                          const color = p === 'urgent' ? 'bg-red-500' : p === 'high' ? 'bg-orange-500' : p === 'medium' ? 'bg-amber-500' : 'bg-slate-400'

                          return (
                            <div key={p} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full", color)}
                                style={{ width: `${member.total > 0 ? (count / member.total) * 100 : 0}%` }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Upcoming */}
                    {member.upcoming.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Next Up
                        </p>
                        <div className="space-y-1.5 sm:space-y-2">
                          {member.upcoming.map(task => {
                            const { label, overdue } = formatDueLabel(task.dueDate)
                            return (
                              <div key={task.id} className="flex items-center justify-between gap-2">
                                <p className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate flex-1">
                                  {task.title}
                                </p>
                                <span className={cn(
                                  "text-[7px] sm:text-[8px] font-black uppercase px-1 py-0.5 rounded-md shrink-0",
                                  overdue ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-slate-400 bg-slate-50 dark:bg-slate-800/50"
                                )}>
                                  {label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <button className="w-full p-2.5 sm:p-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-accent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-center gap-2">
                    View Profile
                    <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
