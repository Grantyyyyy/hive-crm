import { useState, useMemo } from "react"
import { useParams, useLocation } from "wouter"
import { toast } from "sonner"
import {
  FolderOpen,
  PlusCircle,
  ArrowLeft,
  LayoutGrid,
  LayoutList,
  Check,
  Repeat2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isOverdue } from "@/lib/helpers"
import type { Task, Project } from "@/lib/types"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"
import { EditTaskModal } from "@/components/crmComponent/EditTaskModal"
import { KanbanBoard } from "@/components/crmComponent/KanbanBoard"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@clerk/clerk-react"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DeleteModal } from "@/components/ui/delete-modal"

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [, setLocation] = useLocation()
  const { user, isLoaded: clerkLoaded } = useUser()
  const { data: projects, isLoaded: projectsLoaded } = useCRMResource<Project>('projects')
  const { data: tasks, isLoaded: tasksLoaded, addItems, updateItem, deleteItem } = useCRMResource<Task>('tasks')

  const isLoaded = clerkLoaded && projectsLoaded && tasksLoaded

  const project = useMemo(() => projects?.find(p => p.id === id), [projects, id])

  const projectTasks = useMemo(() => {
    return tasks?.filter(t => t.projectId === id) || []
  }, [tasks, id])

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)

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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/projects')}
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${project.color}20` }}
                >
                  <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">{project.name}</h1>
              </div>
              {project.description && (
                <p className="text-text-muted ml-13">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-bg-surface border border-border rounded-md p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-2"
                title="Table View"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-8 px-2"
                title="Kanban Board"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="default" onClick={() => setShowAddModal(true)}>
              <PlusCircle className="w-4 h-4" /> Add Task
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-bg-surface rounded-lg border border-border p-4">
            <p className="text-sm text-text-muted font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{stats.total}</p>
          </div>
          <div className="bg-bg-surface rounded-lg border border-border p-4">
            <p className="text-sm text-text-muted font-medium">Open</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{stats.open}</p>
          </div>
          <div className="bg-bg-surface rounded-lg border border-border p-4">
            <p className="text-sm text-text-muted font-medium">Completed</p>
            <p className="text-3xl font-bold text-green mt-1">{stats.completed}</p>
          </div>
          <div className="bg-bg-surface rounded-lg border border-border p-4">
            <p className="text-sm text-text-muted font-medium">Overdue</p>
            <p className={cn(
              "text-3xl font-bold mt-1",
              stats.overdue > 0 ? "text-red" : "text-text-muted"
            )}>{stats.overdue}</p>
          </div>
          <div className="bg-bg-surface rounded-lg border border-border p-4">
            <p className="text-sm text-text-muted font-medium">Progress</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold text-text-primary">{stats.progress}%</p>
            </div>
            <div className="h-2 bg-bg-elevated rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${stats.progress}%`, backgroundColor: project.color }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        {viewMode === 'table' ? (
          <div className="bg-bg-surface rounded-lg border border-border overflow-hidden">
            <div className="divide-y border-border">
              {projectTasks.length === 0 ? (
                <div className="p-12 text-center">
                  <FolderOpen className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                  <p className="text-text-muted font-medium mb-4">No tasks in this project yet</p>
                  <Button variant="default" onClick={() => setShowAddModal(true)}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Task
                  </Button>
                </div>
              ) : (
                projectTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-bg-surface transition-all group cursor-pointer"
                    onClick={() => setEditingTask(task)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold truncate",
                          task.status === 'completed' ? "text-text-muted line-through" : "text-text-primary"
                        )}>
                          {task.title}
                        </span>
                        {task.recurrencePattern && (
                          <Repeat2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] uppercase font-bold",
                        task.priority === 'urgent' || task.priority === 'high' ? 'text-red bg-red-50' :
                          task.priority === 'medium' ? 'text-amber bg-yellow-50' :
                            'text-green bg-green-50'
                      )}>
                        {task.priority}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] uppercase font-bold",
                        task.status === 'completed' ? 'text-green bg-green-100' :
                          task.status === 'in-progress' ? 'text-accent bg-accent/10' :
                            'text-text-secondary bg-bg-elevated'
                      )}>
                        {task.status === 'in-progress' ? 'In Progress' : task.status === 'completed' ? 'Done' : 'To Do'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateItem(task.id, {
                            status: task.status === 'completed' ? 'open' : 'completed',
                            completedAt: task.status === 'completed' ? undefined : new Date().toISOString()
                          })
                        }}
                        className={cn(
                          "w-6 h-6 rounded flex items-center justify-center border transition-all",
                          task.status === 'completed'
                            ? "bg-green border-green text-white"
                            : "border-slate-200 dark:border-slate-800 hover:border-teal-600"
                        )}
                      >
                        {task.status === 'completed' && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <KanbanBoard
            tasks={projectTasks}
            onUpdate={updateItem}
            onEdit={setEditingTask}
          />
        )}
      </div>

      <AddTaskModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={(task) => {
          addItems([{ ...task, projectId: id }])
          toast.success(`Task "${task.title}" added to project`)
        }}
        userId={user?.id ?? ""}
      />

      <EditTaskModal
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onUpdate={updateItem}
        onDelete={deleteItem}
        user={user}
      />

      <DeleteModal
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title="Delete Task"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-text-primary font-bold">{pendingDelete?.title}</strong>?
            {" "}This action cannot be undone.
          </>
        }
        onDelete={() => {
          if (pendingDelete) deleteItem(pendingDelete.id)
          setPendingDelete(null)
        }}
        cancelText="Cancel"
        deleteText="Delete Task"
      />
    </div>
  )
}
