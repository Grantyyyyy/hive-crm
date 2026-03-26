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
import { useCreateTask } from "@/lib/hooks"

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Task) => void
  userId: string
  fixedEntity?: { type: 'contact' | 'deal' | 'lead'; id: string; name: string }
}

export function AddTaskModal({ open, onOpenChange, onSave, userId, fixedEntity }: AddTaskModalProps) {
  // Use hooks to get live data from Supabase for the form dropdowns
  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: deals } = useCRMResource<Deal>('deals')
  const { data: leads } = useCRMResource<Lead>('leads')

  const handleSave = (task: Task) => {
    onSave(task)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>New Task</SheetTitle>
          <SheetDescription>
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
            fixedEntity={fixedEntity}
            userId={userId}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
