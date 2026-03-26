import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { TaskForm } from "./TaskForm"
import { useCRMResource } from "@/lib/hooks"
import type { Contact, Deal, Lead, Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useUpdateTask, useDeleteTask } from "@/lib/hooks"

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
              <SheetTitle>Edit Task</SheetTitle>
              <SheetDescription>
                Update the details of this task or remove it if no longer needed.
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
            userId={userId}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
