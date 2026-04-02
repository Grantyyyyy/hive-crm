import React from "react"
import { Cloud, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  confirmClassName?: string
  onConfirm: () => void
  loading?: boolean
  variant?: 'teal' | 'amber' | 'warning'
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmClassName,
  onConfirm,
  loading = false,
  variant = 'teal'
}: ConfirmModalProps) {
  const handleConfirm = () => {
    if (loading) return
    onConfirm()
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'amber':
        return {
          iconBg: 'bg-amber-50 dark:bg-amber-900/20',
          iconColor: 'text-amber-600 dark:text-amber-500',
          icon: CheckCircle2,
        }
      case 'warning':
        return {
          iconBg: 'bg-orange-50 dark:bg-orange-900/20',
          iconColor: 'text-orange-600 dark:text-orange-500',
          icon: AlertTriangle,
        }
      default: // teal
        return {
          iconBg: 'bg-teal-50 dark:bg-teal-900/20',
          iconColor: 'text-teal-600 dark:text-teal-400',
          icon: Cloud,
        }
    }
  }

  const variantStyles = getVariantStyles()
  const IconComponent = variantStyles.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-col gap-6">
          {/* Icon Section */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variantStyles.iconBg}`}>
            <IconComponent className={`w-5 h-5 ${variantStyles.iconColor}`} />
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
              className={`h-10 px-5 rounded-full text-sm font-semibold transition-all ${confirmClassName || 'bg-teal-700 hover:bg-teal-800 text-white shadow-md'
                }`}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmLabel}
            </Button>
            <Button
              variant="ghost"
              className="h-10 px-5 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
