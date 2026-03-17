import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-[12px] font-mono uppercase tracking-[0.08em] transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-white hover:opacity-90 border-transparent",
        destructive: "bg-[var(--red)] text-white hover:opacity-90 border-transparent",
        outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] text-[var(--text-secondary)]",
        secondary: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]",
        ghost: "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] text-[var(--text-secondary)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
