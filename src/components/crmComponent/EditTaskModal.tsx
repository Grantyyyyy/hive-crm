import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { TaskForm } from "./TaskForm"
import { SubtasksList } from "./SubtasksList"
import { CommentsList } from "./CommentsList"
import { useCRMResource } from "@/lib/hooks"
import type { Contact, Deal, Lead, Task, Project, TaskActivity } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Repeat2, Info, CheckSquare, MessageSquare, Trash2, Calendar, Target, Clock, Plus, Pencil, RotateCcw, UserPlus, Paperclip, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { relativeTime } from "@/lib/helpers"
import { useMemo } from "react"
import { DeleteModal } from "@/components/ui/delete-modal"

interface EditTaskModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  user: any // Accepting the user object for rich metadata
}

type Tab = 'activity' | 'overview' | 'subtasks' | 'comments'
export function EditTaskModal({ task, open, onOpenChange, onUpdate, onDelete, user }: EditTaskModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { data: contacts } = useCRMResource<Contact>('contacts')
  const { data: deals } = useCRMResource<Deal>('deals')
  const { data: leads } = useCRMResource<Lead>('leads')
  const { data: projects } = useCRMResource<Project>('projects')

  // Task activities are fetched from the task_activities table
  const { data: allActivities, error: activitiesError } = useCRMResource<TaskActivity>('task_activities')

  const taskActivities = useMemo(() => {
    if (!allActivities || activitiesError) return []
    return allActivities
      .filter(a => a.taskId === task?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [task, allActivities, activitiesError])

  const activityCount = taskActivities.length

  if (!task) return null

  const userId = user?.id || ""

  const handleSave = (updated: Task) => {
    const activities: any[] = []
    const userMeta = {
      userId: user?.id || "",
      userName: user?.user_metadata?.full_name || "User",
      userAvatar: user?.user_metadata?.avatar_url,
      createdAt: new Date().toISOString()
    }

    // Detect changes and log them
    if (updated.status !== task.status) {
      const type = updated.status === 'completed' ? 'completed' : (task.status === 'completed' ? 'reopened' : 'updated')
      activities.push({
        id: crypto.randomUUID(),
        taskId: task.id,
        type,
        description: updated.status === 'completed' ? 'Task marked as completed' :
          task.status === 'completed' ? 'Task re-opened' :
            `Status changed to ${updated.status}`,
        ...userMeta
      })
    }

    if (updated.priority !== task.priority) {
      activities.push({
        id: crypto.randomUUID(),
        taskId: task.id,
        type: 'updated',
        description: `Priority set to ${updated.priority}`,
        ...userMeta
      })
    }

    if (JSON.stringify(updated.assignedTo) !== JSON.stringify(task.assignedTo)) {
      activities.push({
        id: crypto.randomUUID(),
        taskId: task.id,
        type: 'assigned',
        description: 'Task assignment updated',
        ...userMeta
      })
    }

    onUpdate(task.id, { ...updated, activities } as any)
    onOpenChange(false)
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (task) {
      onDelete(task.id)
      onOpenChange(false)
      setShowDeleteModal(false)
    }
  }

  const handleAddSubtask = (title: string) => {
    const newSubtask = {
      id: crypto.randomUUID(),
      taskId: task.id,
      title,
      completed: false,
      createdAt: new Date().toISOString()
    }
    const subtasks = task.subtasks ? [...task.subtasks, newSubtask] : [newSubtask]

    const activity = {
      id: crypto.randomUUID(),
      taskId: task.id,
      type: 'updated',
      description: `Added subtask: ${title}`,
      userId: user?.id || "",
      userName: user?.user_metadata?.full_name || "User",
      userAvatar: user?.user_metadata?.avatar_url,
      createdAt: new Date().toISOString()
    }

    onUpdate(task.id, { subtasks, activities: [activity] } as any)
  }

  const handleToggleSubtask = (id: string, completed: boolean) => {
    const subtask = task.subtasks?.find(s => s.id === id)
    const subtasks = task.subtasks?.map(s =>
      s.id === id ? { ...s, completed, completedAt: completed ? new Date().toISOString() : undefined } : s
    )

    const activity = {
      id: crypto.randomUUID(),
      taskId: task.id,
      type: 'updated',
      description: completed ? `Checked subtask: ${subtask?.title}` : `Unchecked subtask: ${subtask?.title}`,
      userId: user?.id || "",
      userName: user?.user_metadata?.full_name || "User",
      userAvatar: user?.user_metadata?.avatar_url,
      createdAt: new Date().toISOString()
    }

    onUpdate(task.id, { subtasks, activities: [activity] } as any)
  }

  const handleDeleteSubtask = (id: string) => {
    const subtask = task.subtasks?.find(s => s.id === id)
    const subtasks = task.subtasks?.filter(s => s.id !== id)

    const activity = {
      id: crypto.randomUUID(),
      taskId: task.id,
      type: 'updated',
      description: `Removed subtask: ${subtask?.title}`,
      userId: user?.id || "",
      userName: user?.user_metadata?.full_name || "User",
      userAvatar: user?.user_metadata?.avatar_url,
      createdAt: new Date().toISOString()
    }

    onUpdate(task.id, { subtasks, activities: [activity] } as any)
  }

  const handleAddComment = (content: string) => {
    const newComment = {
      id: crypto.randomUUID(),
      taskId: task.id,
      content,
      authorId: userId,
      authorName: user?.user_metadata?.full_name || "You",
      authorAvatar: user?.user_metadata?.avatar_url,
      createdAt: new Date().toISOString()
    }
    const comments = task.comments ? [...task.comments, newComment] : [newComment]

    const activity = {
      id: crypto.randomUUID(),
      taskId: task.id,
      type: 'comment',
      description: 'Added a comment',
      userId: user?.id || "",
      userName: user?.user_metadata?.full_name || "User",
      userAvatar: user?.user_metadata?.avatar_url,
      createdAt: new Date().toISOString()
    }

    onUpdate(task.id, { comments, activities: [activity] } as any)
  }

  const handleDeleteComment = (id: string) => {
    const comments = task.comments?.filter(c => c.id !== id)
    const activity = {
      id: crypto.randomUUID(),
      taskId: task.id,
      type: 'comment',
      description: 'Deleted a comment',
      userId: user?.id || "",
      userName: user?.user_metadata?.full_name || "User",
      userAvatar: user?.user_metadata?.avatar_url,
      createdAt: new Date().toISOString()
    }
    onUpdate(task.id, { comments, activities: [activity] } as any)
  }

  const handleUpdateComment = (id: string, content: string) => {
    const comments = task.comments?.map(c =>
      c.id === id ? { ...c, content, updatedAt: new Date().toISOString() } : c
    )
    onUpdate(task.id, { comments } as any)
  }

  const subtaskCount = task.subtasks?.length || 0
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0
  const commentCount = task.comments?.length || 0
  return (
    <Sheet open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) setActiveTab('activity')
    }}>
      <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="px-8 pt-8 pb-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm relative z-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Task</SheetTitle>
                  {task.recurrencePattern && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-900/50 rounded-full" title="Recurring task">
                      <Repeat2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Recurring</span>
                    </div>
                  )}
                </div>
                <SheetDescription className="text-sm font-medium text-slate-500">
                  Update task details, track subtasks, or discuss progress.
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-slate-400 hover:text-red hover:bg-red/10 transition-all font-bold uppercase text-[11px] tracking-wider h-9"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>

            {/* Quick Badges Row */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-wider shadow-sm transition-all",
                task.priority === 'urgent' ? "bg-red/5 border-red/20 text-red" :
                  task.priority === 'high' ? "bg-red/5 border-red/20 text-red" :
                    task.priority === 'medium' ? "bg-amber/5 border-amber/20 text-amber" :
                      "bg-green/5 border-green/20 text-green"
              )}>
                <Target className="w-3 h-3" />
                {task.priority} Priority
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 text-teal-600 dark:text-teal-400 text-[11px] font-black uppercase tracking-wider shadow-sm transition-all">
                <Calendar className="w-3 h-3" />
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>

            {/* Premium Tab Navigation - Segmented Control Style */}
            <div className="flex items-center gap-1 mt-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              {[
                { id: 'overview', icon: Info, label: 'Overview' },
                { id: 'subtasks', icon: CheckSquare, label: 'Subtasks', badge: subtaskCount > 0 ? `${completedSubtasks}/${subtaskCount}` : null },
                { id: 'comments', icon: MessageSquare, label: 'Comments', badge: commentCount > 0 ? commentCount : null },
                { id: 'activity', icon: Clock, label: 'Activity', badge: activityCount > 0 ? activityCount : null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg relative",
                    activeTab === tab.id
                      ? "text-teal-600 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-800/60"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge && (
                    <span className={cn(
                      "ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black",
                      activeTab === tab.id ? "bg-teal-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'activity' && (
            <div className="px-8 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Activity Log</h3>
                {taskActivities.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                      {activitiesError ? 'Activity log not configured' : 'No activity recorded yet'}
                    </p>
                    {activitiesError && (
                      <p className="text-xs text-slate-500 dark:text-slate-600 mt-2">
                        Task activities table needs to be added to CRMContext
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {taskActivities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full
                                        bg-slate-100 dark:bg-slate-800
                                        flex items-center justify-center">
                          {activity.type === 'created' && <Plus className="w-3.5 h-3.5 text-teal-500" />}
                          {activity.type === 'updated' && <Pencil className="w-3.5 h-3.5 text-slate-400" />}
                          {activity.type === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {activity.type === 'reopened' && <RotateCcw className="w-3.5 h-3.5 text-amber-500" />}
                          {activity.type === 'assigned' && <UserPlus className="w-3.5 h-3.5 text-blue-500" />}
                          {activity.type === 'comment' && <MessageSquare className="w-3.5 h-3.5 text-slate-400" />}
                          {activity.type === 'attachment' && <Paperclip className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-4 border-b
                                        border-slate-100 dark:border-slate-800
                                        last:border-0 last:pb-0">
                          <p className="text-sm text-slate-700 dark:text-slate-300
                                        font-medium leading-snug">
                            {activity.description}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500
                                        mt-0.5 font-medium">
                            {activity.userName} · {relativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          )}

          {activeTab === 'subtasks' && (
            <div className="px-8 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                <SubtasksList
                  subtasks={task.subtasks || []}
                  onAdd={handleAddSubtask}
                  onToggle={handleToggleSubtask}
                  onDelete={handleDeleteSubtask}
                />
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="px-8 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 min-h-[400px]">
                <CommentsList
                  comments={task.comments || []}
                  userId={userId}
                  onAdd={handleAddComment}
                  onDelete={handleDeleteComment}
                  onUpdate={handleUpdateComment}
                />
              </div>
            </div>
          )}


        </div>
      </SheetContent>
      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Task"
        description="Are you sure you want to permanently delete this task? This action cannot be undone."
        onDelete={confirmDelete}
      />
    </Sheet>
  )
}


