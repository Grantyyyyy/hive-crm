import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

export interface SuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  secondaryText?: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: () => void
  onSecondary?: () => void
  accentColor?: 'emerald' | 'green' | 'teal'
}

export function SuccessModal({
  open,
  onOpenChange,
  title,
  description,
  secondaryText,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  accentColor = 'emerald',
}: SuccessModalProps) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (open) {
      setAnimate(false)
      const timer = setTimeout(() => setAnimate(true), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  const colorMap = {
    emerald: {
      ring: 'ring-emerald-500/20',
      bg: 'bg-emerald-500',
      shadow: 'shadow-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25',
    },
    green: {
      ring: 'ring-green-500/20',
      bg: 'bg-green-500',
      shadow: 'shadow-green-500/30',
      text: 'text-green-600 dark:text-green-400',
      button: 'bg-green-600 hover:bg-green-700 shadow-green-500/25',
    },
    teal: {
      ring: 'ring-teal-500/20',
      bg: 'bg-teal-500',
      shadow: 'shadow-teal-500/30',
      text: 'text-teal-600 dark:text-teal-400',
      button: 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/25',
    },
  }

  const colors = colorMap[accentColor]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[400px] p-8 border-none bg-white dark:bg-slate-900"
        onClose={() => onOpenChange(false)}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Animated Checkmark Circle */}
          <div className="relative">
            {/* Outer glow ring */}
            <div
              className={`w-24 h-24 rounded-full ${colors.bg} flex items-center justify-center ring-4 ${colors.ring} ${colors.shadow} shadow-2xl transition-all duration-500 ease-out ${
                animate ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              {/* Inner white circle */}
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                <Check
                  className={`w-10 h-10 ${colors.text} transition-all duration-500 ease-out delay-150 ${
                    animate ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-45'
                  }`}
                  strokeWidth={3}
                />
              </div>
            </div>

            {/* Celebration dots */}
            {animate && (
              <>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-60" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-teal-400 rounded-full animate-ping opacity-60 delay-150" />
                <div className="absolute top-1/2 -right-2 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-60 delay-300" />
              </>
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[280px]">
              {description}
            </p>
            {secondaryText && (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {secondaryText}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="w-full space-y-3 pt-2">
            <Button
              className={`w-full h-12 rounded-xl text-base font-bold text-white shadow-xl transition-all active:scale-[0.98] ${colors.button}`}
              onClick={onPrimary}
            >
              {primaryLabel}
            </Button>
            {secondaryLabel && onSecondary && (
              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl text-base font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                onClick={onSecondary}
              >
                {secondaryLabel}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
