import { useState, useMemo } from "react"
import {
  Search,
  PlusCircle,
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
import { TaskListView } from "@/components/crmComponent/TaskListView"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@clerk/clerk-react"
import { PageSkeleton } from "@/components/ui/page-skeleton"

interface TaskViewProps {
  fixedProjectId?: string;
  fixedEntityType?: 'contact' | 'deal' | 'lead';
  fixedEntityId?: string;
  hideHeader?: boolean;
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
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)

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
    const today = new Date(); today.setHours(0,0,0,0)
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

  // Pagination is now managed per status group inside TaskListView
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = { 'open': [], 'in-progress': [], 'completed': [] }
    filteredTasks.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t) })
    return grouped
  }, [filteredTasks])

  const toggleSelectTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const next = new Set(selectedTaskIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedTaskIds(next)
    setShowBulkActions(next.size > 0)
    setIsSelectionMode(next.size > 0)
  }

  const selectTasksByStatus = (status: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const targetTasks = tasksByStatus[status] || []
    if (targetTasks.length === 0) return
    const allSelected = targetTasks.every(t => selectedTaskIds.has(t.id))
    const next = new Set(selectedTaskIds)
    if (allSelected) targetTasks.forEach(t => next.delete(t.id))
    else targetTasks.forEach(t => next.add(t.id))
    setSelectedTaskIds(next)
    setShowBulkActions(next.size > 0)
    setIsSelectionMode(next.size > 0)
  }

  const clearSelection = () => {
    setSelectedTaskIds(new Set()); setShowBulkActions(false); setIsSelectionMode(false);
  }

  useTaskShortcuts({
    onNewTask: () => setShowAddModal(true),
    onViewToggle: () => setActiveTab(activeTab === 'list' ? 'kanban' : 'list'),
  })

  if (!isLoaded) return <PageSkeleton />

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className={cn("mx-auto animate-fade-in space-y-8", !hideHeader ? "p-4 md:p-8" : "p-0")}>
        
        {!hideHeader && (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">CRM — TASK MANAGEMENT</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed italic">Coordination simplified for teams.</p>
            </div>
            <button className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center gap-2" onClick={() => setShowAddModal(true)}>
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

        {showBulkActions && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-md p-4 animate-fade-in shadow-sm flex items-center justify-between">
            <span className="text-sm font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">{selectedTaskIds.size} SELECTED</span>
            <div className="flex items-center gap-2">
                <button onClick={() => Array.from(selectedTaskIds).forEach(id => updateItem(id, { status: 'completed' }))} className="h-8 px-4 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-md">Complete</button>
                <button onClick={() => Array.from(selectedTaskIds).forEach(id => deleteItem(id))} className="h-8 px-4 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded-md">Delete</button>
                <button onClick={clearSelection} className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
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
                  <Button onClick={() => setShowAddModal(true)} className="rounded-xl h-11 px-8 bg-teal-600 hover:bg-teal-700 text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">Create Task</Button>
               </div>
            </div>
          ) : activeTab === 'list' ? (
            <div className="space-y-12 pb-20 animate-in fade-in duration-500">
              <TaskListView
                tasksByStatus={tasksByStatus}
                statusFilter={statusFilter}
                isSelectionMode={isSelectionMode}
                selectedTaskIds={selectedTaskIds}
                projectMap={projectMap}
                user={user}
                onEdit={setEditingTask}
                onDelete={setPendingDelete}
                onToggleSelect={toggleSelectTask}
                onSelectAll={selectTasksByStatus}
                onUpdateTask={updateItem}
                onAddTask={() => setShowAddModal(true)}
              />
            </div>
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
