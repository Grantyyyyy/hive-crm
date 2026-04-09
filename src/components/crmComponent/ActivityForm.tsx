import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Activity, ActivityType, Deal, Contact } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { cn } from "@/lib/utils"

interface ActivityFormProps {
  contactId?: string
  deals?: Deal[]
  contacts?: Contact[]
  onSave: (activity: Activity) => void
  onCancel?: () => void
}

const TYPE_LABELS: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  note: "Note",
  meeting: "Meeting",
}

export function ActivityForm({ contactId, deals, contacts, onSave, onCancel }: ActivityFormProps) {
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
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
        
        <div className="grid grid-cols-1 gap-y-6">
          {/* Main Activity Info Section */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Interaction Details</h3>
            </div>

            <div className="space-y-6">
              {/* Activity Type Selection */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type of Activity</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['call', 'email', 'meeting', 'note'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all scale-100 active:scale-95",
                        type === t
                          ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300"
                      )}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">What happened? (Content)</Label>
                <div className="group relative">
                  <Textarea
                    id="activity-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Briefly describe the interaction..."
                    className={cn(
                      "h-32 px-4 py-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-medium transition-all focus:ring-4 focus:ring-teal-500/10 resize-none",
                      errors.content && "border-red-500 ring-4 ring-red-500/10"
                    )}
                  />
                </div>
                {errors.content && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide">{errors.content}</p>}
              </div>
            </div>
          </section>

          {/* Relations Section */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-sky-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Related Context</h3>
            </div>

            <div className="space-y-6">
              {contacts && contacts.length > 0 && !contactId && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Related Contact</Label>
                  <div className="relative group">
                    <select
                      id="activity-contact"
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      className={cn(
                        "w-full h-11 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm",
                        errors.contact && "border-red-500"
                      )}
                    >
                      <option value="">Select a contact...</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.contact && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide">{errors.contact}</p>}
                </div>
              )}

              {deals && deals.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Related Deal (Optional)</Label>
                  <div className="relative group">
                    <select
                      id="activity-deal"
                      value={dealId}
                      onChange={(e) => setDealId(e.target.value)}
                      className="w-full h-11 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                    >
                      <option value="">None</option>
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="px-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outlineNeutral"
            onClick={onCancel}
            className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-2"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="h-9 px-10 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 text-[10px] font-black uppercase tracking-widest"
        >
          Log Interaction
        </Button>
      </div>
    </form>
  )
}

