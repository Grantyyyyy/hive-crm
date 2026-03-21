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
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:          { bg: "var(--blue)",           text: "var(--blue)" },
  contacted:    { bg: "var(--accent-dim)",     text: "var(--accent)" },
  qualified:    { bg: "rgba(61,214,140,0.12)", text: "var(--green)" },
  unqualified:  { bg: "var(--bg-elevated)",    text: "var(--text-muted)" },
  converted:    { bg: "rgba(61,214,140,0.12)", text: "var(--green)" },
}

const activityColorMap: Record<string, string> = {
  call: "var(--blue)",
  email: "var(--accent)",
  note: "var(--amber)",
  meeting: "var(--green)",
}

export function LeadDetail() {
  const [, params] = useRoute("/leads/:id")
  const [, navigate] = useLocation()
  const leadId = params?.id ?? ""

  const { 
    data: leads, 
    updateItem: updateLead,
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
    updateItem: updateTaskItem,
    isLoaded: tasksLoaded
  } = useCRMResource<Task>('tasks')

  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
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
  const sc = lead ? STATUS_COLORS[lead.status] : STATUS_COLORS.new

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

  function scoreColor(score: number): string {
    if (score > 70) return "var(--green)"
    if (score >= 40) return "var(--amber)"
    return "var(--red)"
  }

  if (!leadsLoaded || !activitiesLoaded || !tasksLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-base)]">
        <div className="h-8 w-8 animate-spin rounded-none border-2 border-[var(--accent)] border-r-transparent" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)]">
        <h2 className="text-[14px] font-mono text-[var(--text-primary)]">Lead not found</h2>
        <Link href="/leads">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[var(--bg-base)] font-mono min-h-screen text-[var(--text-primary)]">
      {/* Read-only banner for converted leads */}
      {isConverted && (
        <div className="bg-[var(--bg-elevated)] border-b border-[var(--border)] px-4 md:px-8 py-3 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="text-[12px] text-[var(--text-muted)] font-mono">
            This lead was converted on {new Date(lead.convertedAt!).toLocaleDateString()} — record is read-only
          </span>
        </div>
      )}

      <div className="mx-auto p-4 md:p-8 max-w-5xl">
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Back button */}
          <Link
            href="/leads"
            className="inline-flex items-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-2" /> Back
          </Link>

          {/* Lead Header */}
          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-[28px] font-serif font-normal leading-none">{lead.name}</h1>
                  <span
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    {isConverted && <Lock className="w-3 h-3" />}
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                  <span className="inline-flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-[11px] uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                    {LEAD_SOURCE_LABELS[lead.source]}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-5 text-[13px] text-[var(--text-secondary)]">
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {lead.email}
                  </span>
                  {lead.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {lead.phone}
                    </span>
                  )}
                  {lead.company && (
                    <span className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {lead.company}
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-[32px] font-serif leading-none" style={{ color: scoreColor(lead.score) }}>{lead.score}</div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Lead Score</div>
                    <div className="w-24 h-[4px] bg-[var(--bg-elevated)] rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${lead.score}%`, backgroundColor: scoreColor(lead.score) }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                {!isConverted && (
                  <>
                  <>
                    <Button
                      variant="outlineNeutral"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      className="px-3"
                    >
                      <Pencil className="h-3 w-3 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowConvertModal(true)}
                      className="px-3"
                    >
                      Convert Lead
                    </Button>
                  </>
                  </>
                )}
                {isConverted && (
                  <span className="inline-flex items-center gap-1 bg-[rgba(61,214,140,0.12)] text-[var(--green)] text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                    <Lock className="w-3 h-3" /> Converted
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notes */}
              <div className="space-y-3">
                <h2 className="text-[13px] uppercase tracking-[0.12em] text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">Notes</h2>
                <Textarea
                  defaultValue={lead.notes ?? ""}
                  onBlur={(e) => handleNotesBlur(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={4}
                  disabled={isConverted}
                  className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] font-mono resize-y disabled:opacity-60"
                />
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <h2 className="text-[13px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Activity Timeline</h2>
                  {!isConverted && (
                    <Button
                      variant="outlineNeutral"
                      size="sm"
                      onClick={() => setShowActivityModal(true)}
                      className="h-7 px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Log
                    </Button>
                  )}
                </div>

                {leadActivities.length === 0 ? (
                  <div className="py-12 border border-[var(--border)] bg-[var(--bg-surface)] text-center">
                    <ActivityIcon className="h-8 w-8 mx-auto text-[var(--text-muted)] mb-3 opacity-50" />
                    <p className="text-[13px] text-[var(--text-muted)]">
                      No activities yet. Log an interaction above.
                    </p>
                  </div>
                ) : (
                  <div className="relative pt-2 pl-[80px]">
                    <div className="absolute top-4 bottom-0 left-[80px] w-px bg-[var(--border)]" />
                    <div className="space-y-6">
                      {leadActivities.map((a) => (
                        <div key={a.id} className="relative flex items-start group">
                          <div className="absolute right-[calc(100%+24px)] w-[60px] text-[11px] text-[var(--text-muted)] text-right top-1">
                            {relativeTime(a.createdAt).replace(/ ago/i, '')}
                          </div>
                          <div 
                            className="absolute left-[-3px] top-1.5 w-[6px] h-[6px] rounded-full z-10" 
                            style={{ backgroundColor: activityColorMap[a.type] || "var(--text-muted)" }}
                          />
                          <div className="pl-6 w-full pb-2">
                            <p className="text-[13px] leading-relaxed text-[var(--text-primary)]">{a.content}</p>
                            <span className="inline-flex bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[11px] uppercase tracking-widest px-1.5 py-0.5 rounded-none border border-[var(--border)] mt-2">
                              {a.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Conversion result */}
              {isConverted && (
                <div className="space-y-3">
                  <h2 className="text-[13px] uppercase tracking-[0.12em] text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">Conversion</h2>
                  <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                    {lead.convertedToContactId && (
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Contact Created</div>
                        <Link
                          href={`/contacts/${lead.convertedToContactId}`}
                          className="text-[13px] text-[var(--accent)] hover:underline"
                        >
                          View Contact
                        </Link>
                      </div>
                    )}
                    {lead.convertedToDealId && (
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Deal Created</div>
                        <Link
                          href="/deals"
                          className="text-[13px] text-[var(--accent)] hover:underline"
                        >
                          View Deals
                        </Link>
                      </div>
                    )}
                    {lead.convertedAt && (
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Converted</div>
                        <p className="text-[13px] text-[var(--text-secondary)]">{relativeTime(lead.convertedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lead Info */}
              <div className="space-y-3">
                <h2 className="text-[13px] uppercase tracking-[0.12em] text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">Lead Info</h2>
                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Source</div>
                    <p className="text-[13px] text-[var(--text-primary)]">{LEAD_SOURCE_LABELS[lead.source]}</p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Owner</div>
                    <p className="text-[13px] text-[var(--text-primary)]">You</p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Created</div>
                    <p className="text-[13px] text-[var(--text-secondary)]">{relativeTime(lead.createdAt)}</p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Last Updated</div>
                    <p className="text-[13px] text-[var(--text-secondary)]">{relativeTime(lead.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-mono">Tasks</h2>
                    <span className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 min-w-[1.2rem] text-center">{tasks.filter(t => t.status !== 'completed').length}</span>
                  </div>
                  {!isConverted && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowAddTaskModal(true)}
                      className="h-5 w-5 p-0 text-[var(--text-muted)] hover:text-[var(--accent)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                
                {tasks.length === 0 ? (
                  <div className="py-8 border border-[var(--border)] bg-[var(--bg-surface)] text-center">
                    <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
                      No tasks for this lead.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border border-[var(--border)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]">
                      {topTasks.map(task => {
                        const isOverdueTask = isOverdue(task)
                        const isComp = task.status === 'completed'
                        
                        return (
                          <div 
                            key={task.id}
                            onClick={() => setEditingTask(task)}
                            className={cn(
                              "flex items-center h-[38px] px-3 gap-3 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group/task",
                              !isComp && isOverdueTask && "border-l-2 border-[var(--red)]",
                              isComp && "opacity-60"
                            )}
                          >
                            <button 
                              onClick={(e) => handleToggleTask(e, task)}
                              disabled={isConverted}
                              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                            >
                              {isComp ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                              ) : (
                                <div className="w-3.5 h-3.5 border border-[var(--border)] group-hover/task:border-[var(--accent)]" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "text-[12px] truncate",
                                isComp ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                              )}>
                                {task.title}
                              </div>
                            </div>

                            <div className={cn(
                              "text-[10px] shrink-0 text-right",
                              isComp ? "text-[var(--text-muted)]" : (isOverdueTask ? "text-[var(--red)]" : "text-[var(--text-secondary)]")
                            )}>
                              {isComp ? "Done" : (isOverdueTask ? "Past" : relativeTime(task.dueDate).replace(' ago', ''))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {tasks.length > 5 && (
                      <div className="flex justify-end">
                        <Link href={`/tasks?entityType=lead&entityId=${leadId}`}>
                          <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] hover:underline cursor-pointer">
                            View all tasks →
                          </span>
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
        <div className="bg-[var(--bg-surface)] border-[var(--border)] rounded-none shadow-none text-[var(--text-primary)] font-mono sm:max-w-[500px]">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-[14px] font-serif font-normal uppercase tracking-widest text-[var(--text-muted)]">Edit Lead</DialogTitle>
          </DialogHeader>
          <LeadForm
            userId={userId}
            initialData={lead}
            onSave={handleEditLead}
            onCancel={() => setShowEditModal(false)}
          />
        </div>
      </Dialog>

      {/* Activity modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <div className="bg-[var(--bg-surface)] border-[var(--border)] rounded-none shadow-none text-[var(--text-primary)] font-mono sm:max-w-[500px]">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-[14px] font-serif font-normal uppercase tracking-widest text-[var(--text-muted)]">Log Activity</DialogTitle>
          </DialogHeader>
          <ActivityForm
            contactId=""
            onSave={handleAddActivity}
          />
        </div>
      </Dialog>
      {/* Convert modal */}
      {lead && !isConverted && (
        <ConvertLeadModal
          open={showConvertModal}
          onOpenChange={setShowConvertModal}
          lead={lead}
          onConverted={handleConverted}
        />
      )}

      <AddTaskModal 
        open={showAddTaskModal} 
        onOpenChange={setShowAddTaskModal}
        fixedEntity={{ type: 'lead', id: leadId, name: lead.name }}
      />

      <EditTaskModal 
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(o) => !o && setEditingTask(null)}
      />
    </div>
  )
}
