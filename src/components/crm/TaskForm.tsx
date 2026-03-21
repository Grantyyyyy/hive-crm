import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Task, Contact, Deal, Lead } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import {
  FormField,
  FormInput,
  FormTextarea,
  FormButtonSelect,
} from "@/components/reusables/form-field"

interface TaskFormProps {
  onSave: (task: Task) => void
  contacts: Contact[]
  deals: Deal[]
  leads: Lead[]
  initialData?: Partial<Task>
  fixedEntity?: { type: 'contact' | 'deal' | 'lead'; id: string; name: string }
  userId: string
}

/** Minimal field-like object that satisfies FormField / FieldError's API */
function makeField<T>(name: string, value: T, onChange: (v: T) => void, error?: string) {
  return {
    name,
    state: {
      value,
      meta: { errors: error ? [error] : [] as string[] },
    },
    handleChange: onChange,
    handleBlur: () => { },
  }
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

  const priorityActiveClass = (p: Task['priority'], isActive: boolean) => {
    if (!isActive) return "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    if (p === 'urgent') return "bg-[rgba(239,68,68,0.2)] text-[var(--red)] border-[var(--red)]"
    if (p === 'high') return "bg-[rgba(245,158,11,0.2)] text-[var(--amber)] border-[var(--amber)]"
    if (p === 'medium') return "bg-[rgba(var(--accent-rgb),0.2)] text-[var(--accent)] border-[var(--accent)]"
    return "bg-[var(--bg-highlight)] text-[var(--text-primary)] border-[var(--text-muted)]"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6 pt-2 font-mono">

      {/* Title */}
      <FormField label="Title" field={makeField("task-title", title, setTitle, errors.title)} required>
        <FormInput
          field={makeField("task-title", title, setTitle)}
          placeholder="Follow up with Sarah"
          className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-10 bg-[var(--bg-elevated)]"
        />
      </FormField>

      {/* Description */}
      <FormField label="Description" field={makeField("task-desc", description, setDescription)}>
        <FormTextarea
          field={makeField("task-desc", description, setDescription)}
          placeholder="Brief details about this task..."
          rows={3}
          className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none bg-[var(--bg-elevated)] resize-none"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        {/* Due Date */}
        <FormField label="Due Date" field={makeField("task-date", dueDate, setDueDate, errors.dueDate)} required>
          <FormInput
            field={makeField("task-date", dueDate, setDueDate)}
            type="date"
            className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none h-10 bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          />
        </FormField>

        {/* Status */}
        <FormField label="Status" field={makeField("task-status", status, setStatus as (v: string) => void)}>
          <FormButtonSelect
            field={makeField("task-status", status, setStatus as (v: string) => void)}
            options={statuses}
            renderLabel={(s) => s.replace("-", " ")}
          />
        </FormField>
      </div>

      {/* Priority */}
      <FormField label="Priority" field={makeField("task-priority", priority, setPriority as (v: string) => void)}>
        <FormButtonSelect
          field={makeField("task-priority", priority, setPriority as (v: string) => void)}
          options={priorities}
          getActiveClass={priorityActiveClass as any}
        />
      </FormField>

      {/* Linked To */}
      {!fixedEntity && (
        <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
          <FormField label="Linked To" field={makeField("task-entity-type", entityType, (v) => { setEntityType(v as any); setEntityId("") })}>
            <FormButtonSelect
              field={makeField("task-entity-type", entityType, (v) => { setEntityType(v as any); setEntityId("") })}
              options={['none', 'contact', 'deal', 'lead'] as const}
            />
          </FormField>

          {entityType !== 'none' && (
            <div className="space-y-1.5 flex flex-col animate-in slide-in-from-top-2 duration-200">
              <select
                id="task-entity-id"
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
              {errors.entityId && (
                <span className="text-[10px] text-[var(--red)] font-bold lowercase italic tracking-tight">
                  {errors.entityId}
                </span>
              )}
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
        variant="default"
        className="w-full mt-4"
      >
        {initialData?.id ? "Update Task" : "Create Task"}
      </Button>
    </form>
  )
}
