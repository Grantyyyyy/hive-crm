import { useState, useMemo } from "react"
import { useParams, useLocation } from "wouter"
import {
  FolderOpen,
  ArrowLeft,
  PlusCircle,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isOverdue, priorityWeight } from "@/lib/helpers"
import type { Task, Project } from "@/lib/types"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@clerk/clerk-react"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { TaskView } from "@/components/crmComponent/TaskView"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [, setLocation] = useLocation()
  const { isLoaded: clerkLoaded } = useUser()
  const { data: projects, isLoaded: projectsLoaded } = useCRMResource<Project>('projects')
  const { data: tasks, isLoaded: tasksLoaded } = useCRMResource<Task>('tasks')

  const isLoaded = clerkLoaded && projectsLoaded && tasksLoaded

  const project = useMemo(() => projects?.find(p => p.id === id), [projects, id])

  const projectTasks = useMemo(() => {
    return tasks?.filter(t => t.projectId === id) || []
  }, [tasks, id])

  const [activeTab, setActiveTab] = useState<'tasks' | 'analytics'>('tasks')
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)

  const analytics = useMemo(() => {
    const total = projectTasks.length
    if (total === 0) return null

    const completed = projectTasks.filter(t => t.status === 'completed').length
    const inProgress = projectTasks.filter(t => t.status === 'in-progress').length
    const open = projectTasks.filter(t => t.status === 'open').length
    const overdue = projectTasks.filter(t => isOverdue(t)).length
    const completionPct = Math.round((completed / total) * 100)
    const inProgressPct = Math.round((inProgress / total) * 100)

    // Priority breakdown
    const priorities = ['urgent', 'high', 'medium', 'low'] as const
    const priorityCounts = priorities.map(p => ({
      priority: p,
      count: projectTasks.filter(t => t.priority === p).length,
    })).filter(x => x.count > 0).sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))

    // Team breakdown
    const memberMap = new Map<string, number>()
    projectTasks.forEach(t => {
      (t.assignedTo ?? []).forEach(uid => {
        memberMap.set(uid, (memberMap.get(uid) ?? 0) + 1)
      })
    })
    const members = Array.from(memberMap.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
    const maxMemberCount = members[0]?.count ?? 1

    return {
      total, completed, inProgress, open, overdue,
      completionPct, inProgressPct,
      priorityCounts, members, maxMemberCount,
    }
  }, [projectTasks])

  const stats = useMemo(() => {
    const total = projectTasks.length
    const completed = projectTasks.filter(t => t.status === 'completed').length
    const open = projectTasks.filter(t => t.status !== 'completed').length
    const overdue = projectTasks.filter(t => isOverdue(t) && t.status !== 'completed').length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, open, overdue, progress }
  }, [projectTasks])

  if (!isLoaded || !project) {
    return <PageSkeleton />
  }

  return (
    <div className="flex-1 bg-bg-base text-text-primary min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/projects')}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Work Organization</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${project.color}20` }}
              >
                <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">{project.name}</h1>
                {project.description && (
                  <p className="text-text-muted mt-1 font-medium">{project.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none"
              onClick={() => setShowAddTaskModal(true)}
            >
              <PlusCircle className="w-4 h-4" /> New Task
            </Button>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('tasks')}
                className={cn(
                  "h-8 px-3 rounded text-sm font-bold transition-colors",
                  activeTab === 'tasks'
                    ? "bg-teal-600 text-white"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  "h-8 px-3 rounded text-sm font-bold transition-colors flex items-center gap-1.5",
                  activeTab === 'analytics'
                    ? "bg-teal-600 text-white"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                Analytics
                <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {projectTasks.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-bg-surface rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <ListTodo className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Total Tasks</p>
              </div>
              <p className="text-3xl font-bold text-text-primary">{stats.total}</p>
            </div>

            <div className="bg-bg-surface rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Open</p>
              </div>
              <p className="text-3xl font-bold text-text-primary">{stats.open}</p>
            </div>

            <div className="bg-bg-surface rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Completed</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
            </div>

            <div className="bg-bg-surface rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  stats.overdue > 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-slate-50 dark:bg-slate-900/20"
                )}>
                  <AlertCircle className={cn("w-4 h-4", stats.overdue > 0 ? "text-rose-600" : "text-slate-400")} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Overdue</p>
              </div>
              <p className={cn(
                "text-3xl font-bold",
                stats.overdue > 0 ? "text-rose-600" : "text-text-muted"
              )}>{stats.overdue}</p>
            </div>

            <div className="bg-bg-surface rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center" style={{ backgroundColor: `${project.color}20` }}>
                  <TrendingUp className="w-4 h-4" style={{ color: project.color }} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Progress</p>
              </div>
              <div className="flex items-end justify-between gap-2">
                <p className="text-3xl font-bold text-text-primary">{stats.progress}%</p>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${stats.progress}%`, backgroundColor: project.color }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tasks Section */}
        {activeTab === 'tasks' && (
          <TaskView fixedProjectId={id} hideHeader={true} />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {!analytics ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-6">
                <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                  <p className="text-lg font-semibold">No tasks yet</p>
                  <p className="text-sm mt-1 font-medium">
                    Add tasks to this project to see analytics.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* ROW 1 — STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1 — Completion rate */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-6">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {analytics.completionPct}%
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                      Completion rate
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {analytics.completed} of {analytics.total} tasks done
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-4">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${analytics.completionPct}%`,
                          backgroundColor: analytics.completionPct >= 75 ? '#059669' : analytics.completionPct >= 40 ? '#d97706' : '#dc2626'
                        }}
                      />
                    </div>
                  </div>



                  {/* Card 3 — Overdue tasks */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-6">
                    <p className={cn(
                      "text-3xl font-bold",
                      analytics.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {analytics.overdue}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                      Overdue
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {analytics.overdue === 0 ? "All tasks on track" : `${analytics.overdue} past due date`}
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-4">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: analytics.overdue > 0 ? '100%' : '0%',
                          backgroundColor: analytics.overdue > 0 ? '#dc2626' : '#059669'
                        }}
                      />
                    </div>
                  </div>

                  {/* Card 4 — Total tasks */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-6">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {analytics.total}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                      Total tasks
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {analytics.open} open · {analytics.inProgress} in progress
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-4">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: '100%', backgroundColor: project.color }}
                      />
                    </div>
                  </div>
                </div>

                {/* ROW 2 — TWO COLUMNS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LEFT CARD — Priority distribution */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-6">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                      Priority breakdown
                    </h3>
                    <div className="space-y-3">
                      {analytics.priorityCounts.map(({ priority, count }) => {
                        const pct = Math.round((count / analytics.total) * 100)
                        const colors: Record<string, string> = {
                          urgent: '#dc2626',
                          high: '#f97316',
                          medium: '#f59e0b',
                          low: '#94a3b8',
                        }
                        return (
                          <div key={priority} className="flex items-center gap-3">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: colors[priority] }}
                            />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-16 capitalize">
                              {priority}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white w-8 text-right">
                              {count}
                            </span>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: colors[priority] }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-400 w-10 text-right">
                              {pct}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* RIGHT CARD — Team member breakdown */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-6">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                      Team breakdown
                    </h3>
                    {analytics.members.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                        No assignees on project tasks yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.members.map(({ id: memberId, count }) => {
                          const barWidth = Math.round((count / analytics.maxMemberCount) * 100)
                          const shortId = (id: string) => id.length > 12 ? id.slice(0, 6) + '...' + id.slice(-4) : id
                          return (
                            <div key={memberId} className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                                style={{ backgroundColor: project.color + '22', color: project.color }}
                              >
                                {shortId(memberId)}
                              </div>
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24">
                                {shortId(memberId)}
                              </span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white w-16 text-right">
                                {count} tasks
                              </span>
                              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${barWidth}%`, backgroundColor: project.color }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ROW 3 — COMPLETION PROGRESS TIMELINE */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-6">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                    Completion progress
                  </h3>
                  <div className="w-full h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
                    <div
                      style={{ width: `${analytics.completionPct}%`, backgroundColor: '#059669' }}
                      className="h-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${analytics.inProgressPct}%`, backgroundColor: '#4f46e5' }}
                      className="h-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#059669' }} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Completed {analytics.completed}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4f46e5' }} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        In progress {analytics.inProgress}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Open {analytics.open}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <AddTaskModal
        open={showAddTaskModal}
        onOpenChange={setShowAddTaskModal}
        fixedProjectId={id}
        onSave={() => { }}
        userId={project.ownerId}
      />
    </div>
  )
}
