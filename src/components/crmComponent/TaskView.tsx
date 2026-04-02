import React, { useState, useMemo } from "react"
import {
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  GripVertical,
  Check,
} from "lucide-react"
import { DeleteModal } from "@/components/ui/delete-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { sortTasks } from "@/lib/helpers"
import { useTaskShortcuts } from "@/lib/hooks/useTaskShortcuts"
import type { Task, Project, TaskTag, TaskTagLink } from "@/lib/types"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"
import { EditTaskModal } from "@/components/crmComponent/EditTaskModal"
import { KanbanBoard } from "@/components/crmComponent/KanbanBoard"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@clerk/clerk-react"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DataTable, type Column } from "@/components/reusables/DataTable"
import { getPriorityStyles, getStatusStyles, type TaskStatus } from "../../lib/task-utils"
import { formatRelative } from "date-fns"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TaskViewProps {
  fixedProjectId?: string;
  fixedEntityType?: 'contact' | 'deal' | 'lead';
  fixedEntityId?: string;
  hideHeader?: boolean;
}

function SortableRow({ item, children, onClick, className }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <tr ref={setNodeRef} style={style} className={cn(className, isDragging && "opacity-50 z-50 shadow-2xl relative bg-teal-50 dark:bg-teal-900/10")} onClick={onClick}>
      {React.Children.map(children, (child: any) => {
        if (child && child.props && child.props.className?.includes('drag-handle-cell')) {
          return React.cloneElement(child, {
            children: (
              <div {...attributes} {...listeners} className="flex justify-center text-slate-300 hover:text-teal-600 cursor-grab p-1" onClick={(e) => e.stopPropagation()}>
                <GripVertical className="w-4 h-4" />
              </div>
            )
          })
        }
        return child
      })}
    </tr>
  )
}

export function TaskView({ fixedProjectId, fixedEntityType, fixedEntityId, hideHeader = false }: TaskViewProps) {
  const { user, isLoaded: clerkLoaded } = useUser()
  const {
    data: tasks,
    isLoaded: tasksLoaded,
    addItems,
    updateItem,
    deleteItem,
  } = useCRMResource<Task>('tasks')

  const { data: allTags } = useCRMResource<TaskTag>('task_tags')
  const { data: tagLinks } = useCRMResource<TaskTagLink>('task_tag_links')
  const { data: projects } = useCRMResource<Project>('projects')

  const isLoaded = clerkLoaded && tasksLoaded

  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<'list' | 'kanban'>('list')
  const [activeFilter, setActiveFilter] = useState<'my' | 'team' | 'upcoming'>('my')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'completed'>('all')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const projectMap = useMemo(() => {
    const map: Record<string, Project> = {}
    projects?.forEach(p => map[p.id] = p)
    return map
  }, [projects])

  const taskTagsMap = useMemo(() => {
    const map: Record<string, TaskTag[]> = {}
    tagLinks?.forEach(link => {
      const tag = allTags?.find(t => t.id === link.tagId)
      if (tag) {
        if (!map[link.taskId]) map[link.taskId] = []
        map[link.taskId].push(tag)
      }
    })
    return map
  }, [allTags, tagLinks])

  const filteredTasks = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let result = (tasks ?? []).filter(t => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesProject = fixedProjectId ? t.projectId === fixedProjectId : true
      const matchesEntity = (fixedEntityType && fixedEntityId) ? (t.entityType === fixedEntityType && t.entityId === fixedEntityId) : true

      const q = search.toLowerCase()
      const taskTags = taskTagsMap[t.id] || []
      const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || taskTags.some(tag => tag.name.toLowerCase().includes(q))

      let matchesFilter = true;
      if (activeFilter === 'my') matchesFilter = t.ownerId === user?.id
      else if (activeFilter === 'team') matchesFilter = t.ownerId !== user?.id
      else if (activeFilter === 'upcoming') matchesFilter = new Date(t.dueDate) >= today && t.status !== 'completed'

      return matchesStatus && matchesProject && matchesEntity && matchesSearch && matchesFilter
    })
    return sortTasks(result)
  }, [tasks, statusFilter, search, activeFilter, user?.id, fixedProjectId, fixedEntityType, fixedEntityId, taskTagsMap])

  const statusOrder: TaskStatus[] = ['open', 'in-progress', 'completed']

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { 'open': [], 'in-progress': [], 'completed': [] }
    filteredTasks.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t) })
    return grouped
  }, [filteredTasks])

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveDragId(null)
    if (!over) return

    const taskId = String(active.id)
    const overId = String(over.id)

    let newStatus: TaskStatus | undefined
    if (statusOrder.includes(overId as any)) {
      newStatus = overId as TaskStatus
    } else {
      newStatus = (tasks ?? []).find(t => t.id === overId)?.status
    }

    if (newStatus) {
      const task = (tasks ?? []).find(t => t.id === taskId)
      if (task && task.status !== newStatus) {
        updateItem(taskId, { status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined })
      }
    }
  }

  const columns: Column<Task>[] = [
    {
      header: "",
      headerClassName: "w-[40px] drag-handle-cell",
      className: "drag-handle-cell",
      render: () => null // Handled by RowComponent
    },
    {
      header: (status: any) => {
        const groupTasks = tasksByStatus[status as TaskStatus] || []
        const isAllSelected = groupTasks.length > 0 && groupTasks.every(t => selectedTaskIds.has(t.id))
        const isPartial = groupTasks.some(t => selectedTaskIds.has(t.id)) && !isAllSelected

        return (
          <div className="flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const next = new Set(selectedTaskIds)
                if (isAllSelected) groupTasks.forEach(t => next.delete(t.id))
                else groupTasks.forEach(t => next.add(t.id))
                setSelectedTaskIds(next)
              }}
              className={cn(
                "w-4 h-4 rounded border transition-all flex items-center justify-center",
                isAllSelected ? "bg-teal-600 border-teal-600 text-white" : isPartial ? "border-teal-600 text-teal-600" : "border-slate-300 dark:border-slate-700 hover:border-teal-600"
              )}
            >
              {isAllSelected ? <Check className="w-2.5 h-2.5 stroke-[4]" /> : isPartial ? <div className="w-1.5 h-[2px] bg-teal-600 rounded-full" /> : null}
            </button>
          </div>
        )
      },
      headerClassName: "w-[50px]",
      render: (task) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={selectedTaskIds.has(task.id)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => {
              const next = new Set(selectedTaskIds)
              if (next.has(task.id)) next.delete(task.id)
              else next.add(task.id)
              setSelectedTaskIds(next)
            }}
            className={cn(
              "rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer transition-opacity",
              selectedTaskIds.has(task.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          />
        </div>
      )
    },
    {
      header: "Task Title",
      render: (task) => (
        <div className="flex flex-col">
          <span className={cn("text-sm font-bold text-slate-900 dark:text-white line-clamp-1", task.status === 'completed' && "line-through text-slate-400 font-medium")}>{task.title}</span>
          {task.description && <span className="text-[10px] text-slate-400 font-medium line-clamp-1 italic">{task.description}</span>}
        </div>
      )
    },
    {
      header: "Priority",
      render: (task) => {
        const p = getPriorityStyles(task.priority)
        return (
          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", p.bg, p.color, p.border)}>
            <p.icon className="w-3 h-3" />
            {p.label}
          </div>
        )
      }
    },
    ...(!fixedProjectId ? [{
      header: "Project",
      render: (task: Task) => (
        <span className="text-[11px] font-bold text-slate-500 truncate max-w-[120px] block">
          {task.projectId ? projectMap[task.projectId]?.name || 'Unknown' : '—'}
        </span>
      )
    }] : []),
    {
      header: "Due Date",
      render: (task) => {
        const date = new Date(task.dueDate)
        const isOverdue = date < new Date() && task.status !== 'completed'
        return (
          <span className={cn("text-[11px] font-bold", isOverdue ? "text-red-500" : "text-slate-500")}>
            {formatRelative(date, new Date(), { weekStartsOn: 1 })}
          </span>
        )
      }
    },
    {
      header: "",
      align: 'right',
      render: (task) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600" onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setPendingDelete(task); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ]

  useTaskShortcuts({
    onNewTask: () => setShowAddModal(true),
    onViewToggle: () => setActiveTab(activeTab === 'list' ? 'kanban' : 'list'),
  })

  if (!isLoaded) return <PageSkeleton />

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className={cn("mx-auto animate-fade-in space-y-6", !hideHeader ? "p-4 md:p-8" : "p-0")}>

        {!hideHeader && (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">CRM — TASK MANAGEMENT</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed italic">Coordination simplified for teams.</p>
            </div>
            <button className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2" onClick={() => setShowAddModal(true)}>
              <PlusCircle className="w-4 h-4" /> Create Record
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-12">
            {[
              { id: 'list', label: 'All Tasks' },
              { id: 'kanban', label: 'Kanban Board' },
            ].map((t) => {
              const isActive = activeTab === t.id
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={cn("pb-4 font-bold text-sm tracking-wide transition-all relative px-1 hover:text-slate-900", isActive ? "text-teal-600" : "text-slate-500")}>
                  <span className="uppercase text-[11px] tracking-[0.1em] font-black">{t.label}</span>
                  {isActive && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-teal-600 rounded-t-full shadow-[0_0_12px_rgba(20,184,166,0.6)]" />}
                </button>
              )
            })}
          </div>

          <div className="flex-1 w-full lg:max-w-md pb-3">
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-teal-600 transition-colors" />
              <input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all shadow-xs" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-md border border-slate-200 dark:border-slate-800 h-9">
              {[
                { id: 'my', label: 'My Work' },
                { id: 'team', label: 'Teams' },
                { id: 'upcoming', label: 'Upcoming' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={cn(
                    "px-4 h-7 text-[10px] font-black uppercase tracking-widest rounded transition-all",
                    activeFilter === f.id ? "bg-white text-teal-600 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-800" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: 'All Stages' },
                { id: 'open', label: 'To Do' },
                { id: 'in-progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                    statusFilter === s.id ? "bg-teal-600 border-teal-600 text-white shadow-sm" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500 hover:text-teal-600"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredTasks.length} RECORDS FOUND</span>
          </div>
        </div>

        {selectedTaskIds.size > 0 && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-md p-3 animate-fade-in shadow-sm flex items-center justify-between">
            <span className="text-sm font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">{selectedTaskIds.size} SELECTED</span>
            <div className="flex items-center gap-2">
              <button onClick={() => { Array.from(selectedTaskIds).forEach(id => updateItem(id, { status: 'completed' })); setSelectedTaskIds(new Set()); }} className="h-8 px-4 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-md hover:bg-slate-50">Complete</button>
              <button onClick={() => { Array.from(selectedTaskIds).forEach(id => deleteItem(id)); setSelectedTaskIds(new Set()); }} className="h-8 px-4 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded-md hover:bg-red-700">Delete Items</button>
              <button onClick={() => setSelectedTaskIds(new Set())} className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
          </div>
        )}

        <div className="min-h-[500px]">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 px-8 text-center max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-[0.1em]">No Results Found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10 font-medium leading-relaxed">Try adjusting filters to expand your search context.</p>
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); setActiveFilter("my"); }} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900">Reset Workspace</Button>
                <Button onClick={() => setShowAddModal(true)} className="rounded-xl h-11 px-8 bg-teal-600 hover:bg-teal-700 text-xs font-black uppercase tracking-widest">Create Task</Button>
              </div>
            </div>
          ) : activeTab === 'list' ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveDragId(String(e.active.id))} onDragEnd={handleDragEnd}>
              <div className="space-y-12 pb-20 animate-in fade-in duration-500">
                {statusOrder.map(status => {
                  const groupTasks = tasksByStatus[status] || []
                  if (groupTasks.length === 0 && statusFilter !== 'all') return null
                  if (statusFilter !== 'all' && statusFilter !== status) return null

                  const s = getStatusStyles(status)
                  return (
                    <div key={status} className="space-y-4">
                      <div className={cn(
                        "flex items-center justify-between px-6 py-3 rounded-xl border transition-all",
                        s.bg, s.border
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-sm border", s.border)}>
                            <s.icon className={cn("w-3.5 h-3.5", s.color)} />
                          </div>
                          <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", s.color)}>
                            {s.label}
                          </span>
                          <span className="text-[9px] font-bold bg-white/50 dark:bg-slate-950/50 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800/50 text-slate-500">
                            {groupTasks.length} Records
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-8 w-8 rounded-lg hover:bg-white/80 dark:hover:bg-slate-900/80", s.color)}
                          onClick={() => setShowAddModal(true)}
                        >
                          <PlusCircle className="w-4 h-4" />
                        </Button>
                      </div>

                      <DataTable
                        data={groupTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                        columns={columns.map(col => {
                          if (typeof col.header === 'function') {
                            return { ...col, header: col.header(status) }
                          }
                          return col
                        })}
                        onRowClick={(task) => setEditingTask(task)}
                        BodyComponent={({ children }) => (
                          <SortableContext items={groupTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                            {children}
                          </SortableContext>
                        )}
                        RowComponent={SortableRow}
                        pagination={{
                          currentPage: statusFilter === 'all' ? 1 : currentPage,
                          totalPages: Math.ceil(groupTasks.length / itemsPerPage),
                          onPageChange: setCurrentPage,
                          totalItems: groupTasks.length,
                          itemsPerPage,
                          itemLabel: 'tasks'
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <DragOverlay dropAnimation={null}>
                {activeDragId ? (
                  <div className="w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-md p-4 flex items-center gap-4 opacity-100 scale-[1.02]">
                    <GripVertical className="w-4 h-4 text-slate-300" />
                    <span className="text-sm font-bold">{(tasks ?? []).find(t => t.id === activeDragId)?.title}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="animate-in fade-in duration-500">
              <KanbanBoard tasks={filteredTasks} onUpdate={updateItem} onEdit={setEditingTask} tagsMap={taskTagsMap} onAddTask={() => setShowAddModal(true)} />
            </div>
          )}
        </div>
      </div>

      <AddTaskModal open={showAddModal} onOpenChange={setShowAddModal} fixedProjectId={fixedProjectId} onSave={(task) => addItems([{ ...task, projectId: fixedProjectId || task.projectId }])} userId={user?.id ?? ""} />
      <EditTaskModal task={editingTask} open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)} onUpdate={updateItem} onDelete={deleteItem} user={user} />
      <DeleteModal open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)} title="Delete Task" description={<p>Action cannot be undone.</p>} onDelete={() => { if (pendingDelete) deleteItem(pendingDelete.id); setPendingDelete(null); }} />
    </div>
  )
}
