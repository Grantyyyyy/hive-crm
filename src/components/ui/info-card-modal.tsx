import React from "react"
import { Check, X, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

export interface InfoCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  description: string
  features: string[]
  imageIcon: React.ReactNode
  ctaLabel: string
  ctaClassName?: string
  onCta: () => void
  accentColor?: 'violet' | 'cyan' | 'rose' | 'emerald'
}

export function InfoCardModal({
  open,
  onOpenChange,
  title,
  subtitle,
  description,
  features,
  imageIcon,
  ctaLabel,
  ctaClassName,
  onCta,
  accentColor = 'violet',
}: InfoCardModalProps) {
  const accentMap = {
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      text: 'text-violet-600 dark:text-violet-400',
      badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
      check: 'text-violet-500',
      button: 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/25',
      gradient: 'from-violet-500/10 via-transparent to-transparent',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      badge: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
      check: 'text-cyan-500',
      button: 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/25',
      gradient: 'from-cyan-500/10 via-transparent to-transparent',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
      check: 'text-rose-500',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25',
      gradient: 'from-rose-500/10 via-transparent to-transparent',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
      check: 'text-emerald-500',
      button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25',
      gradient: 'from-emerald-500/10 via-transparent to-transparent',
    },
  }

  const colors = accentMap[accentColor]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] p-0 border-none bg-white dark:bg-slate-900 overflow-hidden"
        onClose={() => onOpenChange(false)}
      >
        {/* Top Hero Image Area */}
        <div className={`relative h-48 bg-gradient-to-br ${colors.gradient} flex items-center justify-center overflow-hidden`}>
          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          
          {/* Floating icon card */}
          <div className={`w-20 h-20 ${colors.bg} backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/50 dark:border-slate-800/50 transform -rotate-6 transition-transform duration-300`}>
            {imageIcon}
          </div>

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-6">
          {/* Title & Subtitle */}
          <div className="space-y-2">
            {subtitle && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.badge}`}>
                <Star className="w-3 h-3 mr-1.5" />
                {subtitle}
              </span>
            )}
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {description}
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              What's included
            </p>
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center`}>
                  <Check className={`w-3 h-3 ${colors.check}`} />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            className={`w-full h-13 rounded-xl text-base font-bold text-white shadow-xl transition-all active:scale-[0.98] ${
              ctaClassName || colors.button
            }`}
            onClick={onCta}
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
