import React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  cancelText = "Cancel",
  deleteText = "Delete",
  loading = false,
}: DeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-col gap-6">
          {/* Icon Section */}
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>

          {/* Text Section */}
          <DialogHeader className="p-0 text-left space-y-2">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Actions Section */}
          <div className="flex items-center gap-3">
            <Button
              className="h-10 px-5 rounded-full text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all"
              onClick={onDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : deleteText}
            </Button>
            <Button
              variant="ghost"
              className="h-10 px-5 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
