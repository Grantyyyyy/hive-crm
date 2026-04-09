import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useLocation } from "wouter"
import {
  FolderOpen,
  PlusCircle,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import type { Project, Task } from "@/lib/types"
import { AddProjectModal } from "@/components/crmComponent/AddProjectModal"
import { EditProjectModal } from "@/components/crmComponent/EditProjectModal"
import { useCRMResource } from "@/lib/hooks"
import { useUser } from "@/lib/AuthContext"
import { ListSkeleton } from "@/components/ui/skeletons"
import { DeleteModal } from "@/components/ui/delete-modal"

export function Projects() {
  const { user, isLoaded: userLoaded } = useUser()
  const [, setLocation] = useLocation()
  const {
    data: projects,
    isLoaded: projectsLoaded,
    addItems,
    updateItem,
    deleteItem,
  } = useCRMResource<Project>('projects')

  const { data: tasks } = useCRMResource<Task>('tasks')
  const isLoaded = userLoaded && projectsLoaded

  // UI State
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtering
  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase()
    return (projects ?? []).filter(p => {
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      return matchesSearch
    })
  }, [projects, search])

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProjects.slice(start, start + itemsPerPage)
  }, [filteredProjects, currentPage])

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)

  const getTaskCount = (projectId: string) => {
    return (tasks ?? []).filter(t => t.projectId === projectId).length ?? 0
  }

  const getCompletedCount = (projectId: string) => {
    return (tasks ?? []).filter(t => t.projectId === projectId && t.status === 'completed').length ?? 0
  }

  if (!isLoaded) {
    return <ListSkeleton />
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-1">Work Organization</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Projects</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Organize tasks into projects for better workflow management.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="brand" onClick={() => setShowAddModal(true)}>
              <PlusCircle className="w-4 h-4" /> Create Project
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex-1 max-w-xl">
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-teal-600 transition-colors" />
              <input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all duration-300"
              />
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedProjects.length === 0 ? (
            <div className="col-span-full p-12 text-center">
              <FolderOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-50" />
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">No projects found</p>
              <Button variant="brand" onClick={() => setShowAddModal(true)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Create your first project
              </Button>
            </div>
          ) : (
            paginatedProjects.map((project) => {
              const taskCount = getTaskCount(project.id)
              const completedCount = getCompletedCount(project.id)
              const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0

              return (
                <div
                  key={project.id}
                  className="group bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:shadow-teal-600/5 hover:border-teal-600/30 transition-all duration-300 cursor-pointer"
                  onClick={() => setLocation(`/projects/${project.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: `${project.color}20` }}
                      >
                        <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all text-slate-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDelete(project)
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 min-h-[36px]">
                      {project.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</span>
                      <span className="text-slate-900 dark:text-white">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: project.color
                        }}
                      />
                    </div>
                    {taskCount > 0 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {completedCount} of {taskCount} tasks completed
                      </p>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-[12px] font-semibold flex-1 text-slate-600 dark:text-slate-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingProject(project)
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-[12px] font-semibold flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDelete(project)
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProjects.length}
          itemsPerPage={itemsPerPage}
          itemLabel="projects"
        />
      </div>

      <AddProjectModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={(project) => {
          addItems([project])
        }}
        userId={user?.id ?? ""}
      />

      <EditProjectModal
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onUpdate={(id, updates) => {
          updateItem(id, updates, true)
          toast.success("Project updated")
        }}
        onDelete={(id) => {
          deleteItem(id)
          setEditingProject(null)
        }}
      />

      <DeleteModal
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title="Delete Project"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-text-primary font-bold">{pendingDelete?.name}</strong>?
            {" "}This action cannot be undone. Associated tasks will remain but won't be linked to any project.
          </>
        }
        onDelete={() => {
          if (pendingDelete) {
            deleteItem(pendingDelete.id)
          }
          setPendingDelete(null)
        }}
        cancelText="Cancel"
        deleteText="Delete Project"
      />
    </div>
  )
}
