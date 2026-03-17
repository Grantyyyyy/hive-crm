import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TaskForm } from "./TaskForm"
import { getContacts, getDeals, getLeads, createTask } from "@/lib/storage"
import type { Contact, Deal, Lead, Task } from "@/lib/types"

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (task: Task) => void
  fixedEntity?: { type: 'contact' | 'deal' | 'lead'; id: string; name: string }
}

export function AddTaskModal({ open, onOpenChange, onSuccess, fixedEntity }: AddTaskModalProps) {
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

  const handleSave = (task: Task) => {
    createTask(userId, task)
    onOpenChange(false)
    if (onSuccess) onSuccess(task)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full">
        <SheetHeader className="px-8 py-10 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <SheetTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            New Task
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <TaskForm 
            onSave={handleSave}
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
