import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TaskForm } from "./TaskForm"
import { getContacts, getDeals, getLeads, updateTask, deleteTask } from "@/lib/storage"
import type { Contact, Deal, Lead, Task } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface EditTaskModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditTaskModal({ task, open, onOpenChange, onSuccess }: EditTaskModalProps) {
  const { user } = useUser()
  const userId = user?.id ?? ""
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    if (open && userId) {
      setContacts(getContacts(userId))
      setDeals(getDeals(userId))
      setLeads(getLeads(userId))
    }
  }, [open, userId])

  if (!task) return null

  const handleSave = (updated: Task) => {
    updateTask(userId, task.id, updated)
    onOpenChange(false)
    if (onSuccess) onSuccess()
  }

  const handleDelete = () => {
    if (window.confirm("Delete this task?")) {
      deleteTask(userId, task.id)
      onOpenChange(false)
      if (onSuccess) onSuccess()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full">
        <SheetHeader className="px-8 py-10 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Edit Task
            </SheetTitle>
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="h-auto p-0 text-[11px] text-[var(--red)] uppercase tracking-widest hover:bg-transparent hover:text-[var(--red)] hover:opacity-80 transition-opacity font-bold"
            >
              Delete
            </Button>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <TaskForm 
            onSave={handleSave}
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
