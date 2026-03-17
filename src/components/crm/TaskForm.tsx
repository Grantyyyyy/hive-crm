import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Task, Contact, Deal, Lead } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface TaskFormProps {
  onSave: (task: Task) => void
  contacts: Contact[]
  deals: Deal[]
  leads: Lead[]
  initialData?: Partial<Task>
  fixedEntity?: { type: 'contact' | 'deal' | 'lead'; id: string; name: string }
  userId: string
}

export function TaskForm({ onSave, contacts, deals, leads, initialData, fixedEntity, userId }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : ""
  )
  const [priority, setPriority] = useState<Task['priority']>(initialData?.priority ?? "medium")
  const [status, setStatus] = useState<Task['status']>(initialData?.status ?? "open")
  
  const [entityType, setEntityType] = useState<'contact' | 'deal' | 'lead' | 'none'>(
    fixedEntity?.type ?? (initialData?.entityType ?? "none")
  )
  const [entityId, setEntityId] = useState(
    fixedEntity?.id ?? (initialData?.entityId ?? "")
  )
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (!dueDate) newErrors.dueDate = "Due date is required"
    if (entityType !== 'none' && !entityId) {
      newErrors.entityId = `Please select a ${entityType}`
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const now = new Date().toISOString()
    const task: Task = {
      id: initialData?.id ?? generateId(),
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: new Date(dueDate).toISOString(),
      priority,
      status,
      ownerId: initialData?.ownerId ?? userId,
      createdBy: initialData?.createdBy ?? userId,
      entityType: entityType === 'none' ? undefined : (entityType as any),
      entityId: entityType === 'none' ? undefined : entityId,
      completedAt: status === 'completed' ? (initialData?.completedAt ?? now) : undefined,
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
    }
    onSave(task)
  }

  const priorities: Task['priority'][] = ["low", "medium", "high", "urgent"]
  const statuses: Task['status'][] = ["open", "in-progress", "completed"]

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6 pt-2 font-mono">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="task-title" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Title *</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Follow up with Sarah"
          className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-10 bg-[var(--bg-elevated)]"
        />
        {errors.title && <p className="text-[11px] text-[var(--red)] uppercase tracking-wider mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="task-desc" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Description</Label>
        <Textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief details about this task..."
          rows={3}
          className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none bg-[var(--bg-elevated)] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="task-date" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Due Date *</Label>
          <Input
            id="task-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-10 bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          />
          {errors.dueDate && <p className="text-[11px] text-[var(--red)] uppercase tracking-wider mt-1">{errors.dueDate}</p>}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Status</Label>
          <div className="flex border border-[var(--border)] h-10 bg-[var(--bg-elevated)]">
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "flex-1 text-[11px] uppercase tracking-wider transition-colors",
                  status === s 
                    ? "bg-[var(--accent)] text-white" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {s.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Priority</Label>
        <div className="flex border border-[var(--border)] h-10 bg-[var(--bg-elevated)]">
          {priorities.map((p) => {
            const isActive = priority === p
            let activeClass = ""
            if (isActive) {
              if (p === 'urgent') activeClass = "bg-[rgba(239,68,68,0.2)] text-[var(--red)] border-[var(--red)]"
              else if (p === 'high') activeClass = "bg-[rgba(245,158,11,0.2)] text-[var(--amber)] border-[var(--amber)]"
              else if (p === 'medium') activeClass = "bg-[rgba(var(--accent-rgb),0.2)] text-[var(--accent)] border-[var(--accent)]"
              else activeClass = "bg-[var(--bg-highlight)] text-[var(--text-primary)] border-[var(--text-muted)]"
            }
            
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "flex-1 text-[11px] uppercase tracking-wider transition-colors border-2 border-transparent",
                  isActive ? activeClass : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* Linked To */}
      {!fixedEntity && (
        <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Linked To</Label>
            <div className="flex border border-[var(--border)] h-10 bg-[var(--bg-elevated)]">
              {(['none', 'contact', 'deal', 'lead'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setEntityType(t)
                    setEntityId("")
                  }}
                  className={cn(
                    "flex-1 text-[11px] uppercase tracking-wider transition-colors",
                    entityType === t 
                      ? "bg-[var(--bg-highlight)] text-[var(--text-primary)]" 
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {entityType !== 'none' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="flex h-10 w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text-primary)] shadow-none focus-visible:outline-none focus-visible:border-[var(--accent)] hover:border-[var(--border-subtle)] transition-colors"
                autoFocus
              >
                <option value="">Select a {entityType}...</option>
                {entityType === 'contact' && contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                {entityType === 'deal' && deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                {entityType === 'lead' && leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.company})</option>)}
              </select>
              {errors.entityId && <p className="text-[11px] text-[var(--red)] uppercase tracking-wider mt-1">{errors.entityId}</p>}
            </div>
          )}
        </div>
      )}

      {fixedEntity && (
        <div className="flex items-center gap-2 py-2">
          <span className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Linked to:</span>
          <div className="px-2 py-0.5 bg-[var(--bg-highlight)] border border-[var(--border)] text-[11px] text-[var(--text-primary)] uppercase tracking-wider">
            {fixedEntity.type}: {fixedEntity.name}
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full rounded-none border-none bg-[var(--accent)] text-white h-10 text-[12px] uppercase tracking-[0.08em] hover:opacity-85 transition-opacity mt-4 font-mono shadow-none"
      >
        {initialData?.id ? "Update Task" : "Create Task"}
      </Button>
    </form>
  )
}
