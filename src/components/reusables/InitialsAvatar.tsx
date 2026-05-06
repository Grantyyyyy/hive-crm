import { cn } from "@/lib/utils"

interface InitialsAvatarProps {
  name: string
  className?: string
  textClassName?: string
}

function getInitials(name: string): string {
  if (!name || name.includes("...")) return "??"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0][0] || ""
    const last = parts[parts.length - 1][0] || ""
    return `${first}${last}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function InitialsAvatar({ name, className, textClassName }: InitialsAvatarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-accent",
        className
      )}
    >
      <span className={cn("leading-none", textClassName)}>
        {getInitials(name)}
      </span>
    </div>
  )
}
