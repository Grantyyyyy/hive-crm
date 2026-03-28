import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Repeat2, CheckCircle2, PlusCircle } from "lucide-react"
import type { Task, TaskTag } from "@/lib/types"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface KanbanBoardProps {
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onEdit: (task: Task) => void
  onAddTask?: (status: Task['status']) => void
  tagsMap?: Record<string, TaskTag[]>
}

const COLUMNS = [
  { id: 'open', title: 'To Do', color: 'text-slate-700 dark:text-slate-300' },
  { id: 'in-progress', title: 'In Progress', color: 'text-blue-700 dark:text-blue-400' },
  { id: 'completed', title: 'Completed', color: 'text-emerald-700 dark:text-emerald-400' },
] as const

interface SortableTaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onStatusChange: (e: React.MouseEvent, task: Task, status: Task['status']) => void
  tags?: TaskTag[]
}

function SortableTaskCard({ task, onEdit, onStatusChange, tags }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  const isCompleted = task.status === 'completed'

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
      case 'low': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800'
    }
  }

  const getPriorityDotColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-amber-400'
      case 'low': return 'bg-emerald-500'
      default: return 'bg-slate-400'
    }
  }

  const nextStatus = task.status === 'open' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'open'
  const nextStatusLabel = nextStatus === 'in-progress' ? 'Start' : nextStatus === 'completed' ? 'Complete' : 'Reopen'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(task)}
      className={cn(
        "group relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all cursor-pointer hover:border-teal-600/30",
        isDragging && "z-50 shadow-xl ring-2 ring-teal-500 border-transparent rotate-1",
        isCompleted && "opacity-75 border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-500",
      )}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest",
          getPriorityColor(task.priority)
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", getPriorityDotColor(task.priority))} />
          {task.priority}
        </span>

        <button
          onClick={(e) => onStatusChange(e, task, nextStatus as Task['status'])}
          className="opacity-0 group-hover:opacity-100 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-all flex items-center gap-1"
        >
          {nextStatusLabel}
          {nextStatus === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Task Title */}
      <h4 className={cn(
        "text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2",
        isCompleted && "text-slate-500 dark:text-slate-400 line-through"
      )}>
        {task.title}
      </h4>

      {/* Tags Display */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => (
            <span
              key={tag.id}
              className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider"
              style={{
                backgroundColor: `${tag.color}26`,
                color: tag.color
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Recurrence Indicator */}
      {task.recurrencePattern && (
        <div className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 mb-3">
          <Repeat2 className="w-3 h-3" />
          <span>Repeats {task.recurrencePattern}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500 overflow-hidden">
            {task.ownerId ? task.ownerId.slice(0, 2).toUpperCase() : '??'}
          </div>
          <span className={cn(
            "text-[11px] font-medium",
            isCompleted ? "text-slate-500 dark:text-slate-400 italic" : isOverdue ? "text-red-600 font-bold" : "text-slate-600 dark:text-slate-400"
          )}>
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

export function KanbanBoard({ tasks, onUpdate, onEdit, onAddTask, tagsMap }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      'open': [],
      'in-progress': [],
      'completed': [],
    }

    tasks.forEach(task => {
      grouped[task.status]?.push(task)
    })

    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
    })

    return grouped
  }, [tasks])

  const handleStatusChange = (e: React.MouseEvent, task: Task, newStatus: Task['status']) => {
    e.stopPropagation()
    onUpdate(task.id, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
    })
  }

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const taskId = String(active.id)
    const overId = String(over.id)

    let newStatus: Task['status'] | undefined
    if (COLUMNS.some(col => col.id === overId)) {
      newStatus = overId as Task['status']
    } else {
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) newStatus = overTask.status
    }

    if (newStatus) {
      const task = tasks.find(t => t.id === taskId)
      if (task && task.status !== newStatus) {
        onUpdate(taskId, {
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
        })
      }
    }
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
        {COLUMNS.map(column => (
          <div key={column.id} className="flex flex-col gap-4">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                  {column.title}
                </h3>
                <span className="flex-shrink-0 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-md">
                  {tasksByStatus[column.id].length}
                </span>
              </div>
            </div>

            {/* Droppable Area */}
            <SortableContext
              id={column.id}
              items={tasksByStatus[column.id].map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={cn(
                "flex-1 flex flex-col gap-3 min-h-[500px] p-2 rounded-md border-2 border-dashed transition-colors",
                "border-slate-200 dark:border-slate-800/50 hover:border-teal-200 dark:hover:border-teal-900/50"
              )}>
                {tasksByStatus[column.id].length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-sm font-medium">
                    No tasks
                  </div>
                ) : (
                  tasksByStatus[column.id].map(task => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEdit}
                      onStatusChange={handleStatusChange}
                      tags={tagsMap?.[task.id]}
                    />
                  ))
                )}

                <button
                  onClick={() => onAddTask?.(column.id as Task['status'])}
                  className="w-full h-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 group transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold">Add Task</span>
                </button>
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[300px] pointer-events-none">
            <SortableTaskCard
              task={activeTask}
              onEdit={() => { }}
              onStatusChange={() => { }}
              tags={tagsMap?.[activeTask.id]}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
