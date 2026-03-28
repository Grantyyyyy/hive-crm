import { useMemo } from "react"
import { useUser } from "@clerk/clerk-react"
import { useCRMResource } from "@/lib/hooks"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

export function Workload() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const { data: tasks, isLoaded: tasksLoaded } = useCRMResource<Task>('tasks')

  const isLoaded = clerkLoaded && tasksLoaded

  const workloadByPerson = useMemo(() => {
    if (!tasks) return []

    const grouped: Record<string, { name: string; tasks: Task[]; completed: number; open: number; overdue: number }> = {}
    const now = new Date()

    tasks.forEach(task => {
      const assigneeId = task.assignedTo?.[0] || task.ownerId
      if (!grouped[assigneeId]) {
        grouped[assigneeId] = {
          name: assigneeId === user?.id ? (user?.firstName || 'You') : 'Team Member',
          tasks: [],
          completed: 0,
          open: 0,
          overdue: 0,
        }
      }

      grouped[assigneeId].tasks.push(task)

      if (task.status === 'completed') {
        grouped[assigneeId].completed++
      } else {
        grouped[assigneeId].open++
        if (new Date(task.dueDate) < now) {
          grouped[assigneeId].overdue++
        }
      }
    })

    return Object.values(grouped).sort((a, b) => b.open - a.open)
  }, [tasks, user?.id, user?.firstName])

  if (!isLoaded) {
    return <PageSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">Work Management</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Workload</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">View task distribution across your team.</p>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workloadByPerson.map((person) => {
            const total = person.tasks.length
            const progress = total > 0 ? Math.round((person.completed / total) * 100) : 0

            return (
              <div
                key={person.name}
                className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-6"
              >
                {/* Person Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal-600/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-teal-600">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{person.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{total} tasks</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{person.open}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Open</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className="text-2xl font-bold text-emerald-600">{person.completed}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Done</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className={cn(
                      "text-2xl font-bold",
                      person.overdue > 0 ? "text-red-600" : "text-slate-500 dark:text-slate-400"
                    )}>{person.overdue}</p>
                    <p className="text-[10px] uppercase font-bold text-text-muted">Overdue</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-muted font-medium">Completion</span>
                    <span className="text-text-primary font-bold">{progress}%</span>
                  </div>
                  <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Task List Preview */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-muted uppercase">Current Tasks</h4>
                  {person.tasks
                    .filter(t => t.status !== 'completed')
                    .slice(0, 5)
                    .map(task => (
                      <div
                        key={task.id}
                        className="text-sm text-text-secondary truncate"
                      >
                        {task.title}
                      </div>
                    ))}
                  {person.open > 5 && (
                    <p className="text-xs text-text-muted">+{person.open - 5} more</p>
                  )}
                </div>
              </div>
            )
          })}

          {workloadByPerson.length === 0 && (
            <div className="col-span-full p-12 text-center text-text-muted">
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm mt-1">Tasks will be grouped by assignee here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
