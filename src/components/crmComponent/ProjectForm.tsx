import { useState } from "react"
import { Type, AlignLeft, Check, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Project } from "@/lib/types"
import { generateId } from "@/lib/helpers"
import { cn } from "@/lib/utils"

interface ProjectFormProps {
  onSave: (project: Project) => void
  onCancel: () => void
  initialData?: Project
  userId?: string
}

const PRESET_COLORS = [
  { value: "#6366f1", bg: "bg-[#6366f1]" },
  { value: "#8b5cf6", bg: "bg-[#8b5cf6]" },
  { value: "#ec4899", bg: "bg-[#ec4899]" },
  { value: "#ef4444", bg: "bg-[#ef4444]" },
  { value: "#f97316", bg: "bg-[#f97316]" },
  { value: "#eab308", bg: "bg-[#eab308]" },
  { value: "#22c55e", bg: "bg-[#22c55e]" },
  { value: "#14b8a6", bg: "bg-[#14b8a6]" },
  { value: "#06b6d4", bg: "bg-[#06b6d4]" },
  { value: "#3b82f6", bg: "bg-[#3b82f6]" },
]

export function ProjectForm({
  onSave,
  onCancel,
  initialData,
  userId
}: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [color, setColor] = useState(initialData?.color ?? "#6366f1")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Project name is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const now = new Date().toISOString()
    const project: Project = {
      id: initialData?.id ?? generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      ownerId: initialData?.ownerId ?? userId ?? "",
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
    }

    onSave(project)
  }

  const inputClass = "h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-sm transition-all shadow-sm text-slate-900 dark:text-white"
  const labelClass = "text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 block"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden font-sans">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">

        {/* Project Name */}
        <div className="space-y-1.5 animate-content-in [animation-delay:100ms]">
          <Label className={labelClass}>Project Name</Label>
          <div className="relative group">
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className={cn(inputClass, "pl-11", errors.name && "border-red-500")}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 animate-content-in [animation-delay:150ms]">
          <Label className={labelClass}>Description</Label>
          <div className="relative group">
            <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project..."
              rows={3}
              className={cn(inputClass, "pl-11 pt-3 resize-none h-auto min-h-[100px]")}
            />
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-4 animate-content-in [animation-delay:200ms]">
          <Label className={labelClass}>Project Color</Label>

          {/* Color Picker Input */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-14 h-14 rounded-lg cursor-pointer border-2 border-slate-200 dark:border-slate-700 overflow-hidden p-0.5 bg-white dark:bg-slate-900"
                style={{ WebkitAppearance: 'none' }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{color.toUpperCase()}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Click the color box to pick any color</p>
            </div>
          </div>

          {/* Preset Colors */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Select</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-md transition-all border-2",
                    color === c.value
                      ? "border-slate-900 dark:border-white scale-110 shadow-lg ring-2 ring-offset-2 ring-slate-300 dark:ring-slate-600"
                      : "border-transparent hover:scale-105"
                  )}
                  title={c.value}
                >
                  <div className={cn("w-full h-full rounded-md", c.bg)} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-8 py-6 border-t border-slate-100 dark:border-slate-900/50 flex items-center gap-3 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <Button
          type="button"
          variant="outlineNeutral"
          onClick={onCancel}
          className="flex-1 h-12"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          className="flex-[1.5] h-12"
        >
          {initialData?.id ? (
            <>Save Changes</>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Create Project
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
