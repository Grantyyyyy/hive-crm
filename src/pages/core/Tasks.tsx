import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Filter,
  ChevronDown,
  ChevronRight,
  Trash2,
  Check,
  Search,
  PlusCircle,
  Repeat2,
  LayoutGrid,
  LayoutList,
  MessageSquare,
} from "lucide-react"
import { DeleteModal } from "@/components/ui/delete-modal"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { CommentsList } from "@/components/crmComponent/CommentsList"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { cn } from "@/lib/utils"
import { isOverdue, sortTasks } from "@/lib/helpers"
import { useTaskShortcuts } from "@/lib/hooks/useTaskShortcuts"
import type { Task, Contact, Deal, Lead, Project, TaskTag, TaskTagLink } from "@/lib/types"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"
import { EditTaskModal } from "@/components/crmComponent/EditTaskModal"
import { KanbanBoard } from "@/components/crmComponent/KanbanBoard"
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
  const { data: projects } = useCRMResource<Project>('projects')
  const { data: allTags } = useCRMResource<TaskTag>('task_tags')
  const { data: tagLinks } = useCRMResource<TaskTagLink>('task_tag_links')

  const isLoaded = clerkLoaded && tasksLoaded

  // UI State
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'upcoming'>('my')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const [deleteAllOccurrences, setDeleteAllOccurrences] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set())
  const itemsPerPage = 12

  const toggleExpand = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    const next = new Set(expandedTaskIds)
    if (next.has(taskId)) next.delete(taskId)
    else next.add(taskId)
    setExpandedTaskIds(next)
  }

  // Project lookup map for quick access
  const projectMap = useMemo(() => {
    const map: Record<string, Project> = {}
    projects?.forEach(p => map[p.id] = p)
    return map
  }, [projects])

  // Map of tags per task
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

  // Filtering & Sorting
  const filteredTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let result = tasks.filter(t => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter
      const matchesProject = projectFilter === 'all' || t.projectId === projectFilter
      const q = search.toLowerCase()
      const taskTags = taskTagsMap[t.id] || []
      const tagMatch = taskTags.some(tag => tag.name.toLowerCase().includes(q))
      const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || tagMatch

      // Tab filtering
      let matchesTab = true
      if (activeTab === 'my') {
        matchesTab = t.ownerId === user?.id
      } else if (activeTab === 'team') {
        matchesTab = t.ownerId !== user?.id
      } else if (activeTab === 'upcoming') {
        const dueDate = new Date(t.dueDate)
        matchesTab = dueDate >= today && t.status !== 'completed'
      }

      return matchesStatus && matchesPriority && matchesProject && matchesSearch && matchesTab
    })
    return sortTasks(result)
  }, [tasks, statusFilter, priorityFilter, projectFilter, search, activeTab, user?.id])

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTasks.slice(start, start + itemsPerPage)
  }, [filteredTasks, currentPage])

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)

  // Calculate tab counts
  const myTasksCount = useMemo(() => {
    return tasks.filter(t => t.ownerId === user?.id).length
  }, [tasks, user?.id])

  const teamTasksCount = useMemo(() => {
    return tasks.filter(t => t.ownerId !== user?.id).length
  }, [tasks, user?.id])

  const upcomingTasksCount = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks.filter(t => {
      const dueDate = new Date(t.dueDate)
      return dueDate >= today && t.status !== 'completed'
    }).length
  }, [tasks])

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

  // Bulk Selection Handlers
  const toggleSelectTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    const newSelected = new Set(selectedTaskIds)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTaskIds(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const selectAllPage = (e: React.MouseEvent) => {
    e.stopPropagation()
    const allSelected = paginatedTasks.every(t => selectedTaskIds.has(t.id))
    const newSelected = new Set(selectedTaskIds)

    if (allSelected) {
      // Deselect all on current page
      paginatedTasks.forEach(task => newSelected.delete(task.id))
    } else {
      // Select all on current page
      paginatedTasks.forEach(task => newSelected.add(task.id))
    }

    setSelectedTaskIds(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const clearSelection = () => {
    setSelectedTaskIds(new Set())
    setShowBulkActions(false)
  }

  // Bulk Actions
  const bulkComplete = () => {
    if (selectedTaskIds.size === 0) return

    toast.promise(
      Promise.all(
        Array.from(selectedTaskIds).map(id =>
          updateItem(id, {
            status: 'completed',
            completedAt: new Date().toISOString()
          }, true)
        )
      ),
      {
        loading: 'Completing tasks...',
        success: `Marked ${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? 's' : ''} as completed`,
        error: 'Failed to complete tasks'
      }
    )
    clearSelection()
  }

  const bulkReopen = () => {
    if (selectedTaskIds.size === 0) return

    toast.promise(
      Promise.all(
        Array.from(selectedTaskIds).map(id =>
          updateItem(id, {
            status: 'open',
            completedAt: undefined
          }, true)
        )
      ),
      {
        loading: 'Re-opening tasks...',
        success: `Re-opened ${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? 's' : ''}`,
        error: 'Failed to re-open tasks'
      }
    )
    clearSelection()
  }

  const bulkDelete = () => {
    if (selectedTaskIds.size === 0) return

    toast.promise(
      Promise.all(
        Array.from(selectedTaskIds).map(id => deleteItem(id))
      ),
      {
        loading: 'Deleting tasks...',
        success: `Deleted ${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? 's' : ''}`,
        error: 'Failed to delete tasks'
      }
    )
    clearSelection()
  }

  const bulkChangeStatus = (newStatus: Task['status']) => {
    if (selectedTaskIds.size === 0) return

    toast.promise(
      Promise.all(
        Array.from(selectedTaskIds).map(id =>
          updateItem(id, {
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
          }, true)
        )
      ),
      {
        loading: 'Updating tasks...',
        success: `Updated ${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? 's' : ''}`,
        error: 'Failed to update tasks'
      }
    )
    clearSelection()
  }

  const bulkChangePriority = (newPriority: Task['priority']) => {
    if (selectedTaskIds.size === 0) return

    toast.promise(
      Promise.all(
        Array.from(selectedTaskIds).map(id =>
          updateItem(id, { priority: newPriority }, true)
        )
      ),
      {
        loading: 'Updating priority...',
        success: `Updated priority for ${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? 's' : ''}`,
        error: 'Failed to update priority'
      }
    )
    clearSelection()
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

  // Keyboard shortcuts
  useTaskShortcuts({
    onNewTask: () => setShowAddModal(true),
    onSearch: () => (document.querySelector('input[placeholder*="Search tasks"]') as HTMLInputElement)?.focus(),
    onCompleteSelected: () => selectedTaskIds.size > 0 && bulkComplete(),
    onDeleteSelected: () => selectedTaskIds.size > 0 && bulkDelete(),
    onViewToggle: () => setViewMode(viewMode === 'table' ? 'kanban' : 'table'),
  })

  if (!isLoaded) {
    return <PageSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">Work Management</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage, prioritize and track your team's workload.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-1">
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
            <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none" onClick={() => setShowAddModal(true)}>
              <PlusCircle className="w-4 h-4" /> Create Task
            </Button>
          </div>
        </div>

        {/* Unified Search & Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('my')}
              className={cn(
                "pb-4 font-bold text-sm tracking-wide transition-colors relative flex items-center gap-2 shrink-0",
                activeTab === 'my' ? "text-teal-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              My Tasks
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                activeTab === 'my' ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                {myTasksCount}
              </span>
              {activeTab === 'my' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={cn(
                "pb-4 font-bold text-sm tracking-wide transition-colors relative flex items-center gap-2 shrink-0",
                activeTab === 'team' ? "text-teal-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              Team Tasks
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                activeTab === 'team' ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                {teamTasksCount}
              </span>
              {activeTab === 'team' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                "pb-4 font-bold text-sm tracking-wide transition-colors relative flex items-center gap-2 shrink-0",
                activeTab === 'upcoming' ? "text-teal-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              Upcoming
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                activeTab === 'upcoming' ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                {upcomingTasksCount}
              </span>
              {activeTab === 'upcoming' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />}
            </button>
          </div>

          <div className="flex-1 w-full lg:max-w-xl pb-4 lg:pb-3">
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-teal-600 transition-colors" />
              <input
                placeholder="Search tasks, priorities, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Inline Filters */}
        <div className="flex items-center gap-6 mt-6">
          {/* Status Filter */}
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:hover:text-white">
              Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="open">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:hover:text-white">
              Priority: {priorityFilter === 'all' ? 'All' : priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:hover:text-white">
              Project: {projectFilter === 'all' ? 'All' : projectMap[projectFilter]?.name || 'All'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {showBulkActions && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-md p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-teal-700 dark:text-teal-400">
                  {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs">
                  Clear selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={bulkComplete} className="h-8 text-xs border-slate-200 dark:border-slate-800">
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Complete
                </Button>
                <Button variant="outline" size="sm" onClick={bulkReopen} className="h-8 text-xs border-slate-200 dark:border-slate-800">
                  Re-open
                </Button>
                <div className="relative group">
                  <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 dark:border-slate-800">
                    Status <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Button>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 min-w-[140px] hidden group-hover:block">
                    <button onClick={() => bulkChangeStatus('open')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 first:rounded-t-md text-slate-700 dark:text-slate-300">To Do</button>
                    <button onClick={() => bulkChangeStatus('in-progress')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">In Progress</button>
                    <button onClick={() => bulkChangeStatus('completed')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 last:rounded-b-md text-slate-700 dark:text-slate-300">Completed</button>
                  </div>
                </div>
                <div className="relative group">
                  <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 dark:border-slate-800">
                    Priority <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Button>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 min-w-[120px] hidden group-hover:block">
                    <button onClick={() => bulkChangePriority('urgent')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 first:rounded-t-md text-red-600">Urgent</button>
                    <button onClick={() => bulkChangePriority('high')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-red-600">High</button>
                    <button onClick={() => bulkChangePriority('medium')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-600">Medium</button>
                    <button onClick={() => bulkChangePriority('low')} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 last:rounded-b-md text-green-600">Low</button>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={bulkDelete} className="h-8 text-xs">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[50px_1fr_100px_140px_160px_140px_80px] items-center gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 group/header">
              <div className="flex items-center justify-center">
                <button
                  onClick={paginatedTasks.length > 0 ? selectAllPage : undefined}
                  className={cn(
                    "w-5 h-5 rounded-sm flex items-center justify-center transition-all shadow-sm border",
                    paginatedTasks.length > 0 && paginatedTasks.every(t => selectedTaskIds.has(t.id))
                      ? "bg-teal-600 border-teal-600 text-white opacity-100"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-600 opacity-0 group-hover/header:opacity-100"
                  )}
                  title={paginatedTasks.length > 0 ? "Select all on page" : "No tasks"}
                >
                  {paginatedTasks.length > 0 && paginatedTasks.every(t => selectedTaskIds.has(t.id)) && (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </button>
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Task Name</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Priority</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Status</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Project</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Assigned To</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight text-center">Actions</div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No tasks found.</div>
              ) : (
                paginatedTasks.map((task) => {
                  const isComp = task.status === 'completed'
                  const isOverdueTask = isOverdue(task) && !isComp
                  const pConf = getPriorityConfig(task.priority)
                  const sConf = getStatusConfig(task.status)
                  const entityName = getEntityName(task)

                  return (
                    <div key={task.id} className="contents group">
                      <div
                        className={cn(
                          "grid grid-cols-[50px_1fr_100px_140px_160px_140px_80px] items-center gap-4 px-6 py-4 transition-all cursor-pointer border-l-4 border-transparent hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 hover:shadow-lg hover:shadow-teal-600/5 relative z-0 hover:z-10",
                          selectedTaskIds.has(task.id) && "bg-teal-50 dark:bg-teal-900/10 border-teal-600 shadow-md",
                          expandedTaskIds.has(task.id) && "bg-teal-50 dark:bg-teal-900/10 border-teal-600 shadow-md"
                        )}
                        onClick={() => setEditingTask(task)}
                      >
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => toggleSelectTask(e, task.id)}
                            className={cn(
                              "w-5 h-5 rounded-sm flex items-center justify-center transition-all shadow-sm border",
                              selectedTaskIds.has(task.id)
                                ? "bg-teal-600 border-teal-600 text-white opacity-100"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-600 opacity-0 group-hover:opacity-100"
                            )}
                          >
                            {selectedTaskIds.has(task.id) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                        </div>

                        {/* Task Name */}
                        <div className="flex flex-col pr-4 min-w-0">
                          <div className="flex items-center gap-2">
                            {task.subtasks && task.subtasks.length > 0 && (
                              <button
                                onClick={(e) => toggleExpand(e, task.id)}
                                className={cn(
                                  "p-0.5 rounded transition-all",
                                  expandedTaskIds.has(task.id) ? "text-teal-600 bg-teal-50 dark:bg-teal-900/20" : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                {expandedTaskIds.has(task.id) ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <span className={cn(
                              "text-[13px] font-bold truncate transition-colors",
                              isComp ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-900 dark:text-white"
                            )}>
                              {task.title}
                            </span>
                            {task.comments && task.comments.length > 0 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative shrink-0 p-1 text-slate-400 hover:text-teal-600 transition-colors"
                                    title={`${task.comments?.length || 0} comments`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="absolute -top-1 -right-1 text-[7px] font-black bg-teal-600 text-white w-2.5 h-2.5 rounded-full flex items-center justify-center">
                                      {task.comments?.length || 0}
                                    </span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden" align="start">
                                  <div onClick={(e) => e.stopPropagation()} className="p-4 bg-white dark:bg-slate-950">
                                    <CommentsList
                                      comments={task.comments || []}
                                      userId={user?.id || ""}
                                      onAdd={(content) => {
                                        const newComment = {
                                          id: crypto.randomUUID(),
                                          taskId: task.id,
                                          content,
                                          authorId: user?.id || "",
                                          authorName: user?.fullName || "You",
                                          authorAvatar: user?.imageUrl || undefined,
                                          createdAt: new Date().toISOString()
                                        }
                                        updateItem(task.id, { comments: [...(task.comments || []), newComment] }, true)
                                      }}
                                      onDelete={(id) => {
                                        updateItem(task.id, { comments: (task.comments || []).filter(c => c.id !== id) }, true)
                                      }}
                                      onUpdate={(id, content) => {
                                        updateItem(task.id, { comments: (task.comments || []).map(c => c.id === id ? { ...c, content, updatedAt: new Date().toISOString() } : c) }, true)
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            {task.recurrencePattern && (
                              <div className="shrink-0" title={`Repeats ${task.recurrencePattern} every ${task.recurrenceInterval || 1} ${task.recurrencePattern === 'daily' ? 'day' : task.recurrencePattern === 'weekly' ? 'week' : task.recurrencePattern === 'monthly' ? 'month' : 'year'}`}>
                                <Repeat2 className="w-3.5 h-3.5 text-teal-600" />
                              </div>
                            )}
                            <button
                              onClick={(e) => handleToggleComplete(e, task)}
                              className={cn(
                                "opacity-0 group-hover:opacity-100 w-5 h-5 rounded-sm flex items-center justify-center transition-all shadow-sm border shrink-0",
                                isComp
                                  ? "bg-emerald-600 border-emerald-600 text-white opacity-100"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-600"
                              )}
                              title={isComp ? "Mark as incomplete" : "Mark as complete"}
                            >
                              {isComp ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Check className="w-3.5 h-3.5 text-transparent" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 leading-none">
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-sm">
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-wider",
                                  (task.subtasks || []).every(s => s.completed) ? "text-emerald-600" : "text-slate-500"
                                )}>
                                  {(task.subtasks || []).filter(s => s.completed).length}/{(task.subtasks || []).length} Subtasks
                                </span>
                              </div>
                            )}
                            {entityName && !isComp && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {task.entityType}: {entityName}
                              </span>
                            )}
                            {/* Tags display */}
                            {taskTagsMap[task.id]?.map(tag => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${tag.color}26`,
                                  color: tag.color
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center justify-start">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest",
                            pConf.bg && (
                              pConf.bg.includes('red') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                                pConf.bg.includes('yellow') ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                                  pConf.bg.includes('green') ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            )
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", pConf.dot && (pConf.bg.includes('yellow') ? 'bg-amber-400' : pConf.bg.includes('red') ? 'bg-red-500' : pConf.bg.includes('green') ? 'bg-green-500' : 'bg-slate-400'))} />
                            {pConf.label}
                          </span>
                        </div>

                        {/* Due Date & Status */}
                        <div className="flex flex-col items-start gap-0.5">
                          <span className={cn(
                            "inline-flex px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest",
                            sConf.bg && (
                              sConf.bg.includes('green') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                                sConf.bg.includes('blue') ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            )
                          )}>
                            {sConf.label}
                          </span>
                          <div className={cn(
                            "text-[11px] font-medium truncate w-full text-left",
                            isComp ? "text-slate-500 dark:text-slate-400 italic" : (isOverdueTask ? "text-red-600 font-bold" : "text-slate-500 dark:text-slate-400")
                          )}>
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>

                        {/* Project */}
                        <div>
                          {task.projectId && projectMap[task.projectId || ''] ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_5px_rgba(0,0,0,0.1)]"
                                style={{ backgroundColor: projectMap[task.projectId || '']?.color }}
                              />
                              <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                                {projectMap[task.projectId || '']?.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-slate-500 dark:text-slate-400 italic">No project</span>
                          )}
                        </div>

                        {/* Assigned To */}
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-6 h-6 rounded flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-800 shrink-0 overflow-hidden shadow-sm",
                            task.ownerId === user?.id ? "bg-amber-50 dark:bg-amber-900/10" : "bg-blue-50 dark:bg-blue-900/10"
                          )}>
                            {task.ownerId === user?.id && user?.imageUrl ? (
                              <img src={user?.imageUrl || ''} alt="Avatar" className="w-full h-full object-cover shadow-inner" />
                            ) : (
                              <span className={cn(
                                "text-[8px] font-black",
                                task.ownerId === user?.id ? "text-amber-700 dark:text-amber-500" : "text-blue-700 dark:text-blue-500"
                              )}>
                                {task.ownerId === user?.id ? "ME" : "TM"}
                              </span>
                            )}
                          </div>
                          <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                            {task.ownerId === user?.id ? (user?.firstName || "Me") : "Team Member"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center pr-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPendingDelete(task)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expandable Subtasks View */}
                      {expandedTaskIds.has(task.id) && task.subtasks && task.subtasks.length > 0 && (
                        <div className="col-span-full border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/10 last:border-0 overflow-hidden transition-all duration-300 animate-in slide-in-from-top-2">
                          <div className="px-16 py-3 space-y-1 ml-1 cursor-default" onClick={(e) => e.stopPropagation()}>
                            {(task.subtasks || []).map(s => (
                              <div
                                key={s.id}
                                className="flex items-center gap-3 py-1.5 group/sub"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextSub = (task.subtasks || []).map(sub =>
                                      sub.id === s.id ? { ...sub, completed: !sub.completed, completedAt: !sub.completed ? new Date().toISOString() : undefined } : sub
                                    );
                                    updateItem(task.id, { subtasks: nextSub }, true);
                                  }}
                                  className={cn(
                                    "w-4 h-4 rounded-sm flex items-center justify-center border transition-all shrink-0 shadow-sm",
                                    s.completed ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-600"
                                  )}
                                >
                                  {s.completed && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                                </button>
                                <span className={cn(
                                  "text-[12px] font-medium transition-colors",
                                  s.completed ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"
                                )}>
                                  {s.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
        )}

        {/* Kanban Board View */}
        {viewMode === 'kanban' && (
          <KanbanBoard
            tasks={filteredTasks}
            onUpdate={updateItem}
            onEdit={setEditingTask}
            tagsMap={taskTagsMap}
            onAddTask={(_status) => {
              setShowAddModal(true)
            }}
          />
        )}
      </div>

      <AddTaskModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={(task) => addItems([task])}
        userId={user?.id ?? ""}
      />

      <EditTaskModal
        task={tasks.find(t => t.id === editingTask?.id) || null}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onUpdate={updateItem}
        onDelete={deleteItem}
        user={user}
      />

      <DeleteModal
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
            setDeleteAllOccurrences(false)
          }
        }}
        title="Delete Task"
        description={
          <div className="space-y-3">
            <p>
              Are you sure you want to delete{" "}
              <strong className="text-text-primary font-bold">{pendingDelete?.title}</strong>?
              {" "}This action cannot be undone.
            </p>
            {pendingDelete?.recurrencePattern && !pendingDelete.parentTaskId && (
              <label className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteAllOccurrences}
                  onChange={(e) => setDeleteAllOccurrences(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                />
                <span className="text-[13px] text-indigo-800 dark:text-indigo-200">
                  Also delete all future occurrences of this recurring task
                </span>
              </label>
            )}
          </div>
        }
        onDelete={() => {
          if (pendingDelete) {
            if (deleteAllOccurrences && pendingDelete.recurrencePattern) {
              // Delete all child occurrences first
              const childTasks = tasks.filter(t => t.parentTaskId === pendingDelete.id)
              Promise.all(childTasks.map(t => deleteItem(t.id))).then(() => {
                deleteItem(pendingDelete.id)
              })
            } else {
              deleteItem(pendingDelete.id)
            }
            setPendingDelete(null)
            setDeleteAllOccurrences(false)
          }
        }}
        cancelText="Cancel"
        deleteText="Delete Task"
      />
    </div >
  )
}
