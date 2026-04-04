import { useMemo } from "react"
import { useCRMResource } from "@/lib/hooks"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { isOverdue, getTasksDueSoon } from "@/lib/helpers"

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

function getInitials(id: string): string {
  return id.slice(0, 2).toUpperCase()
}

export function Workload() {
  const { data: tasks, isLoaded } = useCRMResource<Task>('tasks')

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
        .slice(0, 5)
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

  if (!isLoaded) {
    return <PageSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
              Team
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Workload
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Task distribution across team members.
            </p>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalOpen}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Total open
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalOverdue}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Total overdue
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {memberIds.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Team members
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        {sortedMembers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-600">
            <p className="text-lg font-semibold">No assigned tasks yet</p>
            <p className="text-sm mt-1">
              Assign tasks to team members to see workload here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedMembers.map((member) => {
              const completionPct = member.total > 0
                ? Math.min(Math.round((member.completed / member.total) * 100), 100)
                : 0

              return (
                <div
                  key={member.memberId}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden p-6"
                >
                  {/* Header Row */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold uppercase">
                      {getInitials(member.memberId)}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {shortId(member.memberId)}
                    </span>
                    <span className="ml-auto px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
                      {member.open} open
                    </span>
                  </div>

                  {/* Task Count Section */}
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                      Task Count
                    </p>
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {member.open}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Open
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {member.overdue}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Overdue
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {member.completed}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Completed
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {completionPct}% completion rate
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

                  {/* Priority Breakdown Section */}
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                      Priority Breakdown
                    </p>
                    <div className="space-y-2">
                      {/* Urgent */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 w-14">
                          Urgent
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">
                          {member.byPriority.urgent}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-red-500"
                            style={{
                              width: `${member.total > 0 ? (member.byPriority.urgent / member.total) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                      {/* High */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400 w-14">
                          High
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">
                          {member.byPriority.high}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-orange-500"
                            style={{
                              width: `${member.total > 0 ? (member.byPriority.high / member.total) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                      {/* Medium */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 w-14">
                          Medium
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">
                          {member.byPriority.medium}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-amber-500"
                            style={{
                              width: `${member.total > 0 ? (member.byPriority.medium / member.total) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                      {/* Low */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-14">
                          Low
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">
                          {member.byPriority.low}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-slate-400"
                            style={{
                              width: `${member.total > 0 ? (member.byPriority.low / member.total) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

                  {/* Upcoming Deadlines Section */}
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                      Upcoming (next 7 days)
                    </p>
                    {member.upcoming.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        No upcoming deadlines
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {member.upcoming.map(task => {
                          const { label, overdue } = formatDueLabel(task.dueDate)
                          return (
                            <div
                              key={task.id}
                              className="flex items-center gap-2"
                            >
                              <span
                                className={cn(
                                  "text-xs font-medium truncate flex-1",
                                  overdue
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-slate-700 dark:text-slate-300"
                                )}
                              >
                                {task.title}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-bold whitespace-nowrap",
                                  overdue
                                    ? "text-red-500"
                                    : "text-slate-400"
                                )}
                              >
                                {label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>


                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
