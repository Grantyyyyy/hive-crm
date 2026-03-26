import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
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
    <div className="fixed inset-0 z-[100]">
      <div
        className="fixed inset-0 bg-slate-900/40 animate-backdrop-in"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-slate-950 shadow-2xl animate-sheet-in overflow-hidden flex flex-col font-sans border-l border-slate-200 dark:border-slate-800">
        {children}
      </div>
    </div>
  )
}

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 px-8 pt-8 pb-6 border-b border-slate-50 dark:border-slate-900/50", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm font-medium text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  )
}

function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-3 px-8 py-6 border-t border-slate-50 dark:border-slate-900/50 mt-auto", className)}
      {...props}
    />
  )
}

function SheetContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // We remove padding and overflow here to allow the child form 
  // to manage its own sticky footer and scrollable area.
  return <div className={cn("flex-1 flex flex-col min-h-0", className)} {...props} />
}

export { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter }
