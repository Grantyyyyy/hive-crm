import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ProjectForm } from "./ProjectForm"
import { Button } from "@/components/ui/button"
import type { Project } from "@/lib/types"
import { useState } from "react"
import { DeleteModal } from "@/components/ui/delete-modal"

interface EditProjectModalProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<Project>) => void
  onDelete: (id: string) => void
}

export function EditProjectModal({ project, open, onOpenChange, onUpdate, onDelete }: EditProjectModalProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  if (!project) return null

  const handleSave = (updated: Project) => {
    onUpdate(project.id, updated)
    onOpenChange(false)
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (project) {
      onDelete(project.id)
      onOpenChange(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Project</SheetTitle>
              <SheetDescription className="text-sm font-medium text-slate-500">
                Update project details or remove it.
              </SheetDescription>
            </div>
            <Button
              variant="destructiveOutline"
              className="h-9 px-4 rounded-md text-[10px] font-black uppercase tracking-widest border-2"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <ProjectForm
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            initialData={project}
          />
        </div>
      </SheetContent>
      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Project"
        description="Are you sure you want to delete this project? This will not delete associated tasks, but the project grouping will be lost."
        onDelete={confirmDelete}
      />
    </Sheet>
  )
}
