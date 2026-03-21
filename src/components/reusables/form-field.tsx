import React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface FormFieldProps {
    label: string
    field: any
    children: React.ReactNode
    required?: boolean
    className?: string
}

export function FormField({ label, field, children, required, className }: FormFieldProps) {
    return (
        <div className={cn("space-y-1.5 flex flex-col", className)}>
            <div className="flex items-center justify-between">
                <Label
                    htmlFor={field.name}
                    className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold pl-0.5"
                >
                    {label} {required && <span className="text-[var(--red)]">*</span>}
                </Label>
                <FieldError field={field} />
            </div>
            {children}
        </div>
    )
}
export function FormInput({ field, ...props }: { field: any } & React.ComponentProps<typeof Input>) {
    return (
        <Input
            id={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            {...props}
        />
    )
}
export function FormTextarea({ field, ...props }: { field: any } & React.ComponentProps<typeof Textarea>) {
    return (
        <Textarea
            id={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value as any)}
            {...props}
        />
    )
}
interface FormButtonSelectProps<T> {
    field: { state: { value: T }; handleChange: (v: T) => void }
    options: T[]
    renderLabel?: (v: T) => string
    getActiveClass?: (v: T, isActive: boolean) => string
    onSelect?: (v: T) => void
}
export function FormButtonSelect<T extends string>({
    field,
    options,
    renderLabel = (v) => v,
    getActiveClass,
    onSelect
}: FormButtonSelectProps<T>) {
    return (
        <div className="flex border border-[var(--border)] h-10 bg-[var(--bg-elevated)]">
            {options.map((option) => {
                const isActive = field.state.value === option
                const activeClass = getActiveClass
                    ? getActiveClass(option, isActive)
                    : isActive ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => {
                            field.handleChange(option)
                            onSelect?.(option)
                        }}
                        className={cn(
                            "flex-1 text-[11px] uppercase tracking-wide transition-all font-bold",
                            activeClass
                        )}
                    >
                        {renderLabel(option)}
                    </button>
                )
            })}
        </div>
    )
}
function FieldError({ field }: { field: any }) {
    if (!field.state.meta.errors.length) return null
    return (
        <span className="text-[10px] text-[var(--red)] font-bold lowercase italic tracking-tight">
            {field.state.meta.errors.join(", ")}
        </span>
    )
}