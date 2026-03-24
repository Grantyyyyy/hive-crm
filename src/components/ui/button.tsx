import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/30 disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer disabled:active:scale-100",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:brightness-110 shadow-lg shadow-accent/20",
        outline: "border-2 border-accent text-accent hover:bg-accent/5 bg-transparent",
        outlineNeutral: "border border-border text-text-primary hover:bg-bg-elevated bg-transparent",
        ghost: "text-text-secondary hover:bg-bg-elevated bg-transparent",
        ghostPrimary: "text-accent hover:bg-accent/10 bg-transparent",
        destructive: "bg-red text-white hover:brightness-110 shadow-lg shadow-red/20",
        destructiveOutline: "border-2 border-red text-red hover:bg-red/5 bg-transparent",
        secondary: "bg-bg-elevated text-text-secondary hover:bg-bg-highlight",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-xs uppercase tracking-wider rounded-xl", 
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-10 px-5 text-sm rounded-lg",
        lg: "h-14 px-8 text-base rounded-xl",
        icon: "h-10 w-10 shrink-0 rounded-full", 
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
