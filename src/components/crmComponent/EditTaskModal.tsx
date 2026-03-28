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
import { Button } from "@/components/ui/button"
import { Repeat2 } from "lucide-react"

interface EditTaskModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  userId: string
}

export function EditTaskModal({ task, open, onOpenChange, onUpdate, onDelete, userId }: EditTaskModalProps) {
  // Use hooks to get live data from Supabase for the form dropdowns
  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: deals } = useCRMResource<Deal>('deals')
  const { data: leads } = useCRMResource<Lead>('leads')
  const { data: projects } = useCRMResource<Project>('projects')

  if (!task) return null

  const handleSave = (updated: Task) => {
    onUpdate(task.id, updated)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (window.confirm("Delete this task?")) {
      onDelete(task.id)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full">
        <SheetHeader>
          <div className="flex items-center justify-between pr-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SheetTitle>Edit Task</SheetTitle>
                {task.recurrencePattern && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full" title="Recurring task">
                    <Repeat2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">RECURS</span>
                  </div>
                )}
              </div>
              <SheetDescription>
                Update the details of this task or remove it if no longer needed.
                {task.parentTaskId && " This is part of a recurring task series."}
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
          <TaskForm
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            initialData={task}
            contacts={contacts}
            deals={deals}
            leads={leads}
            projects={projects ?? []}
            userId={userId}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
