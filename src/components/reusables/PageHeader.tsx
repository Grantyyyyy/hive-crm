import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  category?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
  innerClassName?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function PageHeader({
  category,
  title,
  description,
  actions,
  className,
  innerClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden border-b border-border/50 bg-bg-surface/30 backdrop-blur-md px-8 py-4 md:py-6", className)}>
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
      </div>

      <div className={cn("relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4", innerClassName)}>
        <div className="flex items-start gap-5">
          <div className="space-y-1">
            {category && (
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent mb-1 drop-shadow-sm">
                {category}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-text-primary drop-shadow-sm">
              {title}
            </h1>
            {description && (
              <p className="text-text-muted text-sm md:text-base font-medium max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
