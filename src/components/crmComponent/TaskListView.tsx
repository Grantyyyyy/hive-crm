import { useState } from "react"
import {
  Check,
  PlusCircle,
  Trash2,
  GripVertical,
  Calendar,
  User as UserIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { cn } from "@/lib/utils"
import { isOverdue } from "@/lib/helpers"
import type { Task, Project } from "@/lib/types"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TaskListViewProps {
  tasksByStatus: Record<string, Task[]>
  statusFilter: string
  isSelectionMode: boolean
  selectedTaskIds: Set<string>
  projectMap: Record<string, Project>
  user: any
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onToggleSelect: (e: React.MouseEvent, id: string) => void
  onSelectAll: (status: string, e: React.MouseEvent) => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onAddTask: (status: string) => void
}

interface SortableTaskRowProps {
  task: Task
  isSelectionMode: boolean
  isSelected: boolean
  projectMap: Record<string, Project>
  user: any
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onToggleSelect: (e: React.MouseEvent, id: string) => void
  isDragging?: boolean
  isOverlay?: boolean
}

function TaskRowContent({ 
  task, 
  isSelectionMode, 
  isSelected, 
  projectMap, 
  user, 
  onEdit, 
  onDelete, 
  onToggleSelect,
  isDragging,
  dragHandleProps,
  isOverlay
}: any) {
  const isComp = task.status === 'completed'
  const isOverdueTask = isOverdue(task) && !isComp

  return (
    <div
      className={cn(
        "grid grid-cols-[40px_50px_1fr_120px_160px_140px_140px_60px] items-center gap-4 px-6 py-2.5 transition-all border-l-4 border-transparent bg-white dark:bg-slate-900 shadow-xs",
        isSelected && !isOverlay && "bg-teal-50/40 dark:bg-teal-900/10 border-l-teal-600",
        isDragging && !isOverlay && "opacity-0",
        isOverlay && "shadow-xl border-l-teal-600 ring-2 ring-teal-500/20 rounded-md opacity-100 scale-[1.01] cursor-grabbing border-y border-slate-200 dark:border-slate-800",
        !isOverlay && "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      )}
      onClick={() => onEdit(task)}
    >
      <div 
        className={cn(
          "flex justify-center text-slate-400 dark:text-slate-500 hover:text-teal-600 cursor-grab p-1",
          isSelectionMode && "pointer-events-none opacity-20"
        )}
        {...(dragHandleProps || {})}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex justify-center">
        {(isSelectionMode || isSelected) ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(e, task.id); }}
            className={cn(
              "w-4 h-4 rounded-sm border transition-all flex items-center justify-center shadow-xs",
              isSelected ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-teal-600"
            )}
          >
            {isSelected && <Check className="w-2.5 h-2.5 stroke-[4]" />}
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}
      </div>

      <div className="min-w-0 pr-4">
        <span className={cn(
          "text-sm font-bold truncate transition-colors tracking-tight text-slate-900 dark:text-white",
          isComp && "text-slate-400 line-through decoration-slate-300 dark:decoration-slate-700 font-medium"
        )}>
          {task.title}
        </span>
      </div>

      <div>
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
          task.priority === 'urgent' || task.priority === 'high' ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
          task.priority === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
          'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
        )}>
          {task.priority || 'Normal'}
        </span>
      </div>

      <div className="min-w-0">
        {task.projectId && projectMap[task.projectId] ? (
          <span className="text-xs font-semibold truncate leading-none text-slate-600 dark:text-slate-400">
            {projectMap[task.projectId].name}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 italic">No Project</span>
        )}
      </div>

      <div className={cn(
        "flex items-center gap-2 text-[13px] font-semibold",
        isComp ? "text-slate-400" : isOverdueTask ? "text-red-600" : "text-slate-600 dark:text-slate-400"
      )}>
        <Calendar className="w-3.5 h-3.5 opacity-60" />
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'No Date'}
      </div>

      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-white dark:border-slate-700">
           {task.ownerId === user?.id && user?.imageUrl ? (
             <img src={user.imageUrl} className="w-full h-full object-cover" />
           ) : (
             <UserIcon className="w-3 h-3 text-slate-400" />
           )}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 rounded-md"
          onClick={(e) => { e.stopPropagation(); onDelete(task); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function SortableTaskRow(props: SortableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: props.task.id,
    disabled: props.isSelectionMode
  } as any)
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className={cn("relative group border-b border-slate-100 dark:border-slate-800 last:border-b-0", isDragging ? "z-50 shadow-md" : "z-0")}>
      <TaskRowContent {...props} isDragging={isDragging} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function DroppableGroup({ id, children, className }: any) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={cn(className, isOver && "bg-teal-50/10 dark:bg-teal-900/10 border-teal-600/50")}>
      {children}
    </div>
  )
}

export function TaskListView({
  tasksByStatus,
  statusFilter,
  isSelectionMode,
  selectedTaskIds,
  projectMap,
  user,
  onEdit,
  onDelete,
  onToggleSelect,
  onSelectAll,
  onUpdateTask,
  onAddTask,
}: TaskListViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pages, setPages] = useState<Record<string, number>>({ 'open': 1, 'in-progress': 1, 'completed': 1 })
  const itemsPerPage = 10

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const taskId = String(active.id)
    const overId = String(over.id)
    let newStatus: string | undefined
    if (['open', 'in-progress', 'completed'].includes(overId)) newStatus = overId
    else newStatus = Object.values(tasksByStatus).flat().find(t => t.id === overId)?.status
    
    if (newStatus) {
      const task = Object.values(tasksByStatus).flat().find(t => t.id === taskId)
      if (task && task.status !== newStatus) {
        onUpdateTask(taskId, { status: newStatus as any, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined })
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={handleDragEnd}>
      <div className="space-y-6 pb-6 animate-in fade-in duration-500">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
          if (statusTasks.length === 0 && statusFilter !== 'all') return null
          
          const currentPage = pages[status] || 1
          const startIndex = (currentPage - 1) * itemsPerPage
          const visibleTasks = statusTasks.slice(startIndex, startIndex + itemsPerPage)
          const totalPages = Math.ceil(statusTasks.length / itemsPerPage)

          const isStatusSelected = visibleTasks.length > 0 && visibleTasks.every(t => selectedTaskIds.has(t.id))
          const hasPartialSelection = visibleTasks.some(t => selectedTaskIds.has(t.id)) && !isStatusSelected

          return (
            <div key={status} className="space-y-4">
              <div className={cn(
                "flex items-center justify-between px-6 py-3 rounded-md border shadow-xs transition-colors",
                status === 'in-progress' ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200/50" :
                status === 'completed' ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/50" :
                "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
              )}>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    status === 'in-progress' ? "text-amber-700 dark:text-amber-400" :
                    status === 'completed' ? "text-emerald-700 dark:text-emerald-400" :
                    "text-slate-500 dark:text-slate-400"
                  )}>
                    {status === 'open' ? 'To Do' : status === 'in-progress' ? 'In Progress' : 'Completed'}
                  </span>
                  <span className="text-[10px] font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 shadow-xs">
                    {statusTasks.length}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600 rounded-md transition-colors" onClick={() => onAddTask(status)}>
                  <PlusCircle className="w-4 h-4" />
                </Button>
              </div>

              <DroppableGroup id={status} className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col min-h-[100px] transition-all">
                <div className="grid grid-cols-[40px_50px_1fr_120px_160px_140px_140px_60px] items-center gap-4 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <div /><div className="flex justify-center">
                    <button onClick={(e) => onSelectAll(status, e)} className={cn("w-4 h-4 rounded-sm border transition-all flex items-center justify-center shadow-xs", isStatusSelected ? "bg-teal-600 border-teal-600 text-white" : hasPartialSelection ? "bg-white border-teal-600 text-teal-600" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950")}>
                      {isStatusSelected ? <Check className="w-2.5 h-2.5 stroke-[4]" /> : hasPartialSelection ? <div className="w-1.5 h-[2px] bg-teal-600 rounded-full" /> : null}
                    </button>
                  </div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Description</div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Group</div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Timeline</div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Owner</div>
                  <div />
                </div>
                <SortableContext items={visibleTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleTasks.length === 0 ? (
                      <div className="py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Collection Empty</div>
                    ) : (
                      visibleTasks.map((task) => (
                        <SortableTaskRow key={task.id} task={task} isSelectionMode={isSelectionMode} isSelected={selectedTaskIds.has(task.id)} projectMap={projectMap} user={user} onEdit={onEdit} onDelete={onDelete} onToggleSelect={onToggleSelect} />
                      ))
                    )}
                  </div>
                </SortableContext>
                
                {totalPages > 1 && (
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setPages(prev => ({ ...prev, [status]: p }))} totalItems={statusTasks.length} itemsPerPage={itemsPerPage} itemLabel="items" />
                  </div>
                )}
              </DroppableGroup>
            </div>
          )
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div className="w-full relative z-[9999]">
            <TaskRowContent task={Object.values(tasksByStatus).flat().find(t => t.id === activeId)} isOverlay={true} projectMap={projectMap} user={user} isSelectionMode={false} isSelected={selectedTaskIds.has(activeId)} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
