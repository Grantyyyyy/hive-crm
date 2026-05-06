import { useState } from "react"
import { TaskView } from "@/components/crmComponent/TaskView"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useUser } from "@/lib/AuthContext"
import { useCRMResource } from "@/lib/hooks"
import type { Task } from "@/lib/types"
import { toast } from "sonner"

export function Tasks() {
  const { user } = useUser()
  const [showAddModal, setShowAddModal] = useState(false)
  const { addItems } = useCRMResource<Task>('tasks')

  const handleSaveTask = async (task: Task) => {
    try {
      await addItems([task], true) // silent = true to suppress default toast
      toast.success('Task created', {
        description: `"${task.title}" has been added.`
      })
      setShowAddModal(false)
    } catch (err: unknown) {
      toast.error('Failed to create task', {
        description: (err as Error).message
      })
    }
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1">Work Management</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Manage, prioritize and track your team's workload.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="brand"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle className="w-4 h-4" /> New Task
            </Button>
          </div>
        </div>

        {/* List View */}
        <div className="mt-8">
          <TaskView hideHeader={true} />
        </div>
      </div>

      <AddTaskModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={handleSaveTask}
        userId={user?.id || ""}
      />
    </div>
  )
}
