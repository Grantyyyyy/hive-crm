import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] font-mono text-[var(--text-primary)] shadow-none placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
