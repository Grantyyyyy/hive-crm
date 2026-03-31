import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { TaskForm } from "./TaskForm"
import { useCRMResource } from "@/lib/hooks"
import type { Contact, Deal, Lead, Task, Project } from "@/lib/types"

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Task) => void
  userId: string
  fixedEntity?: { type: 'contact' | 'deal' | 'lead'; id: string; name: string }
  fixedProjectId?: string
}

export function AddTaskModal({ open, onOpenChange, onSave, userId, fixedEntity, fixedProjectId }: AddTaskModalProps) {
  // Use hooks to get live data from Supabase for the form dropdowns
  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: deals } = useCRMResource<Deal>('deals')
  const { data: leads } = useCRMResource<Lead>('leads')
  const { data: projects } = useCRMResource<Project>('projects')

  const handleSave = (task: Task) => {
    onSave(task)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
          <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Task</SheetTitle>
          <SheetDescription className="text-sm font-medium text-slate-500">
            Create a new task to track your work and follow up with entities.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <TaskForm
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            contacts={contacts}
            deals={deals}
            leads={leads}
            projects={projects ?? []}
            fixedEntity={fixedEntity}
            fixedProjectId={fixedProjectId}
            userId={userId}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
