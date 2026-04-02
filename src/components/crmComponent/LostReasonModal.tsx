import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle } from "lucide-react"

interface LostReasonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  dealTitle: string
}

export function LostReasonModal({
  open,
  onOpenChange,
  onConfirm,
  dealTitle,
}: LostReasonModalProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  function handleConfirm() {
    if (!reason.trim()) {
      setError("Please provide a reason for losing this deal")
      return
    }
    onConfirm(reason.trim())
    setReason("")
    setError("")
  }

  function handleCancel() {
    setReason("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-col gap-6">
          {/* Icon Section */}
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-500" />
          </div>

          {/* Text Section */}
          <DialogHeader className="p-0 text-left space-y-2">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Mark Deal as Lost
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Please provide a reason for losing <strong className="text-slate-900 dark:text-white">"{dealTitle}"</strong>.
              This information helps track why deals are lost and improve future sales efforts.
            </DialogDescription>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Lost Reason *
              </label>
              <Textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  setError("")
                }}
                placeholder="e.g., Price too high, competitor won, timing not right, budget constraints..."
                rows={4}
                className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 text-sm resize-none"
                autoFocus
              />
              {error && (
                <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                  {error}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                "Price too high",
                "Competitor won",
                "Budget constraints",
                "Timing not right",
                "Missing features",
                "Decision delayed",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setReason(suggestion)
                    setError("")
                  }}
                  className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors text-left border border-slate-200 dark:border-slate-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="h-10 px-5 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              className="h-10 px-5 rounded-full text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all"
            >
              Mark as Lost
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
