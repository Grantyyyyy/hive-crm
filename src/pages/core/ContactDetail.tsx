import { useState, useMemo, useCallback, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import { useRoute, Link } from "wouter"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Plus,
  Pencil,
  AlertTriangle,
  X,
  Activity as ActivityIcon,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ContactForm } from "@/components/crm/ContactForm"
import { ActivityForm } from "@/components/crm/ActivityForm"
import {
  contactsApi,
  dealsApi,
  activitiesApi,
  tasksApi,
} from "@/lib/api"
import {
  relativeTime,
  daysSince,
  formatCurrency,
  calculateRelationshipScore,
  getRelationshipLabel,
  isOverdue,
  sortTasks,
} from "@/lib/helpers"
import type { Contact, Activity, Deal, Task } from "@/lib/types"
import {
  SOURCE_LABELS,
  STAGE_LABELS,
} from "@/lib/types"
import { AddTaskModal } from "@/components/crm/AddTaskModal"
import { EditTaskModal } from "@/components/crm/EditTaskModal"

export function ContactDetail() {
  const { user } = useUser()
  const userId = user?.id ?? ""
  const [, params] = useRoute("/contacts/:id")
  const contactId = params?.id ?? ""

  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!userId || !contactId) return
      setLoading(true)
      try {
        const [contactRes, dealsRes, activitiesRes, tasksRes] = await Promise.all([
          contactsApi.getOne(contactId),
          dealsApi.list({ contactId }),
          activitiesApi.list({ contactId }),
          tasksApi.list({ entityType: 'contact', entityId: contactId }),
        ])
        
        if (contactRes.success && contactRes.data) {
          setContact(contactRes.data)
        }
        if (dealsRes.success && dealsRes.data) {
          setDeals(dealsRes.data.map((d: any) => ({ ...d, stage: d.stage?.toLowerCase() })))
        }
        if (activitiesRes.success && activitiesRes.data) {
          setActivities(activitiesRes.data.map((a: any) => ({ ...a, type: a.type?.toLowerCase() })))
        }
        if (tasksRes.success && tasksRes.data) {
          setTasks(tasksRes.data.map((t: any) => ({ ...t, status: t.status?.replace('_', '-')?.toLowerCase(), priority: t.priority?.toLowerCase() })))
        }
      } catch (error) {
        console.error('Error fetching contact data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId, contactId])

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

  const daysSinceLastActivity = lastActivity
    ? daysSince(lastActivity.createdAt)
    : null

  const showFollowUp =
    daysSinceLastActivity !== null &&
    daysSinceLastActivity > 7 &&
    !dismissed.includes(contactId)

  const relScore = useMemo(() => {
    const hasActive = contactDeals.some(
      (d) => !["won", "lost"].includes(d.stage)
    )
    return calculateRelationshipScore(
      contactActivities.length,
      lastActivity?.createdAt ?? null,
      hasActive
    )
  }, [contactActivities, lastActivity, contactDeals])

  const relLabel = getRelationshipLabel(relScore)

  const handleDismissFollowUp = useCallback(() => {
    setDismissed(prev => [...prev, contactId])
  }, [contactId])

  const handleEditContact = useCallback(async (updated: Partial<Contact>) => {
    try {
      if (updated.id) {
        await contactsApi.update(updated.id, updated)
        setContact(prev => prev ? { ...prev, ...updated } : null)
        setShowEditModal(false)
      }
    } catch (error) {
      console.error('Error updating contact:', error)
    }
  }, [])

  const handleAddActivity = useCallback(async (activity: Omit<Activity, 'id'>) => {
    try {
      const response = await activitiesApi.create(activity)
      if (response.success && response.data) {
        setActivities(prev => [{ ...response.data, type: response.data.type?.toLowerCase() }, ...prev])
        setShowActivityModal(false)
      }
    } catch (error) {
      console.error('Error creating activity:', error)
    }
  }, [])

  const handleToggleTask = useCallback(async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    try {
      await tasksApi.update(task.id, { status: 'COMPLETED' })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t))
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }, [])

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks])
  const topTasks = useMemo(() => sortedTasks.slice(0, 5), [sortedTasks])

  function getRelationshipDots(label: string) {
    const dots = [1, 2, 3];
    let activeCount = 1;
    let activeColor = "bg-[var(--text-muted)]";

    if (label === "Warm") {
      activeCount = 2;
      activeColor = "bg-[var(--amber)]";
    } else if (label === "Hot") {
      activeCount = 3;
      activeColor = "bg-[var(--green)]";
    }

    return (
      <div className="flex gap-1 items-center">
        {dots.map(d => (
          <div
            key={d}
            className={`w-[6px] h-[6px] rounded-full ${d <= activeCount ? activeColor : 'bg-[var(--border)]'}`}
          />
        ))}
      </div>
    );
  }

  const activityColorMap: Record<string, string> = {
    call: "var(--blue)",
    email: "var(--accent)",
    note: "var(--amber)",
    meeting: "var(--green)",
  }

  const dealBorderColorMap: Record<string, string> = {
    won: "var(--green)",
    lost: "var(--red)",
    lead: "transparent",
    contacted: "transparent",
    proposal: "transparent",
    negotiation: "transparent"
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-base)]">
        <p className="text-[14px] font-mono text-[var(--text-muted)]">Loading...</p>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)]">
        <h2 className="text-[14px] font-mono text-[var(--text-primary)]">Contact not found</h2>
        <Link href="/contacts">
          <Button variant="outlineNeutral">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Contacts
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[var(--bg-base)] font-mono min-h-screen text-[var(--text-primary)]">
      <div className="mx-auto p-4 md:p-8 max-w-5xl">
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Back button */}
          <Link
            href="/contacts"
            className="inline-flex items-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-2" /> Back
          </Link>

          {/* Follow-up banner */}
          {showFollowUp && (
            <div className="border border-[var(--amber)] bg-[var(--bg-surface)] p-4 flex items-start gap-3 rounded-none">
              <AlertTriangle className="h-4 w-4 text-[var(--amber)] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
                  It's been {daysSinceLastActivity} days since your last touchpoint. Consider following up.
                </p>
              </div>
              <button
                onClick={handleDismissFollowUp}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-[28px] font-serif font-normal leading-none">{contact.name}</h1>
                  <span className="inline-flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-[11px] uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                    {SOURCE_LABELS[contact.source as keyof typeof SOURCE_LABELS] || contact.source}
                  </span>
                </div>

                <div className="flex flex-wrap gap-5 text-[13px] text-[var(--text-secondary)]">
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {contact.email}
                  </span>
                  {contact.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {contact.phone}
                    </span>
                  )}
                  {contact.company && (
                    <span className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-[var(--text-muted)]" />{" "}
                      {contact.company}
                    </span>
                  )}
                </div>

                {/* Relationship strength */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Relationship</span>
                  {getRelationshipDots(relLabel)}
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                    {relLabel}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
              <div className="flex gap-2 shrink-0">
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
                  onClick={() => setShowActivityModal(true)}
                  className="px-3"
                >
                  <Plus className="h-3 w-3 mr-2" /> Log Activity
                </Button>
              </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Activity timeline */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-[13px] uppercase tracking-[0.12em] text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">Activity Timeline</h2>

              {contactActivities.length === 0 ? (
                <div className="py-12 border border-[var(--border)] bg-[var(--bg-surface)] text-center">
                  <ActivityIcon className="h-8 w-8 mx-auto text-[var(--text-muted)] mb-3 opacity-50" />
                  <p className="text-[13px] text-[var(--text-muted)]">
                    No activities yet. Log an interaction above.
                  </p>
                </div>
              ) : (
                <div className="relative pt-2 pl-[80px]">
                  {/* Vertical Line */}
                  <div className="absolute top-4 bottom-0 left-[80px] w-px bg-[var(--border)]" />

                  <div className="space-y-6">
                    {contactActivities.map((a) => (
                      <div key={a.id} className="relative flex items-start group">
                        {/* Timestamp (Left Col) */}
                        <div className="absolute right-[calc(100%+24px)] w-[60px] text-[11px] text-[var(--text-muted)] text-right top-1">
                          {relativeTime(a.createdAt).replace(/ ago/i, '')}
                        </div>

                        {/* Dot (Center) */}
                        <div
                          className="absolute left-[-3px] top-1.5 w-[6px] h-[6px] rounded-full z-10"
                          style={{ backgroundColor: activityColorMap[a.type] || "var(--text-muted)" }}
                        />

                        {/* Content (Right Col) */}
                        <div className="pl-6 w-full pb-2">
                          <p className="text-[13px] leading-relaxed text-[var(--text-primary)]">
                            {a.content}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[11px] uppercase tracking-widest px-1.5 py-0.5 rounded-none border border-[var(--border)]">
                              {a.type}
                            </span>

                            {a.dealId && deals.find((d) => d.id === a.dealId) && (
                              <span className="inline-flex bg-[var(--accent-dim)] text-[var(--accent)] text-[11px] uppercase tracking-widest px-1.5 py-0.5 rounded-none">
                                {deals.find((d) => d.id === a.dealId)?.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar column */}
            <div className="space-y-6">
              {/* Deals sidebar */}
              <div className="space-y-4">
                <h2 className="text-[13px] uppercase tracking-[0.12em] text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">Active Deals</h2>

                {contactDeals.length === 0 ? (
                  <div className="py-8 border border-[var(--border)] bg-[var(--bg-surface)] text-center">
                    <p className="text-[13px] text-[var(--text-muted)]">
                      No associated deals.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contactDeals.map((d: Deal) => (
                      <div
                        key={d.id}
                        className="border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex flex-col gap-2 hover:border-[var(--accent)] transition-colors cursor-pointer"
                        style={{ borderLeftWidth: ['won', 'lost'].includes(d.stage) ? '3px' : '1px', borderLeftColor: dealBorderColorMap[d.stage] || "var(--border)" }}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[13px] font-medium leading-tight text-[var(--text-primary)]">
                            {d.title}
                          </span>
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: dealBorderColorMap[d.stage] || "var(--border)" }}
                          />
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <p className="text-[13px] font-mono font-medium text-[var(--text-primary)]">
                            {formatCurrency(d.value)}
                          </p>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {STAGE_LABELS[d.stage as keyof typeof STAGE_LABELS] || d.stage}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-mono">Tasks</h2>
                    <span className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 min-w-[1.2rem] text-center">{tasks.filter(t => t.status !== 'completed').length}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddTaskModal(true)}
                    className="h-5 w-5 p-0 text-[var(--text-muted)] hover:text-[var(--accent)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {tasks.length === 0 ? (
                  <div className="py-8 border border-[var(--border)] bg-[var(--bg-surface)] text-center">
                    <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
                      No tasks for this contact.
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
                              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
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
                        <Link href={`/tasks?entityType=contact&entityId=${contactId}`}>
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
            <DialogTitle className="text-[14px] font-serif font-normal uppercase tracking-widest text-[var(--text-muted)]">Edit Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            initialData={contact}
            onSave={handleEditContact}
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
            contactId={contactId}
            deals={contactDeals}
            onSave={handleAddActivity}
          />
        </div>
      </Dialog>

      <AddTaskModal
        open={showAddTaskModal}
        onOpenChange={setShowAddTaskModal}
        fixedEntity={{ type: 'contact', id: contactId, name: contact.name }}
        onSuccess={() => {
          tasksApi.list({ entityType: 'contact', entityId: contactId }).then(res => {
            if (res.success && res.data) {
              setTasks(res.data.map((t: any) => ({ ...t, status: t.status?.replace('_', '-')?.toLowerCase(), priority: t.priority?.toLowerCase() })))
            }
          })
        }}
      />

      <EditTaskModal
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(o) => !o && setEditingTask(null)}
        onSuccess={() => {
          tasksApi.list({ entityType: 'contact', entityId: contactId }).then(res => {
            if (res.success && res.data) {
              setTasks(res.data.map((t: any) => ({ ...t, status: t.status?.replace('_', '-')?.toLowerCase(), priority: t.priority?.toLowerCase() })))
            }
          })
        }}
      />
    </div>
  )
}
