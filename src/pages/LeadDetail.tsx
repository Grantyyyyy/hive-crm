import { useState, useMemo, useCallback } from "react"
import { useLocation, useRoute, Link } from "wouter"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Plus,
  Pencil,
  Lock,
  Activity as ActivityIcon,
  Trash2,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LeadForm } from "@/components/crm/LeadForm"
import { ActivityForm } from "@/components/crm/ActivityForm"
import { ConvertLeadModal } from "@/components/crm/ConvertLeadModal"
import { relativeTime, calculateLeadScore, isOverdue, sortTasks } from "@/lib/helpers"
import type { Lead, Activity, Task } from "@/lib/types"
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/lib/types"
import { AddTaskModal } from "@/components/crm/AddTaskModal"
import { EditTaskModal } from "@/components/crm/EditTaskModal"
import { useCRMResource } from "@/lib/hooks"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DeleteModal } from "@/components/ui/delete-modal"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  contacted: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  qualified: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  unqualified: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400",
  converted: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
}

const activityColorMap: Record<string, string> = {
  call: "bg-blue-500",
  email: "bg-indigo-500",
  note: "bg-amber-500",
  meeting: "bg-emerald-500",
}


export function LeadDetail() {
  const [, params] = useRoute("/leads/:id")
  const [, navigate] = useLocation()
  const leadId = params?.id ?? ""

  const { 
    data: leads, 
    updateItem: updateLead,
    deleteItem: deleteLead,
    isLoaded: leadsLoaded,
    userId
  } = useCRMResource<Lead>('leads')

  const {
    data: activities,
    addItems: addActivities,
    isLoaded: activitiesLoaded
  } = useCRMResource<Activity>('activities')

  const {
    data: allTasks,
    addItems: addTaskItems,
    updateItem: updateTaskItem,
    deleteItem: deleteTaskItem,
    isLoaded: tasksLoaded
  } = useCRMResource<Task>('tasks')

  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const lead = useMemo(() => leads.find(l => l.id === leadId), [leads, leadId])

  const leadActivities = useMemo(
    () => activities
      .filter(a => a.leadId === leadId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activities, leadId]
  )

  const tasks = useMemo(() => 
    allTasks.filter(t => t.entityType === 'lead' && t.entityId === leadId),
    [allTasks, leadId]
  )

  const isConverted = lead?.status === "converted"
  const handleEditLead = useCallback((updated: Lead) => {
    updateLead(updated.id, updated)
    setShowEditModal(false)
  }, [updateLead])

  const handleAddActivity = useCallback((activity: Activity) => {
    const newActivity: Activity = { ...activity, leadId: leadId }
    addActivities([newActivity])
    setShowActivityModal(false)
  }, [addActivities, leadId])

  const handleToggleTask = useCallback((e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    const newStatus = task.status === 'completed' ? 'open' : 'completed'
    updateTaskItem(task.id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
    })
  }, [updateTaskItem])

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks])
  const topTasks = useMemo(() => sortedTasks.slice(0, 5), [sortedTasks])

  const handleNotesBlur = useCallback((notes: string) => {
    if (!lead) return
    const updatedNotes = notes.trim() || undefined
    if (lead.notes === updatedNotes) return // no change
    const updatedLeadData: Partial<Lead> = { notes: updatedNotes, updatedAt: new Date().toISOString() }
    const calculatedScore = calculateLeadScore({ ...lead, ...updatedLeadData })
    updateLead(lead.id, { ...updatedLeadData, score: calculatedScore })
  }, [lead, updateLead])

  const handleConverted = useCallback((contactId: string) => {
    navigate(`/contacts/${contactId}`)
  }, [navigate])

  const handleDeleteLead = useCallback(() => {
    deleteLead(leadId)
    toast.success("Lead deleted successfully")
    navigate("/leads")
  }, [deleteLead, leadId, navigate])

  function scoreColor(score: number): string {
    if (score > 70) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 40) return "text-amber-600 dark:text-amber-400"
    return "text-rose-600 dark:text-rose-400"
  }

  function scoreBg(score: number): string {
    if (score > 70) return "bg-emerald-500"
    if (score >= 40) return "bg-amber-500"
    return "bg-rose-500"
  }

  if (!leadsLoaded || !activitiesLoaded || !tasksLoaded) {
    return <PageSkeleton />
  }

  if (!lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-sm font-medium text-slate-500">Lead not found</h2>
        <Link href="/leads">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 font-sans min-h-screen text-slate-900 dark:text-slate-100">
      {/* Read-only banner for converted leads */}
      {isConverted && (
        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-500 font-medium font-sans">
            This lead was converted on {new Date(lead.convertedAt!).toLocaleDateString()} — record is read-only
          </span>
        </div>
      )}

      <div className="mx-auto p-3 md:p-5 max-w-[1400px]">
        <div className="space-y-4 animate-fade-in">
          
          {/* Back button */}
          <Link
            href="/leads"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>

          {/* Lead Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg",
                    STATUS_COLORS[lead.status] || STATUS_COLORS.new
                  )}>
                    {isConverted && <Lock className="w-3.5 h-3.5" />}
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg">
                    {LEAD_SOURCE_LABELS[lead.source]}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" /> {lead.email}
                  </span>
                  {lead.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" /> {lead.phone}
                    </span>
                  )}
                  {lead.company && (
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400" /> {lead.company}
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="flex items-center gap-5 mt-3">
                  <div className={cn("text-4xl font-bold tracking-tight", scoreColor(lead.score))}>
                    {lead.score}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Lead Score</div>
                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", scoreBg(lead.score))}
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 shrink-0 flex-wrap">
                {!isConverted && (
                  <>
                    <Button
                      variant="outlineNeutral"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setShowConvertModal(true)}
                    >
                      Convert Lead
                    </Button>
                  </>
                )}
                {isConverted && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold px-4 py-2 rounded-xl">
                    <Lock className="w-4 h-4" /> Converted
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Notes */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">Notes</h2>
                <Textarea
                  defaultValue={lead.notes ?? ""}
                  onBlur={(e) => handleNotesBlur(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={4}
                  disabled={isConverted}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus-visible:ring-indigo-500 shadow-sm text-sm"
                />
              </div>

              {/* Activity Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Activity Timeline</h2>
                  {!isConverted && (
                    <Button
                      variant="outlineNeutral"
                      size="sm"
                      onClick={() => setShowActivityModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Log Activity
                    </Button>
                  )}
                </div>

                {leadActivities.length === 0 ? (
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
                      {leadActivities.map((a) => (
                        <div key={a.id} className="relative flex items-start group">
                          <div 
                            className={cn("absolute left-[-26px] top-1 w-3 h-3 rounded-full ring-4 ring-white dark:bg-slate-900 dark:ring-slate-900 z-10", activityColorMap[a.type] || "bg-slate-400")} 
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
              {/* Conversion result */}
              {isConverted && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">Conversion</h2>
                  <div className="space-y-4">
                    {lead.convertedToContactId && (
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Contact Created</div>
                        <Link
                          href={`/contacts/${lead.convertedToContactId}`}
                          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                          View Contact →
                        </Link>
                      </div>
                    )}
                    {lead.convertedToDealId && (
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Deal Created</div>
                        <Link
                          href="/deals"
                          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                          View Deals →
                        </Link>
                      </div>
                    )}
                    {lead.convertedAt && (
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Converted</div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{relativeTime(lead.convertedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lead Info */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">Lead Info</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Source</div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{LEAD_SOURCE_LABELS[lead.source]}</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Owner</div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">You</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Created</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{relativeTime(lead.createdAt)}</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Last Updated</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{relativeTime(lead.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none p-4 md:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Tasks</h2>
                    <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-md">
                      {tasks.filter(t => t.status !== 'completed').length}
                    </span>
                  </div>
                  {!isConverted && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowAddTaskModal(true)}
                      className="h-8 w-8 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {tasks.length === 0 ? (
                  <div className="py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      No tasks.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {topTasks.map(task => {
                        const isOverdueTask = isOverdue(task)
                        const isComp = task.status === 'completed'
                        
                        return (
                          <div 
                            key={task.id}
                            onClick={() => setEditingTask(task)}
                            className={cn(
                              "flex items-center p-3 gap-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border transition-colors cursor-pointer group/task",
                              !isComp && isOverdueTask ? "border-rose-200 dark:border-rose-900/50" : "border-slate-200 dark:border-slate-800/50",
                              "hover:border-indigo-300 dark:hover:border-indigo-700/50",
                              isComp && "opacity-60"
                            )}
                          >
                            <button 
                              onClick={(e) => handleToggleTask(e, task)}
                              disabled={isConverted}
                              className="shrink-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
                            >
                              {isComp ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover/task:text-emerald-600" />
                              ) : (
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 transition-colors",
                                  isOverdueTask ? "border-rose-300 group-hover/task:border-rose-500" : "border-slate-300 dark:border-slate-600 group-hover/task:border-indigo-500"
                                )} />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "text-sm font-medium truncate",
                                isComp ? "line-through text-slate-500" : "text-slate-900 dark:text-slate-100"
                              )}>
                                {task.title}
                              </div>
                            </div>

                            <div className={cn(
                              "text-[10px] font-bold uppercase tracking-widest shrink-0 text-right bg-white dark:bg-slate-900 px-2 py-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-800",
                              isComp ? "text-slate-500" : (isOverdueTask ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400")
                            )}>
                              {isComp ? "Done" : (isOverdueTask ? "Past Due" : relativeTime(task.dueDate).replace(' ago', ''))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {tasks.length > 5 && (
                      <div className="flex justify-center">
                        <Link href={`/tasks?entityType=lead&entityId=${leadId}`}>
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
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Edit Lead</DialogTitle>
          </DialogHeader>
          <LeadForm 
            userId={userId}
            onSave={handleEditLead}
            onCancel={() => setShowEditModal(false)}
            initialData={lead}
          />
        </DialogContent>
      </Dialog>

      {/* Activity modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl sm:max-w-[500px]">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Log Activity</DialogTitle>
          </DialogHeader>
          <ActivityForm
            contactId=""
            onSave={handleAddActivity}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Lead"
        description={
          <>
            Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100 font-bold">{lead.name}</strong>? This action cannot be undone and will permanently remove this lead and all associated activities.
          </>
        }
        onDelete={handleDeleteLead}
        cancelText="Cancel"
        deleteText="Delete Lead"
      />

      {/* Convert modal */}
      {lead && !isConverted && (
        <ConvertLeadModal
          open={showConvertModal}
          onOpenChange={setShowConvertModal}
          lead={lead}
          userId={userId}
          onConverted={handleConverted}
        />
      )}

      <AddTaskModal 
        open={showAddTaskModal} 
        onOpenChange={setShowAddTaskModal}
        fixedEntity={{ type: 'lead', id: leadId, name: lead.name }}
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
