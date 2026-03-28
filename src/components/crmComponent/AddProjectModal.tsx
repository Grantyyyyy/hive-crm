import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ProjectForm } from "./ProjectForm"
import type { Project } from "@/lib/types"

interface AddProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: Project) => void
  userId: string
}

export function AddProjectModal({ open, onOpenChange, onSave, userId }: AddProjectModalProps) {
  const handleSave = (project: Project) => {
    onSave(project)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>New Project</SheetTitle>
          <SheetDescription>
            Create a new project to organize and group related tasks.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <ProjectForm
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            userId={userId}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
