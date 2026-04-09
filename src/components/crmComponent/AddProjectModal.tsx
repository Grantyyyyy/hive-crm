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
      <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
          <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Project</SheetTitle>
          <SheetDescription className="text-sm font-medium text-slate-500">
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

