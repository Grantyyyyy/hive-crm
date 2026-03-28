import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Activity, ActivityType, Deal, Contact } from "@/lib/types"
import { ACTIVITY_TYPES } from "@/lib/types"
import { generateId } from "@/lib/helpers"

interface ActivityFormProps {
  contactId?: string
  deals?: Deal[]
  contacts?: Contact[]
  onSave: (activity: Activity) => void
}

const TYPE_LABELS: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  note: "Note",
  meeting: "Meeting",
}

export function ActivityForm({ contactId, deals, contacts, onSave }: ActivityFormProps) {
  const [type, setType] = useState<ActivityType>("note")
  const [content, setContent] = useState("")
  const [dealId, setDealId] = useState("")
  const [selectedContactId, setSelectedContactId] = useState(contactId || "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!content.trim()) newErrors.content = "Content is required"
    if (!contactId && !selectedContactId) newErrors.contact = "Contact is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSave({
      id: generateId(),
      contactId: contactId || selectedContactId,
      dealId: dealId || undefined,
      type,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    })
    setContent("")
    setDealId("")
    if (!contactId) setSelectedContactId("")
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6 font-sans">
      <div className="space-y-3">
        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Activity Type</Label>
        <div className="flex gap-2 flex-wrap">
          {ACTIVITY_TYPES.map((t) => (
            <Button
              key={t}
              type="button"
              variant={type === t ? "default" : "outlineNeutral"}
              size="sm"
              onClick={() => setType(t)}
              className="rounded-xl px-4 h-8 text-[10px]"
            >
              {TYPE_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>
      
      {contacts && contacts.length > 0 && !contactId && (
        <div className="space-y-2">
          <Label htmlFor="activity-contact" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Related Contact *</Label>
          <select
            id="activity-contact"
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
          >
            <option value="">Select a contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.contact && (
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.contact}</p>
          )}
        </div>
      )}

      {deals && deals.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="activity-deal" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Related Deal (optional)</Label>
          <select
            id="activity-deal"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            className="flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
          >
            <option value="">None</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="activity-content" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Content *</Label>
        <Textarea
          id="activity-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What happened?"
          rows={3}
          className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 shadow-sm bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white min-h-[100px] resize-none"
        />
        {errors.content && (
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.content}</p>
        )}
      </div>

      <div className="pt-2">
        <Button 
          type="submit" 
          variant="default"
          className="w-full h-12 rounded-xl text-xs uppercase tracking-widest font-black"
        >
          Log Activity
        </Button>
      </div>
    </form>
  )
}
