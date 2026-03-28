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

interface EditProjectModalProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<Project>) => void
  onDelete: (id: string) => void
}

export function EditProjectModal({ project, open, onOpenChange, onUpdate, onDelete }: EditProjectModalProps) {
  if (!project) return null

  const handleSave = (updated: Project) => {
    onUpdate(project.id, updated)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (window.confirm("Delete this project? This will not delete associated tasks.")) {
      onDelete(project.id)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full">
        <SheetHeader>
          <div className="flex items-center justify-between pr-8">
            <div className="space-y-1">
              <SheetTitle>Edit Project</SheetTitle>
              <SheetDescription>
                Update the project details or remove it if no longer needed.
              </SheetDescription>
            </div>
            <Button
              variant="destructiveOutline"
              size="sm"
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
    </Sheet>
  )
}
