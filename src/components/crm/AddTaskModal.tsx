import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TaskForm } from "./TaskForm"
import { contactsApi, dealsApi, leadsApi } from "@/lib/api"
import type { Contact, Deal, Lead, Task } from "@/lib/types"
import { useCreateTask } from "@/lib/hooks"

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

  const createTask = useCreateTask()

  useEffect(() => {
    async function fetchData() {
      if (open && userId) {
        try {
          const [contactsRes, dealsRes, leadsRes] = await Promise.all([
            contactsApi.list({ limit: 100 }),
            dealsApi.list({ limit: 100 }),
            leadsApi.list({ limit: 100 }),
          ])
          
          if (contactsRes.success && contactsRes.data) {
            setContacts(contactsRes.data)
          }
          if (dealsRes.success && dealsRes.data) {
            setDeals(dealsRes.data.map((d: any) => ({ ...d, stage: d.stage?.toLowerCase() })))
          }
          if (leadsRes.success && leadsRes.data) {
            setLeads(leadsRes.data.map((l: any) => ({ ...l, status: l.status?.toLowerCase(), source: l.source?.toLowerCase() })))
          }
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }
    fetchData()
  }, [open, userId])

  const handleSave = async (task: Partial<Task>) => {
    toast.promise(
      createTask.mutateAsync(task).then(response => {
        if (response.success && response.data) {
          const newTask = { 
            ...response.data, 
            status: response.data.status?.replace('_', '-')?.toLowerCase(), 
            priority: response.data.priority?.toLowerCase() 
          }
          onOpenChange(false)
          if (onSuccess) onSuccess(newTask)
          return response
        }
        throw new Error("Failed response")
      }),
      {
        loading: 'Creating task...',
        success: 'Task created successfully!',
        error: 'Failed to create task'
      }
    )
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
