import React from "react"
import { Cloud, CheckCircle2, AlertTriangle, Info, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
  variant?: 'teal' | 'amber' | 'warning' | 'info' | 'success' | 'primary'
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
          iconBg: 'bg-amber-50 dark:bg-amber-950/30',
          iconColor: 'text-amber-600 dark:text-amber-500',
          dotColor: 'bg-amber-600',
          icon: CheckCircle2,
          buttonClass: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 text-white',
        }
      case 'warning':
        return {
          iconBg: 'bg-orange-50 dark:bg-orange-950/30',
          iconColor: 'text-orange-600 dark:text-orange-500',
          dotColor: 'bg-orange-600',
          icon: AlertTriangle,
          buttonClass: 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20 text-white',
        }
      case 'info':
        return {
          iconBg: 'bg-blue-50 dark:bg-blue-950/30',
          iconColor: 'text-blue-600 dark:text-blue-500',
          dotColor: 'bg-blue-600',
          icon: Info,
          buttonClass: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white',
        }
      case 'success':
        return {
          iconBg: 'bg-green-50 dark:bg-green-950/30',
          iconColor: 'text-green-600 dark:text-green-500',
          dotColor: 'bg-green-600',
          icon: Check,
          buttonClass: 'bg-green-600 hover:bg-green-700 shadow-green-500/20 text-white',
        }
      case 'primary':
        return {
          iconBg: 'bg-teal-50 dark:bg-teal-950/30',
          iconColor: 'text-teal-600 dark:text-teal-500',
          dotColor: 'bg-teal-600',
          icon: Sparkles,
          buttonClass: 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20 text-white',
        }
      default: // teal
        return {
          iconBg: 'bg-teal-50 dark:bg-teal-950/30',
          iconColor: 'text-teal-600 dark:text-teal-400',
          dotColor: 'bg-teal-600',
          icon: Cloud,
          buttonClass: 'bg-teal-800 hover:bg-teal-900 shadow-teal-500/20 text-white',
        }
    }
  }

  const variantStyles = getVariantStyles()
  const IconComponent = variantStyles.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-7 border-none bg-white dark:bg-slate-900"
        onClose={() => onOpenChange(false)}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Icon Section */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center relative ${variantStyles.iconBg}`}>
            <IconComponent className={`w-6 h-6 ${variantStyles.iconColor}`} />
            <div className={`absolute top-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full shadow-sm ${variantStyles.dotColor}`} />
          </div>

          {/* Text Section */}
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              {title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[340px]">
              {description}
            </p>
          </div>

          {/* Actions Section */}
          <div className="flex w-full items-center justify-end gap-3 pt-2">
            <Button
              variant="outlineNeutral"
              className="h-11 px-6 rounded-full text-sm font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              className={`h-11 px-6 rounded-full text-sm font-bold text-white shadow-none transition-all active:scale-95 disabled:opacity-50 ${confirmClassName || variantStyles.buttonClass}`}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
