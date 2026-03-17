import { useState, useMemo } from "react"
import { 
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isOverdue, sortTasks } from "@/lib/helpers"
import type { Task, Contact, Deal, Lead } from "@/lib/types"
import { AddTaskModal } from "@/components/crm/AddTaskModal"
import { EditTaskModal } from "@/components/crm/EditTaskModal"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@clerk/clerk-react"

export function Tasks() {
  const { user } = useUser()
  const { 
    data: tasks, 
    isLoaded,
    updateItem,
  } = useCRMResource<Task>('tasks')

  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: deals } = useCRMResource<Deal>('deals')
  const { data: leads } = useCRMResource<Lead>('leads')
  
  // UI State
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'upcoming'>('my')
  const [statusFilter] = useState<'all' | 'open' | 'in-progress' | 'completed'>('all')
  const [priorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all')
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
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
    updateItem(task.id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
    })
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
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in space-y-8">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Work Management</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage, prioritize and track your team's workload.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
              New Task
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('my')}
            className={cn(
              "pb-4 font-bold text-sm tracking-wide transition-colors relative flex items-center gap-2",
              activeTab === 'my' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            My Tasks
            <span className={cn(
               "px-2 py-0.5 rounded-full text-xs font-semibold",
               activeTab === 'my' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}>
              {tasks.length}
            </span>
            {activeTab === 'my' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={cn(
              "pb-4 font-bold text-sm tracking-wide transition-colors relative",
              activeTab === 'team' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Team Tasks
            {activeTab === 'team' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              "pb-4 font-bold text-sm tracking-wide transition-colors relative",
              activeTab === 'upcoming' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Upcoming
            {activeTab === 'upcoming' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
        </div>

        {/* Inline Filters */}
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">Status: All</span>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </div>
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">Priority: High</span>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </div>
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">Due: This Week</span>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-[auto_1fr_120px_140px_160px_120px_40px] items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-6"></div> {/* Checkbox placeholder */}
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Task Name</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Priority</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Assigned To</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Due Date</div>
            <div></div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">No tasks found.</div>
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
                    className="grid grid-cols-[auto_1fr_120px_140px_160px_120px_40px] items-center gap-4 px-6 py-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => setEditingTask(task)}
                  >
                    {/* Checkbox */}
                    <div className="w-6 py-1">
                      <button 
                        onClick={(e) => handleToggleComplete(e, task)}
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center transition-all",
                          isComp 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500"
                        )}
                      >
                        {isComp && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </div>

                    {/* Task Name */}
                    <div className="flex flex-col pr-4 min-w-0">
                      <span className={cn(
                        "text-[15px] font-bold truncate transition-colors",
                        isComp ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-slate-100"
                      )}>
                        {task.title}
                      </span>
                      {entityName && !isComp && (
                        <span className="text-[12px] text-slate-400 truncate mt-0.5">
                          {task.entityType}: {entityName}
                        </span>
                      )}
                    </div>

                    {/* Priority */}
                    <div>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest",
                        pConf.bg,
                        pConf.bg.includes('red') ? 'dark:bg-red-900/30' : 
                        pConf.bg.includes('yellow') ? 'dark:bg-yellow-900/30' : 
                        pConf.bg.includes('green') ? 'dark:bg-green-900/30' : 'dark:bg-slate-800'
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", pConf.dot)} />
                        {pConf.label}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={cn(
                        "inline-flex px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest",
                        sConf.bg,
                        sConf.bg.includes('green') ? 'dark:bg-green-900/30 dark:text-green-400' :
                        sConf.bg.includes('blue') ? 'dark:bg-blue-900/30 dark:text-blue-400' : 'dark:bg-slate-800 dark:text-slate-400'
                      )}>
                        {sConf.label}
                      </span>
                    </div>

                    {/* Assigned To */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center border border-orange-200 dark:border-orange-800 shrink-0 overflow-hidden">
                        {user?.imageUrl ? (
                          <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-orange-700">ME</span>
                        )}
                      </div>
                      <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                        {user?.firstName || "Me"}
                      </span>
                    </div>

                    {/* Due Date */}
                    <div className={cn(
                      "text-[13px] font-medium truncate",
                      isComp ? "text-slate-400 dark:text-slate-500 italic" : (isOverdueTask ? "text-red-500 font-bold" : "text-slate-500 dark:text-slate-400")
                    )}>
                      {isComp ? "Completed" : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pr-2">
                      <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Pagination */}
          {filteredTasks.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-[13px] font-medium text-slate-500">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTasks.length)} to {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-8 h-8 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "ghost"}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-semibold",
                      currentPage === i + 1 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-8 h-8 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddTaskModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
      />

      <EditTaskModal 
        task={editingTask} 
        open={!!editingTask} 
        onOpenChange={(open) => !open && setEditingTask(null)} 
      />
    </div>
  )
}


