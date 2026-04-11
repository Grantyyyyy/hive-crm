import React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

interface DeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  onDelete: () => void
  cancelText?: string
  deleteText?: string
  loading?: boolean
}

export function DeleteModal({
  open,
  onOpenChange,
  title,
  description,
  onDelete,
  cancelText = "Keep Item",
  deleteText = "Delete",
  loading = false,
}: DeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-7 border-none bg-white dark:bg-slate-900"
        onClose={() => onOpenChange(false)}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Icon Section */}
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center relative">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-600 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
          </div>

          {/* Text Section */}
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              {title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[320px]">
              {description}
            </p>
          </div>

          {/* Actions Section */}
          <div className="flex w-full items-center justify-end gap-3 pt-2">
            <Button
              variant="outlineNeutral"
              className="h-11 px-6 rounded-full text-sm font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              className="h-11 px-6 rounded-full text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-none transition-all active:scale-95 disabled:opacity-50"
              onClick={onDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : deleteText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
