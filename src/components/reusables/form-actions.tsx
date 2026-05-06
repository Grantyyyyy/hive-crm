import type * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FormActionButton = Omit<React.ComponentProps<typeof Button>, "children" | "size"> & {
  label: React.ReactNode
}

interface FormActionsProps {
  primary: FormActionButton
  cancel?: FormActionButton
  secondary?: FormActionButton
  leading?: React.ReactNode
  className?: string
  actionsClassName?: string
}

function ActionButton({
  label,
  variant,
  className,
  ...props
}: FormActionButton & { variant?: React.ComponentProps<typeof Button>["variant"] }) {
  return (
    <Button
      size={variant === "brand" ? "form-wide" : "form"}
      variant={variant}
      className={cn(
        variant === "brand" && "shadow-lg shadow-teal-600/20 dark:shadow-none",
        className
      )}
      {...props}
    >
      {label}
    </Button>
  )
}

export function FormActions({
  primary,
  cancel,
  secondary,
  leading,
  className,
  actionsClassName,
}: FormActionsProps) {
  const hasAside = !!leading || !!secondary

  return (
    <div
      className={cn(
        "shrink-0 border-t border-slate-100 bg-white/80 px-8 py-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80",
        "shadow-[0_-8px_30px_-10px_rgba(15,23,42,0.08)]",
        hasAside
          ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          : "flex items-center justify-end",
        className
      )}
    >
      {hasAside && (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          {leading}
          {secondary && (
            <ActionButton
              variant="outlineNeutral"
              {...secondary}
            />
          )}
        </div>
      )}

      <div
        className={cn(
          "flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end",
          actionsClassName
        )}
      >
        {cancel && (
          <ActionButton
            type="button"
            variant="outlineNeutral"
            {...cancel}
          />
        )}
        <ActionButton
          variant="brand"
          {...primary}
        />
      </div>
    </div>
  )
}
