import { useState, useMemo, useCallback } from "react"
import { useLocation, useRoute, Link } from "wouter"
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Activity as ActivityIcon,
  CheckCircle2,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { DealForm } from "@/components/crm/DealForm"
import { ActivityForm } from "@/components/crm/ActivityForm"
import { relativeTime, formatCurrency, isOverdue, sortTasks } from "@/lib/helpers"
import type { Deal, Activity, Contact, Task } from "@/lib/types"
import { STAGE_LABELS } from "@/lib/types"
import { AddTaskModal } from "@/components/crm/AddTaskModal"
import { EditTaskModal } from "@/components/crm/EditTaskModal"
import { useCRMResource } from "@/lib/hooks"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"

const STAGE_COLORS: Record<string, string> = {
  discovery: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  proposal: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  negotiation: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  won: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  lost: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
}

const activityColorMap: Record<string, string> = {
  call: "bg-blue-500",
  email: "bg-indigo-500",
  note: "bg-amber-500",
  meeting: "bg-emerald-500",
}

export function DealDetail() {
  const [, params] = useRoute("/deals/:id")
  const [, navigate] = useLocation()
  const dealId = params?.id ?? ""

  const {
    data: deals,
    updateItem: updateDeal,
    deleteItem: deleteDeal,
    isLoaded: dealsLoaded,
    userId,
  } = useCRMResource<Deal>("deals")

  const {
    data: contacts,
    isLoaded: contactsLoaded,
  } = useCRMResource<Contact>("contacts")

  const {
    data: activities,
    addItems: addActivities,
    isLoaded: activitiesLoaded,
  } = useCRMResource<Activity>("activities")

  const {
    data: allTasks,
    addItems: addTaskItems,
    updateItem: updateTaskItem,
    deleteItem: deleteTaskItem,
    isLoaded: tasksLoaded,
  } = useCRMResource<Task>("tasks")

  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const deal = useMemo(() => deals.find((d) => d.id === dealId), [deals, dealId])

  const contact = useMemo(
    () => (deal ? contacts.find((c) => c.id === deal.contactId) : undefined),
    [contacts, deal]
  )

  const dealActivities = useMemo(
    () =>
      activities
        .filter((a) => a.dealId === dealId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activities, dealId]
  )

  const tasks = useMemo(
    () => allTasks.filter((t) => t.entityType === "deal" && t.entityId === dealId),
    [allTasks, dealId]
  )



  const handleEditDeal = useCallback(
    (updated: Deal) => {
      updateDeal(updated.id, updated)
      setShowEditModal(false)
    },
    [updateDeal]
  )

  const handleAddActivity = useCallback(
    (activity: Activity) => {
      const newActivity: Activity = { ...activity, dealId: dealId, contactId: deal?.contactId ?? "" }
      addActivities([newActivity])
      setShowActivityModal(false)
    },
    [addActivities, dealId, deal]
  )

  const handleToggleTask = useCallback(
    (e: React.MouseEvent, task: Task) => {
      e.stopPropagation()
      const newStatus = task.status === "completed" ? "open" : "completed"
      updateTaskItem(task.id, {
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
      })
    },
    [updateTaskItem]
  )

  const handleDeleteDeal = useCallback(() => {
    deleteDeal(dealId)
    toast.success("Deal deleted successfully")
    navigate("/deals")
  }, [deleteDeal, dealId, navigate])

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks])
  const topTasks = useMemo(() => sortedTasks.slice(0, 5), [sortedTasks])

  function stageColor(stage: string): string {
    return STAGE_COLORS[stage] || STAGE_COLORS.discovery
  }

  if (!dealsLoaded || !contactsLoaded || !activitiesLoaded || !tasksLoaded) {
    return <PageSkeleton />
  }

  if (!deal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-sm font-medium text-slate-500">Deal not found</h2>
        <Link href="/deals">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Deals
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-3 md:p-5 max-w-[1400px]">
        <div className="space-y-4 animate-fade-in">

          {/* Back button */}
          <Link
            href="/deals"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>

          {/* Deal Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight">{deal.title}</h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg",
                      stageColor(deal.stage)
                    )}
                  >
                    {STAGE_LABELS[deal.stage]}
                  </span>
                </div>

                <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {contact && (
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-400" /> {contact.name}
                    </Link>
                  )}
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />{" "}
                    Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Deal Value */}
                <div className="flex items-center gap-5 mt-3">
                  <div className="text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(deal.value)}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Deal Value</div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-500">Pipeline Revenue</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 shrink-0 flex-wrap">
                <Button variant="outlineNeutral" onClick={() => setShowEditModal(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <Button variant="default" onClick={() => setShowActivityModal(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Log Activity
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Activity Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Activity Timeline</h2>
                  <Button variant="outlineNeutral" size="sm" onClick={() => setShowActivityModal(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Log Activity
                  </Button>
                </div>

                {dealActivities.length === 0 ? (
                  <div className="py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <ActivityIcon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-sm font-medium text-slate-500">
                      No activities yet. Log an interaction above.
                    </p>
                  </div>
                ) : (
                  <div className="relative pt-2 pl-[42px]">
                    <div className="absolute top-4 bottom-0 left-[20px] w-px bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-6">
                      {dealActivities.map((a) => (
                        <div key={a.id} className="relative flex items-start group">
                          <div
                            className={cn(
                              "absolute left-[-26px] top-1 w-3 h-3 rounded-full ring-4 ring-white dark:bg-slate-900 dark:ring-slate-900 z-10",
                              activityColorMap[a.type] || "bg-slate-400"
                            )}
                          />
                          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                            <div className="flex justify-between items-start mb-2">
                              <span className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                                {a.type}
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {relativeTime(a.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{a.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Deal Info */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">Deal Info</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Stage</div>
                    <span
                      className={cn(
                        "inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg",
                        stageColor(deal.stage)
                      )}
                    >
                      {STAGE_LABELS[deal.stage]}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Contact</div>
                    {contact ? (
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                      >
                        {contact.name} →
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-slate-500">Unknown</p>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Value</div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(deal.value)}</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Expected Close</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {new Date(deal.expectedCloseDate).toLocaleDateString()}
                    </p>
                  </div>
                  {deal.lostReason && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Lost Reason</div>
                      <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{deal.lostReason}</p>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Owner</div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">You</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Created</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{relativeTime(deal.createdAt)}</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Last Updated</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{relativeTime(deal.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Tasks</h2>
                    <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-md">
                      {tasks.filter((t) => t.status !== "completed").length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAddTaskModal(true)}
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {tasks.length === 0 ? (
                  <div className="py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {topTasks.map((task) => {
                        const isOverdueTask = isOverdue(task)
                        const isComp = task.status === "completed"

                        return (
                          <div
                            key={task.id}
                            onClick={() => setEditingTask(task)}
                            className={cn(
                              "flex items-center p-3 gap-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border transition-colors cursor-pointer group/task",
                              !isComp && isOverdueTask
                                ? "border-rose-200 dark:border-rose-900/50"
                                : "border-slate-200 dark:border-slate-800/50",
                              "hover:border-indigo-300 dark:hover:border-indigo-700/50",
                              isComp && "opacity-60"
                            )}
                          >
                            <button
                              onClick={(e) => handleToggleTask(e, task)}
                              className="shrink-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              {isComp ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover/task:text-emerald-600" />
                              ) : (
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 transition-colors",
                                    isOverdueTask
                                      ? "border-rose-300 group-hover/task:border-rose-500"
                                      : "border-slate-300 dark:border-slate-600 group-hover/task:border-indigo-500"
                                  )}
                                />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  "text-sm font-medium truncate",
                                  isComp ? "line-through text-slate-500" : "text-slate-900 dark:text-slate-100"
                                )}
                              >
                                {task.title}
                              </div>
                            </div>

                            <div
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-widest shrink-0 text-right bg-white dark:bg-slate-900 px-2 py-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-800",
                                isComp
                                  ? "text-slate-500"
                                  : isOverdueTask
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {isComp
                                ? "Done"
                                : isOverdueTask
                                  ? "Past Due"
                                  : relativeTime(task.dueDate).replace(" ago", "")}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {tasks.length > 5 && (
                      <div className="flex justify-center">
                        <Link href={`/tasks?entityType=deal&entityId=${dealId}`}>
                          <Button variant="outlineNeutral" size="sm" className="w-full">
                            View all tasks
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Sheet open={showEditModal} onOpenChange={setShowEditModal}>
        <SheetHeader>
          <SheetTitle>Edit Deal</SheetTitle>
          <SheetDescription>Update the details for this deal.</SheetDescription>
        </SheetHeader>
        <SheetContent>
          <DealForm
            onSave={handleEditDeal}
            onCancel={() => setShowEditModal(false)}
            contacts={contacts}
            initialData={deal}
          />
        </SheetContent>
      </Sheet>

      {/* Activity modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl sm:max-w-[500px]">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Log Activity</DialogTitle>
          </DialogHeader>
          <ActivityForm
            contactId={deal.contactId}
            onSave={handleAddActivity}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Deal"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{deal.title}</strong>?
            This action cannot be undone and will permanently remove this deal and all associated data.
          </>
        }
        onDelete={handleDeleteDeal}
        cancelText="Cancel"
        deleteText="Delete Deal"
      />

      <AddTaskModal
        open={showAddTaskModal}
        onOpenChange={setShowAddTaskModal}
        fixedEntity={{ type: "deal", id: dealId, name: deal.title }}
        onSave={(task) => addTaskItems([task])}
        userId={userId || ""}
      />

      <EditTaskModal
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(o) => !o && setEditingTask(null)}
        onUpdate={updateTaskItem}
        onDelete={deleteTaskItem}
        userId={userId || ""}
      />
    </div>
  )
}
