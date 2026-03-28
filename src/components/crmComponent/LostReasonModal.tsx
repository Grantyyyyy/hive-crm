import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"

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
      <DialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl sm:max-w-[500px]">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Mark Deal as Lost
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 pt-2">
            Please provide a reason for losing <strong className="text-slate-900 dark:text-white">"{dealTitle}"</strong>. 
            This information helps track why deals are lost and improve future sales efforts.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
              className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-rose-500 focus:border-rose-500 text-sm resize-none"
              autoFocus
            />
            {error && (
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
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
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 gap-3">
          <Button
            type="button"
            variant="outlineNeutral"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            className="flex-[1.5]"
          >
            Mark as Lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
