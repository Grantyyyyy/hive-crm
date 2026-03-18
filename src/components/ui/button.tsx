import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/30 disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer disabled:active:scale-100",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:brightness-110 shadow-lg shadow-indigo-200 dark:shadow-none",
        outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600/5 bg-transparent",
        outlineNeutral: "border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent",
        ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent",
        ghostPrimary: "text-indigo-600 hover:bg-indigo-600/10 bg-transparent",
        destructive: "bg-red-500 text-white hover:brightness-110 shadow-lg shadow-red-200 dark:shadow-none",
        destructiveOutline: "border-2 border-red-500 text-red-500 hover:bg-red-500/5 bg-transparent",
        secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700",
        link: "text-indigo-600 underline-offset-4 hover:underline",
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
