import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Filter,
  ChevronDown,
  Trash2,
  Check,
  Search,
  PlusCircle
} from "lucide-react"
import { DeleteModal } from "@/components/ui/delete-modal"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { cn } from "@/lib/utils"
import { isOverdue, sortTasks } from "@/lib/helpers"
import type { Task, Contact, Deal, Lead } from "@/lib/types"
import { AddTaskModal } from "@/components/crm/AddTaskModal"
import { EditTaskModal } from "@/components/crm/EditTaskModal"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@clerk/clerk-react"
import { PageSkeleton } from "@/components/ui/page-skeleton"

export function Tasks() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const {
    data: tasks,
    isLoaded: tasksLoaded,
    addItems,
    updateItem,
    deleteItem,
  } = useCRMResource<Task>('tasks')

  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: deals } = useCRMResource<Deal>('deals')
  const { data: leads } = useCRMResource<Lead>('leads')

  const isLoaded = clerkLoaded && tasksLoaded

  // UI State
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'upcoming'>('my')
  const [statusFilter] = useState<'all' | 'open' | 'in-progress' | 'completed'>('all')
  const [priorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Filtering & Sorting
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter
      const q = search.toLowerCase()
      const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      return matchesStatus && matchesPriority && matchesSearch
    })
    return sortTasks(result)
  }, [tasks, statusFilter, priorityFilter, search])

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTasks.slice(start, start + itemsPerPage)
  }, [filteredTasks, currentPage])

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)

  const handleToggleComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    const newStatus = task.status === 'completed' ? 'open' : 'completed'
    const statusText = newStatus === 'completed' ? 'completed' : 're-opened'

    toast.promise(
      updateItem(task.id, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
      }, true),
      {
        loading: 'Updating task status...',
        success: `Task marked as ${statusText}`,
        error: 'Failed to update task status'
      }
    )
  }

  const getEntityName = (task: Task) => {
    if (!task.entityType || !task.entityId) return null
    if (task.entityType === 'contact') return contacts.find(c => c.id === task.entityId)?.name
    if (task.entityType === 'deal') return deals.find(d => d.id === task.entityId)?.title
    if (task.entityType === 'lead') return leads.find(l => l.id === task.entityId)?.name
    return null
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high': return { bg: 'bg-red-50 text-red-600', dot: 'bg-red-500', label: 'HIGH' }
      case 'medium': return { bg: 'bg-yellow-50 text-yellow-600', dot: 'bg-yellow-400', label: 'MEDIUM' }
      case 'low': return { bg: 'bg-green-50 text-green-600', dot: 'bg-green-500', label: 'LOW' }
      default: return { bg: 'bg-slate-50 text-slate-600', dot: 'bg-slate-400', label: 'NORMAL' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'bg-green-100 text-green-700', label: 'COMPLETED' }
      case 'in-progress': return { bg: 'bg-blue-100 text-blue-700', label: 'IN PROGRESS' }
      case 'open':
      default: return { bg: 'bg-slate-100 text-slate-600', label: 'TO DO' }
    }
  }

  if (!isLoaded) {
    return <PageSkeleton />
  }

  return (
    <div className="flex-1 bg-bg-base text-text-primary min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">Work Management</p>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">Tasks</h1>
            <p className="text-text-muted mt-1 font-medium">Manage, prioritize and track your team's workload.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button variant="default" onClick={() => setShowAddModal(true)}>
              <PlusCircle className="w-4 h-4" /> Create Task
            </Button>
          </div>
        </div>

        {/* Unified Search & Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('my')}
              className={cn(
                "pb-4 font-bold text-sm tracking-wide transition-colors relative flex items-center gap-2 shrink-0",
                activeTab === 'my' ? "text-accent" : "text-text-secondary hover:text-text-primary"
              )}
            >
              My Tasks
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                activeTab === 'my' ? "bg-accent-dim text-accent" : "bg-bg-elevated text-text-muted"
              )}>
                {tasks.length}
              </span>
              {activeTab === 'my' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={cn(
                "pb-4 font-bold text-sm tracking-wide transition-colors relative shrink-0",
                activeTab === 'team' ? "text-accent" : "text-text-secondary hover:text-text-primary"
              )}
            >
              Team Tasks
              {activeTab === 'team' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                "pb-4 font-bold text-sm tracking-wide transition-colors relative shrink-0",
                activeTab === 'upcoming' ? "text-accent" : "text-text-secondary hover:text-text-primary"
              )}
            >
              Upcoming
              {activeTab === 'upcoming' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent rounded-t-full" />}
            </button>
          </div>

          <div className="flex-1 w-full lg:max-w-xl pb-4 lg:pb-3">
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within/search:text-indigo-600 transition-colors" />
              <input
                placeholder="Search tasks, priorities, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 bg-bg-surface border-border rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/50 placeholder:text-text-muted outline-none transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Inline Filters */}
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary">Status: All</span>
            <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />
          </div>
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary">Priority: All</span>
            <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />
          </div>
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary">Due: This Week</span>
            <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-bg-surface rounded-md border border-border shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-[auto_1fr_120px_140px_160px_120px_40px] items-center gap-4 px-4 py-2.5 border-b border-border bg-bg-elevated/50">
            <div className="w-6"></div> {/* Checkbox placeholder */}
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-tight">Task Name</div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-tight">Priority</div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-tight">Status</div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-tight">Assigned To</div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-tight">Due Date</div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-tight text-right">Actions</div>
          </div>

          {/* Task Rows */}
          <div className="divide-y border-border">
            {paginatedTasks.length === 0 ? (
              <div className="p-8 text-center text-text-muted font-medium">No tasks found.</div>
            ) : (
              paginatedTasks.map((task) => {
                const isComp = task.status === 'completed'
                const isOverdueTask = isOverdue(task) && !isComp
                const pConf = getPriorityConfig(task.priority)
                const sConf = getStatusConfig(task.status)
                const entityName = getEntityName(task)

                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-[auto_1fr_120px_140px_160px_120px_40px] items-center gap-4 px-4 py-3 hover:bg-bg-surface transition-all group cursor-pointer border-l-4 border-transparent hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-600/5 relative z-0 hover:z-10"
                    onClick={() => setEditingTask(task)}
                  >
                    {/* Checkbox */}
                    <div className="w-6 py-1">
                      <button
                        onClick={(e) => handleToggleComplete(e, task)}
                        className={cn(
                          "w-5 h-5 rounded-sm flex items-center justify-center transition-all shadow-sm",
                          isComp
                            ? "bg-green border-green text-white"
                            : "border border-border bg-bg-surface hover:border-accent"
                        )}
                      >
                        {isComp && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </div>

                    {/* Task Name */}
                    <div className="flex flex-col pr-4 min-w-0">
                      <span className={cn(
                        "text-[13px] font-bold truncate transition-colors",
                        isComp ? "text-text-muted line-through" : "text-text-primary"
                      )}>
                        {task.title}
                      </span>
                      {entityName && !isComp && (
                        <span className="text-[11px] text-text-muted truncate mt-0.5">
                          {task.entityType}: {entityName}
                        </span>
                      )}
                    </div>

                    {/* Priority */}
                    <div>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest bg-bg-elevated/50",
                        pConf.bg && (
                          pConf.bg.includes('red') ? 'text-red' :
                            pConf.bg.includes('yellow') ? 'text-amber' :
                              pConf.bg.includes('green') ? 'text-green' : 'text-text-secondary'
                        )
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", pConf.dot && (pConf.bg.includes('yellow') ? 'bg-amber' : pConf.bg.includes('red') ? 'bg-red' : pConf.bg.includes('green') ? 'bg-green' : 'bg-text-muted'))} />
                        {pConf.label}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={cn(
                        "inline-flex px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest",
                        sConf.bg && (
                          sConf.bg.includes('green') ? 'bg-green/10 text-green' :
                            sConf.bg.includes('blue') ? 'bg-accent/10 text-accent' : 'bg-bg-elevated text-text-secondary'
                        )
                      )}>
                        {sConf.label}
                      </span>
                    </div>

                    {/* Assigned To */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-amber/10 flex items-center justify-center ring-1 ring-bg-surface shrink-0 overflow-hidden shadow-sm">
                        {user?.imageUrl ? (
                          <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] font-black text-amber">ME</span>
                        )}
                      </div>
                      <span className="text-[13px] font-semibold text-text-secondary truncate">
                        {user?.firstName || "Me"}
                      </span>
                    </div>

                    {/* Due Date */}
                    <div className={cn(
                      "text-[13px] font-medium truncate",
                      isComp ? "text-text-muted italic" : (isOverdueTask ? "text-red font-bold" : "text-text-muted")
                    )}>
                      {isComp ? "Completed" : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-text-muted hover:text-red transition-all"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingDelete(task)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredTasks.length}
            itemsPerPage={itemsPerPage}
            itemLabel="tasks"
          />
        </div>
      </div>

      <AddTaskModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={(task) => addItems([task])}
        userId={user?.id ?? ""}
      />

      <EditTaskModal
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onUpdate={updateItem}
        onDelete={deleteItem}
        userId={user?.id ?? ""}
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
