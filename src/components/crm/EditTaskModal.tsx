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
import { Button } from "@/components/ui/button"
import { useUpdateTask, useDeleteTask } from "@/lib/hooks"

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

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

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

  if (!task) return null

  const handleSave = async (updated: Partial<Task>) => {
    toast.promise(
      updateTask.mutateAsync({ id: task.id, data: updated }).then(() => {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      }),
      {
        loading: 'Updating task...',
        success: 'Task updated successfully!',
        error: 'Failed to update task'
      }
    )
  }

  const handleDelete = async () => {
    if (window.confirm("Delete this task?")) {
      toast.promise(
        deleteTask.mutateAsync(task.id).then(() => {
          onOpenChange(false)
          if (onSuccess) onSuccess()
        }),
        {
          loading: 'Deleting task...',
          success: 'Task deleted successfully!',
          error: 'Failed to delete task'
        }
      )
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
