import React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (loading) return
        onOpenChange(value)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-red-500" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="px-6 pb-6 pt-2 flex gap-3 sm:justify-end">
          <Button
            variant="outlineNeutral"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : deleteText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
