import { useState } from "react"
import { TaskView } from "@/components/crmComponent/TaskView"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useUser } from "@/lib/AuthContext"
import { PageHeader } from "@/components/reusables/PageHeader"
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
      <div className="mx-auto px-4 pt-2 pb-4 md:px-8 md:pt-4 md:pb-8 max-w-full animate-fade-in space-y-6">
        <PageHeader 
          category="Work Management"
          title="Tasks"
          description="Manage, prioritize and track your team's workload."
          className="px-0 bg-transparent border-none pb-2"
          actions={
            <Button
              variant="brand"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle className="w-4 h-4" /> New Task
            </Button>
          }
        />

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
