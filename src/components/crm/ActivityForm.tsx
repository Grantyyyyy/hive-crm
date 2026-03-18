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
    <form onSubmit={handleSubmit} className="space-y-6 font-mono">
      <div className="space-y-3">
        <Label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Type</Label>
        <div className="flex gap-2 flex-wrap">
          {ACTIVITY_TYPES.map((t) => (
            <Button
              key={t}
              type="button"
              variant={type === t ? "default" : "outlineNeutral"}
              size="sm"
              onClick={() => setType(t)}
              className="rounded-full px-3 h-7"
            >
              {TYPE_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>
      {contacts && contacts.length > 0 && !contactId && (
        <div className="space-y-2">
          <Label htmlFor="activity-contact" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Related Contact *</Label>
          <select
            id="activity-contact"
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="flex h-10 w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text-primary)] shadow-none focus-visible:outline-none focus-visible:border-[var(--accent)] hover:border-[var(--border-subtle)] transition-colors"
          >
            <option value="">Select a contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.contact && (
            <p className="text-[11px] text-[var(--red)] uppercase tracking-wider mt-1">{errors.contact}</p>
          )}
        </div>
      )}
      {deals && deals.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="activity-deal" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Related Deal (optional)</Label>
          <select
            id="activity-deal"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            className="flex h-10 w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text-primary)] shadow-none focus-visible:outline-none focus-visible:border-[var(--accent)] hover:border-[var(--border-subtle)] transition-colors"
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
        <Label htmlFor="activity-content" className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Content *</Label>
        <Textarea
          id="activity-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What happened?"
          rows={3}
          className="rounded-none border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-0 shadow-none bg-[var(--bg-elevated)] text-[13px] text-[var(--text-primary)] font-mono resize-y min-h-[80px]"
        />
        {errors.content && (
          <p className="text-[11px] text-[var(--red)] uppercase tracking-wider mt-1">{errors.content}</p>
        )}
      </div>
      <Button 
        type="submit" 
        variant="default"
        className="w-full mt-4"
      >
        Log Activity
      </Button>
    </form>
  )
}
