import React from "react"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

export interface FeatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  actionLabel: string
  onAction: () => void
  loading?: boolean
}

export function FeatureModal({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  onAction,
  loading = false,
}: FeatureModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[420px] p-0 border-none bg-white dark:bg-slate-900 overflow-hidden"
        onClose={() => onOpenChange(false)}
      >
        <div className="flex flex-col">
          {/* Banner Section */}
          <div className="h-44 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden">
            {/* Ambient decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl transform translate-x-1/4 translate-y-1/4" />

            {/* Floating Icon */}
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl relative z-10 transform -rotate-6 transition-transform hover:rotate-0 duration-300">
              <Zap className="w-5 h-5 text-white fill-white/20" />
            </div>
          </div>

          {/* Content Section */}
          <div className="p-7 flex flex-col items-center text-center">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6 max-w-[280px]">
              {description}
            </p>

            {/* Actions */}
            <div className="w-full space-y-2">
              <Button
                className="w-full h-11 rounded-full text-sm font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-none transition-all active:scale-95 disabled:opacity-50"
                onClick={() => {
                  if (!loading) onAction();
                }}
                disabled={loading}
              >
                {loading ? 'Processing...' : actionLabel}
              </Button>
              <Button
                variant="outlineNeutral"
                className="w-full h-11 rounded-full text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
