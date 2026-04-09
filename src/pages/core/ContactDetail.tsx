import { useState, useMemo, useCallback } from "react"
import { useLocation, useRoute, Link } from "wouter"
import { useUser } from "@/lib/AuthContext"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  PlusCircle,
  Pencil,
  AlertTriangle,
  X,
  Activity as ActivityIcon,
  Trash2,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ContactForm } from "@/components/crmComponent/ContactForm"
import { ActivityForm } from "@/components/crmComponent/ActivityForm"
import {
  relativeTime,
  daysSince,
  formatCurrency,
  calculateRelationshipScore,
  getRelationshipLabel,
  isOverdue,
  sortTasks,
} from "@/lib/helpers"
import type { CreateContactInput, Contact, Activity, Deal, Task } from "@/lib/types"
import { SOURCE_LABELS, STAGE_LABELS } from "@/lib/types"
import { AddTaskModal } from "@/components/crmComponent/AddTaskModal"
import { EditTaskModal } from "@/components/crmComponent/EditTaskModal"
import { useCRMResource } from "@/lib/hooks"
import { DetailSkeleton } from "@/components/ui/skeletons"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"

const activityColorMap: Record<string, string> = {
  call: "bg-blue-500",
  email: "bg-teal-500",
  note: "bg-amber-500",
  meeting: "bg-emerald-500",
}

export function ContactDetail() {
  const [, params] = useRoute("/contacts/:id")
  const [, navigate] = useLocation()
  const contactId = params?.id ?? ""

  const { user, isLoaded: userLoaded } = useUser()
  const {
    data: contacts,
    updateItem: updateContact,
    deleteItem: deleteContact,
    isLoaded: contactsLoaded,
    userId,
  } = useCRMResource<Contact>("contacts")

  const {
    data: activities,
    addItems: addActivities,
    isLoaded: activitiesLoaded,
  } = useCRMResource<Activity>("activities")

  const {
    data: deals,
    isLoaded: dealsLoaded,
  } = useCRMResource<Deal>("deals")

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

  const contact = useMemo(
    () => contacts.find((c) => c.id === contactId),
    [contacts, contactId]
  )

  const tasks = useMemo(
    () => allTasks.filter((t) => t.entityType === "contact" && t.entityId === contactId),
    [allTasks, contactId]
  )

  const contactDeals = useMemo(
    () => deals.filter((d) => d.contactId === contactId),
    [deals, contactId]
  )

  const contactActivities = useMemo(
    () =>
      activities
        .filter((a) => a.contactId === contactId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activities, contactId]
  )

  const lastActivity = contactActivities[0] ?? null
  const daysSinceLastActivity = lastActivity ? daysSince(lastActivity.createdAt) : null
  const [dismissed, setDismissed] = useState(false)
  const showFollowUp =
    daysSinceLastActivity !== null && daysSinceLastActivity > 7 && !dismissed

  const relScore = useMemo(() => {
    const hasActive = contactDeals.some((d) => !["won", "lost"].includes(d.stage))
    return calculateRelationshipScore(
      contactActivities.length,
      lastActivity?.createdAt ?? null,
      hasActive
    )
  }, [contactActivities, lastActivity, contactDeals])

  const relLabel = getRelationshipLabel(relScore)

  const handleEditContact = useCallback(
    (updated: CreateContactInput & { id?: string }) => {
      if (updated.id) updateContact(updated.id, updated)
      setShowEditModal(false)
    },
    [updateContact]
  )

  const handleAddActivity = useCallback(
    (activity: Activity) => {
      addActivities([activity])
      setShowActivityModal(false)
    },
    [addActivities]
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

  const handleDeleteContact = useCallback(() => {
    deleteContact(contactId)
    toast.success("Contact deleted successfully")
    navigate("/contacts")
  }, [deleteContact, contactId, navigate])

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks])
  const topTasks = useMemo(() => sortedTasks.slice(0, 5), [sortedTasks])

  function relScoreColor(label: string): string {
    if (label === "Hot") return "text-emerald-600 dark:text-emerald-400"
    if (label === "Warm") return "text-amber-600 dark:text-amber-400"
    return "text-slate-500 dark:text-slate-400"
  }

  function relScoreBg(label: string): string {
    if (label === "Hot") return "bg-emerald-500"
    if (label === "Warm") return "bg-amber-500"
    return "bg-slate-400"
  }

  function relScorePct(label: string): number {
    if (label === "Hot") return 100
    if (label === "Warm") return 60
    return 30
  }

  if (!userLoaded || !contactsLoaded || !activitiesLoaded || !dealsLoaded || !tasksLoaded) {
    return <DetailSkeleton />
  }


  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-sm font-medium text-slate-500">Contact not found</h2>
        <Link href="/contacts">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4" /> Back to Contacts
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto p-3 md:p-5 max-w-full">
        <div className="space-y-4 animate-fade-in">

          {/* Follow-up banner */}
          {showFollowUp && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400 flex-1">
                It has been {daysSinceLastActivity} days since your last touchpoint. Consider following up.
              </span>
              <button
                onClick={() => setDismissed(true)}
                className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 shrink-0 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Back button */}
          <Link
            href="/contacts"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          {/* Contact Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight">{contact.name}</h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg">
                    {SOURCE_LABELS[contact.source]}
                  </span>
                </div>

                <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" /> {contact.email}
                  </span>
                  {contact.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" /> {contact.phone}
                    </span>
                  )}
                  {contact.company && (
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400" /> {contact.company}
                    </span>
                  )}
                </div>

                {/* Relationship Score */}
                <div className="flex items-center gap-5 mt-3">
                  <div className={cn("text-4xl font-bold tracking-tight", relScoreColor(relLabel))}>
                    {relScore}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Relationship · {relLabel}
                    </div>
                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", relScoreBg(relLabel))}
                        style={{ width: `${relScorePct(relLabel)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 shrink-0 flex-wrap">
                <Button
                  variant="outlineNeutral"
                  onClick={() => setShowEditModal(true)}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowActivityModal(true)}
                >
                  <PlusCircle className="h-4 w-4" /> Log Activity
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
                  <Button
                    variant="outlineNeutral"
                    size="sm"
                    onClick={() => setShowActivityModal(true)}
                  >
                    <PlusCircle className="h-4 w-4" /> Log Activity
                  </Button>
                </div>

                {contactActivities.length === 0 ? (
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
                      {contactActivities.map((a) => (
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
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                              {a.content}
                            </p>
                            {a.dealId && (
                              <div className="mt-2">
                                <Link
                                  href={`/deals/${a.dealId}`}
                                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                                >
                                  {deals.find((d) => d.id === a.dealId)?.title ?? "View Deal"} →
                                </Link>
                              </div>
                            )}
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
              {/* Contact Info */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">Contact Info</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Source</div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{SOURCE_LABELS[contact.source]}</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Owner</div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">You</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Created</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{relativeTime(contact.createdAt || new Date().toISOString())}</p>
                  </div>
                </div>
              </div>

              {/* Active Deals */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">Active Deals</h2>
                {contactDeals.length === 0 ? (
                  <div className="py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No associated deals.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contactDeals.map((d: Deal) => (
                      <Link key={d.id} href={`/deals/${d.id}`}>
                        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 hover:border-teal-300 dark:hover:border-teal-700/50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{d.title}</span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                              d.stage === "won" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                                d.stage === "lost" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" :
                                  "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            )}>{STAGE_LABELS[d.stage]}</span>
                          </div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCurrency(d.value)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Tasks</h2>
                    <span className="bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-bold px-2 py-0.5 rounded-md">
                      {tasks.filter((t) => t.status !== "completed").length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAddTaskModal(true)}
                    className="h-8 w-8 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
                  >
                    <PlusCircle className="h-4 w-4" />
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
                              "hover:border-teal-300 dark:hover:border-teal-700/50",
                              isComp && "opacity-60"
                            )}
                          >
                            <button
                              onClick={(e) => handleToggleTask(e, task)}
                              className="shrink-0 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            >
                              {isComp ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover/task:text-emerald-600" />
                              ) : (
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 transition-colors",
                                    isOverdueTask
                                      ? "border-rose-300 group-hover/task:border-rose-500"
                                      : "border-slate-300 dark:border-slate-600 group-hover/task:border-teal-500"
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
                        <Link href={`/tasks?entityType=contact&entityId=${contactId}`}>
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
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl sm:max-w-[500px]">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Edit Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            initialData={contact}
            onSave={handleEditContact}
            onCancel={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Activity modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="p-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl sm:max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shrink-0">
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Log Activity</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <ActivityForm
              contactId={contactId}
              deals={contactDeals}
              onSave={handleAddActivity}
              onCancel={() => setShowActivityModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Contact"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{contact.name}</strong>?
            This action cannot be undone and will permanently remove this contact and all associated data.
          </>
        }
        onDelete={handleDeleteContact}
        cancelText="Cancel"
        deleteText="Delete Contact"
      />

      <AddTaskModal
        open={showAddTaskModal}
        onOpenChange={setShowAddTaskModal}
        fixedEntity={{ type: "contact", id: contactId, name: contact.name }}
        onSave={(task) => addTaskItems([task])}
        userId={userId || ""}
      />

      <EditTaskModal
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(o) => !o && setEditingTask(null)}
        onUpdate={updateTaskItem}
        onDelete={deleteTaskItem}
        user={user}
      />
    </div>
  )
}
