import React, { useState } from "react"
import { Mail, Send, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

export interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  placeholder?: string

  onSubmit: (value: string) => void
  icon?: React.ReactNode
  accentColor?: 'teal' | 'blue' | 'slate'
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  placeholder = "Enter your email...",

  onSubmit,
  icon,
  accentColor = 'teal',
}: FormModalProps) {
  const [value, setValue] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!value.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(value)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setValue("")
        onOpenChange(false)
      }, 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSubmitted(false)
    setValue("")
    onOpenChange(false)
  }

  const colorMap = {
    teal: {
      iconBg: 'bg-teal-50 dark:bg-teal-950/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
      inputFocus: 'focus:ring-teal-500/20 focus:border-teal-500',
      button: 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/25',
      success: 'text-teal-600 dark:text-teal-400',
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      inputFocus: 'focus:ring-teal-500/20 focus:border-teal-500',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25',
      success: 'text-blue-600 dark:text-blue-400',
    },
    slate: {
      iconBg: 'bg-slate-50 dark:bg-slate-800/40',
      iconColor: 'text-slate-700 dark:text-slate-300',
      inputFocus: 'focus:ring-slate-500/20 focus:border-slate-500',
      button: 'bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 shadow-slate-900/20 dark:shadow-white/10',
      success: 'text-slate-700 dark:text-slate-300',
    },
  }

  const colors = colorMap[accentColor]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-8 border-none bg-white dark:bg-slate-900"
        onClose={handleClose}
      >
        <div className="flex flex-col space-y-6">
          {/* Header with close button */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                {icon || <Mail className={`w-5 h-5 ${colors.iconColor}`} />}
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Form or Success State */}
          {submitted ? (
            <div className="flex items-center gap-3 p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Thanks! You're all set.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <Input
                type="email"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                disabled={isSubmitting}
                className={`h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium ${colors.inputFocus}`}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <Button
                className={`h-12 px-5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${colors.button}`}
                onClick={handleSubmit}
                disabled={isSubmitting || !value.trim()}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          {/* Footer text */}
          {!submitted && (
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 font-medium">
              No spam, unsubscribe at any time.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
