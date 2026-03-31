import { useState } from "react"
import { TaskView } from "@/components/crmComponent/TaskView"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useUser } from "@clerk/clerk-react"
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
    <div className="flex-1 bg-bg-base text-text-primary min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">Work Management</p>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage, prioritize and track your team's workload.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none"
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
