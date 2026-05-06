import { useState, useMemo } from "react"
import { useParams, useLocation } from "wouter"
import {
  FolderOpen,
  PlusCircle,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  List,
  LayoutGrid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isOverdue } from "@/lib/helpers"
import type { Task, Project } from "@/lib/types"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@/lib/AuthContext"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { TaskView } from "@/components/crmComponent/TaskView"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"
import { BackButton } from "@/components/reusables/BackButton"
import { EditProjectModal } from "@/components/crmComponent/EditProjectModal"
import { Pencil } from "lucide-react"
import { StatCard } from "@/components/reusables/StatCard"

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [, setLocation] = useLocation()
  const { isLoaded: userLoaded } = useUser()
  const { data: projects, isLoaded: projectsLoaded, updateItem, deleteItem } = useCRMResource<Project>('projects')
  const { data: tasks, isLoaded: tasksLoaded } = useCRMResource<Task>('tasks')

  const isLoaded = userLoaded && projectsLoaded && tasksLoaded

  const project = useMemo(() => projects?.find(p => p.id === id), [projects, id])

  const projectTasks = useMemo(() => {
    return tasks?.filter(t => t.projectId === id) || []
  }, [tasks, id])

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const stats = useMemo(() => {
    const total = projectTasks.length
    const completed = projectTasks.filter(t => t.status === 'completed').length
    const open = projectTasks.filter(t => t.status !== 'completed').length
    const overdue = projectTasks.filter(t => isOverdue(t) && t.status !== 'completed').length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, open, overdue, progress }
  }, [projectTasks])

  if (!isLoaded || !project) {
    return <DetailSkeleton />
  }

  return (
    <div className="flex-1 bg-bg-base text-text-primary min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BackButton href="/projects" showText={false} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Work Organization</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${project.color}20` }}
              >
                <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary">{project.name}</h1>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-accent hover:bg-accent-dim transition-all active:scale-90"
                    title="Edit Project"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                {project.description && (
                  <p className="text-text-muted mt-1 font-medium">{project.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="brand"
              onClick={() => setShowAddTaskModal(true)}
            >
              <PlusCircle className="w-4 h-4" /> New Task
            </Button>
            <div className="bg-white dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800 flex items-center p-1 shadow-sm gap-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "h-8 px-3 rounded text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
                  viewMode === "kanban"
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-8 px-3 rounded text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
                  viewMode === "list"
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Total Tasks"
            value={stats.total.toString()}
            icon={<ListTodo className="w-5 h-5" />}
            accentColor="accent"
          />
          <StatCard
            label="Open"
            value={stats.open.toString()}
            icon={<Clock className="w-5 h-5" />}
            accentColor="blue"
          />
          <StatCard
            label="Completed"
            value={stats.completed.toString()}
            icon={<CheckCircle2 className="w-5 h-5" />}
            accentColor="emerald"
          />
          <StatCard
            label="Overdue"
            value={stats.overdue.toString()}
            icon={<AlertCircle className="w-5 h-5" />}
            accentColor={stats.overdue > 0 ? "rose" : "slate"}
          />
          <StatCard
            label="Progress"
            value={
              <div>
                <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{stats.progress}%</p>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.progress}%`, backgroundColor: project.color }}
                  />
                </div>
              </div>
            }
            icon={<TrendingUp className="w-5 h-5" />}
            accentColor="amber"
          />
        </div>

        {/* Tasks Section */}
        <TaskView fixedProjectId={id} hideHeader={true} defaultViewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      <AddTaskModal
        open={showAddTaskModal}
        onOpenChange={setShowAddTaskModal}
        fixedProjectId={id}
        onSave={() => { }}
        userId={project.ownerId}
      />

      <EditProjectModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        project={project}
        onUpdate={updateItem}
        onDelete={async (id) => {
          await deleteItem(id)
          setLocation('/projects')
        }}
      />
    </div>
  )
}
