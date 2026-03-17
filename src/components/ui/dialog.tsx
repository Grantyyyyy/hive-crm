import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80 animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-0 shadow-2xl animate-in fade-in-0 zoom-in-95 mx-4 font-mono text-[var(--text-primary)]">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-none opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:border focus:border-[var(--accent)] z-10"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-left mb-4 px-6 pt-6",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-[14px] font-serif font-normal uppercase tracking-widest text-[var(--text-muted)]",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Dialog, DialogHeader, DialogTitle, DialogDescription }
