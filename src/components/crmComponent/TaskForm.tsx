import { useState, useRef } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  Type,
  AlignLeft,
  CheckCircle2,
  Link2,
  ChevronDown,
  FolderOpen,
  Users,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import type { Task, Contact, Deal, Lead, Project } from "@/lib/types"
import { TagSelector } from '@/components/crmComponent/TagSelector'
import { generateId } from "@/lib/helpers"
import { cn } from "@/lib/utils"

interface TaskFormProps {
  onSave: (task: Task) => void
  onCancel: () => void
  initialData?: Task
  contacts: Contact[]
  deals: Deal[]
  leads: Lead[]
  projects: Project[]
  fixedEntity?: { type: 'contact' | 'deal' | 'lead'; id: string }
  fixedProjectId?: string
  userId: string
}

export function TaskForm({
  onSave,
  onCancel,
  initialData,
  contacts,
  deals,
  leads,
  projects,
  fixedEntity,
  fixedProjectId,
  userId
}: TaskFormProps) {
  const { user: clerkUser } = useUser()
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? initialData.dueDate.split('T')[0] : "")
  const [priority, setPriority] = useState<Task['priority']>(initialData?.priority ?? "medium")
  const [status, setStatus] = useState<Task['status']>(initialData?.status ?? "open")
  const [entityType, setEntityType] = useState<'none' | 'contact' | 'deal' | 'lead'>(
    fixedEntity?.type ?? initialData?.entityType ?? "none"
  )
  const [entityId, setEntityId] = useState(fixedEntity?.id ?? initialData?.entityId ?? "")
  const [projectId, setProjectId] = useState(fixedProjectId ?? initialData?.projectId ?? "")
  const [assignedTo, setAssignedTo] = useState<string[]>(initialData?.assignedTo ?? [])
  const [estimatedHours, setEstimatedHours] = useState(String(initialData?.estimatedHours ?? ""))
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tags ?? [])
  // Recurrence state
  const [recurrencePattern, setRecurrencePattern] = useState<Task['recurrencePattern']>(initialData?.recurrencePattern)
  const [recurrenceInterval, setRecurrenceInterval] = useState(initialData?.recurrenceInterval ?? 1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(initialData?.recurrenceEndDate ? initialData.recurrenceEndDate.split('T')[0] : "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const recurrenceOptionsRef = useRef<HTMLDivElement>(null)

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
      projectId: projectId || undefined,
      assignedTo: assignedTo.length > 0 ? assignedTo : undefined,
      estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
      ownerId: initialData?.ownerId ?? userId,
      createdBy: initialData?.createdBy ?? userId,
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
      completedAt: status === 'completed' ? (initialData?.completedAt ?? now) : undefined,
      // Recurrence fields
      recurrencePattern: recurrencePattern || undefined,
      recurrenceInterval: recurrencePattern ? recurrenceInterval : undefined,
      recurrenceEndDate: recurrencePattern && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
      nextOccurrence: recurrencePattern ? calculateNextOccurrence(dueDate, recurrencePattern, recurrenceInterval) : undefined,
      tags: selectedTagIds.length > 0 ? selectedTagIds : undefined
    }

    // Attach a "created" activity log when this is a brand-new task
    if (!initialData) {
      ;(task as any).activities = [{
        id: crypto.randomUUID(),
        taskId: task.id,
        type: 'created',
        description: 'Task created',
        userId: clerkUser?.id || userId,
        userName: clerkUser?.fullName || 'User',
        userAvatar: clerkUser?.imageUrl,
        createdAt: now,
      }]
    }

    onSave(task)
  }

  const calculateNextOccurrence = (dateStr: string, pattern: string, interval: number): string => {
    const date = new Date(dateStr)
    switch (pattern) {
      case 'daily': date.setDate(date.getDate() + interval); break
      case 'weekly': date.setDate(date.getDate() + (interval * 7)); break
      case 'monthly': date.setMonth(date.getMonth() + interval); break
      case 'yearly': date.setFullYear(date.getFullYear() + interval); break
      case 'custom': date.setDate(date.getDate() + interval); break
    }
    return date.toISOString()
  }




  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          {/* Column 1: Primary Info & Tags */}
          <div className="space-y-6">
            <section className="h-full flex flex-col space-y-6 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Basic Details</h3>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task Title</Label>
                <div className="group relative">
                  <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className={cn(
                      "h-11 pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-indigo-500/10",
                      errors.title && "border-red-500 ring-4 ring-red-500/10"
                    )}
                  />
                </div>
                {errors.title && <p className="text-[9px] font-bold text-red uppercase tracking-wide">{errors.title}</p>}
              </div>

              {/* Description - Reclaimed space */}
              <div className="space-y-1.5 flex-1 flex flex-col min-h-[140px]">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</Label>
                <div className="group relative flex-1 flex flex-col">
                  <AlignLeft className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more details or context..."
                    className="flex-1 pl-10 pt-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 resize-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Column 2: Planning & Priority */}
          <div className="space-y-6">
            {/* Action Heavy Section */}
            <section className="space-y-5 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60 h-full">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Planning & Priority</h3>
              </div>

              <div className="grid grid-cols-[1.1fr,0.9fr] gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</Label>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    className={cn(
                      "h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl shadow-sm text-xs",
                      errors.dueDate && "border-red-500 ring-2 ring-red-500/10"
                    )}
                  />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</Label>
                  <div className="relative group">
                    <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-10 pl-9 pr-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm truncate"
                    >
                      <option value="open">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority Level</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'low', color: 'green' },
                    { id: 'medium', color: 'amber' },
                    { id: 'high', color: 'red' },
                    { id: 'urgent', color: 'red' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as any)}
                      className={cn(
                        "h-8 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all scale-100 active:scale-95",
                        priority === p.id
                          ? `bg-${p.color}/10 border-${p.color} text-${p.color} shadow-sm`
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300 shadow-none"
                      )}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="space-y-2 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-3.5 bg-cyan-500 rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Categorization</h3>
          </div>
          <div className="space-y-1.5">
            <TagSelector
              taskId={initialData?.id ?? ''}
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          </div>
        </section>


        {/* Links & Ownership */}
        <section className="space-y-5 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Context & Ownership</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project Association</Label>
              <div className="relative group">
                <FolderOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <select
                  value={projectId}
                  disabled={!!fixedProjectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={cn(
                    "w-full h-11 pl-10 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm",
                    !!fixedProjectId && "opacity-75 cursor-not-allowed bg-slate-50"
                  )}
                >
                  <option value="">None</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignee</Label>
                <div className="relative group">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <select
                    value={assignedTo[0] || ""}
                    onChange={(e) => setAssignedTo(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 pl-10 pr-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  >
                    <option value="">Unassigned</option>
                    <option value={userId}>Me (Individual)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Est. Effort (Hrs)</Label>
                <div className="group relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    type="number"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="0.0"
                    className="h-11 pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold transition-all focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>


          <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-cyan-500 rounded-full" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Linked Reference</h3>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800">
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
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
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
              <div className="relative group animate-in slide-in-from-top-2 duration-200">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <select
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full h-12 pl-12 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
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
        </section>

        {/* Recurrence Section */}
        <section className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Recurrence</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                const newPattern = recurrencePattern ? undefined : 'weekly';
                setRecurrencePattern(newPattern);
                if (newPattern) {
                  setTimeout(() => {
                    recurrenceOptionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }, 150);
                }
              }}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                recurrencePattern
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300"
              )}
            >
              {recurrencePattern ? 'Repeating' : 'Off'}
            </button>
          </div>

          {recurrencePattern && (
            <div ref={recurrenceOptionsRef} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="grid grid-cols-5 gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((pattern) => (
                  <button
                    key={pattern}
                    type="button"
                    onClick={() => setRecurrencePattern(pattern)}
                    className={cn(
                      "py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all",
                      recurrencePattern === pattern
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-indigo-200"
                    )}
                  >
                    {pattern}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 italic">Every</span>
                    <input
                      type="number"
                      min="1"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 h-8 bg-slate-50 dark:bg-slate-900 border-none text-center font-black text-indigo-600 rounded text-sm focus:ring-0"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {recurrencePattern === 'daily' ? 'Days' : recurrencePattern === 'weekly' ? 'Weeks' : recurrencePattern === 'monthly' ? 'Months' : 'Years'}
                    </span>
                  </div>
                </div>

                <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700" />

                <div className="space-y-1 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</p>
                  <DatePicker value={recurrenceEndDate} onChange={setRecurrenceEndDate} className="h-8 border-none bg-slate-50 dark:bg-slate-900" />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sticky Compact Footer */}
      <div className="px-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outlineNeutral"
          onClick={onCancel}
          className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-9 px-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 text-[10px] font-black uppercase tracking-widest"
        >
          {initialData?.id ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
