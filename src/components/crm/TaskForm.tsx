import { useState } from "react"
import {
  Type,
  AlignLeft,
  CheckCircle2,
  Link2,
  ChevronDown,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import type { Task, Contact, Deal, Lead } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { cn } from "@/lib/utils"

interface TaskFormProps {
  onSave: (task: Task) => void
  onCancel: () => void
  initialData?: Task
  contacts: Contact[]
  deals: Deal[]
  leads: Lead[]
  fixedEntity?: { type: 'contact' | 'deal' | 'lead'; id: string }
  userId: string
}

export function TaskForm({
  onSave,
  onCancel,
  initialData,
  contacts,
  deals,
  leads,
  fixedEntity,
  userId
}: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? initialData.dueDate.split('T')[0] : "")
  const [priority, setPriority] = useState<Task['priority']>(initialData?.priority ?? "medium")
  const [status, setStatus] = useState<Task['status']>(initialData?.status ?? "open")
  const [entityType, setEntityType] = useState<'none' | 'contact' | 'deal' | 'lead'>(
    fixedEntity?.type ?? initialData?.entityType ?? "none"
  )
  const [entityId, setEntityId] = useState(fixedEntity?.id ?? initialData?.entityId ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (!dueDate) newErrors.dueDate = "Due date is required"
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
      dueDate: dueDate ? new Date(dueDate).toISOString() : now,
      priority,
      status,
      entityType: entityType === 'none' ? undefined : (entityType as any),
      entityId: entityType === 'none' ? undefined : entityId,
      ownerId: initialData?.ownerId ?? userId,
      createdBy: initialData?.createdBy ?? userId,
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
      completedAt: status === 'completed' ? (initialData?.completedAt ?? now) : undefined
    }

    onSave(task)
  }

  const inputClass = "h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-sm transition-all shadow-sm text-slate-900 dark:text-white"
  const labelClass = "text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 block"

  const priorities: Task['priority'][] = ['low', 'medium', 'high', 'urgent']
  const statuses: Task['status'][] = ['open', 'in-progress', 'completed']



  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden font-sans">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">

        {/* Title */}
        <div className="space-y-1.5 animate-content-in [animation-delay:100ms]">
          <Label className={labelClass}>Task Title</Label>
          <div className="relative group">
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up with Sarah"
              className={cn(inputClass, "pl-11", errors.title && "border-red-500")}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 animate-content-in [animation-delay:150ms]">
          <Label className={labelClass}>Description</Label>
          <div className="relative group">
            <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about this task..."
              rows={3}
              className={cn(inputClass, "pl-11 pt-3 resize-none h-auto min-h-[100px]")}
            />
          </div>
        </div>

        {/* Date & Status Row */}
        <div className="grid grid-cols-2 gap-4 animate-content-in [animation-delay:200ms]">
          <div className="space-y-1.5">
            <Label className={labelClass}>Due Date</Label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              className={cn("h-12 py-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900", errors.dueDate && "border-red-500")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Status</Label>
            <div className="relative group">
              <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={cn(inputClass, "w-full appearance-none pl-11 pr-10 cursor-pointer")}
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Priority Toggle */}
        <div className="space-y-3 animate-content-in [animation-delay:250ms]">
          <Label className={labelClass}>Priority Level</Label>
          <div className="grid grid-cols-4 gap-2">
            {priorities.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "h-10 px-3 rounded-md border text-[11px] font-bold uppercase tracking-wider transition-all",
                  priority === p
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Linked To */}
        <div className="space-y-4 animate-content-in [animation-delay:300ms] border-t border-slate-100 dark:border-slate-800 pt-6">
          <Label className={labelClass}>Linked Reference</Label>

          <div className="flex bg-slate-50 dark:bg-slate-900 rounded-md p-1 border border-slate-200 dark:border-slate-800">
            {['none', 'contact', 'deal', 'lead'].map((type) => (
              <button
                key={type}
                type="button"
                disabled={!!fixedEntity}
                onClick={() => {
                  setEntityType(type as any)
                  setEntityId("")
                }}
                className={cn(
                  "flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all",
                  entityType === type
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {!fixedEntity && entityType !== 'none' && (
            <div className="relative group animate-content-in">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <select
                id="task-entity-id"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className={cn(inputClass, "w-full appearance-none pl-11 pr-10 cursor-pointer")}
              >
                <option value="">Select a {entityType}...</option>
                {entityType === 'contact' && contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                {entityType === 'deal' && deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                {entityType === 'lead' && leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-8 py-6 border-t border-slate-100 dark:border-slate-900/50 flex items-center gap-3 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <Button
          type="button"
          variant="outlineNeutral"
          onClick={onCancel}
          className="flex-1 h-12"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          className="flex-[1.5] h-12"
        >
          {initialData?.id ? (
            <>Save Changes</>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Create Task
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
