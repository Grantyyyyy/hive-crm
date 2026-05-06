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
  { value: "#0d9488", bg: "bg-teal-600" },
  { value: "#8b5cf6", bg: "bg-violet-500" },
  { value: "#ec4899", bg: "bg-pink-500" },
  { value: "#ef4444", bg: "bg-red-500" },
  { value: "#f97316", bg: "bg-orange-500" },
  { value: "#eab308", bg: "bg-yellow-500" },
  { value: "#22c55e", bg: "bg-green-500" },
  { value: "#14b8a6", bg: "bg-teal-500" },
  { value: "#06b6d4", bg: "bg-cyan-500" },
  { value: "#3b82f6", bg: "bg-blue-500" },
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">

        <div className="grid grid-cols-1 gap-y-6">
          {/* Main Info Section */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-teal-600 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Project Details</h3>
            </div>

            <div className="space-y-6">
              {/* Project Name */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project Name</Label>
                <div className="group relative">
                  <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Website Redesign"
                    className={cn(
                      "h-11 pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-teal-500/10",
                      errors.name && "border-red-500 ring-4 ring-red-500/10"
                    )}
                  />
                </div>
                {errors.name && <p className="text-[9px] font-bold text-red uppercase tracking-wide">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</Label>
                <div className="group relative">
                  <AlignLeft className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this project..."
                    className="h-32 pl-10 pt-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-100 rounded-xl text-xs font-medium transition-all focus:ring-4 focus:ring-teal-500/10 resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Color Section */}
          <section className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-700/60">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visual Identity</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="relative group shrink-0">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-16 rounded-xl cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden p-0 bg-white"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-wider">
                      {color.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Custom hex code or pick presets below</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Presets</Label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={cn(
                        "w-9 h-9 rounded-xl transition-all border-2 relative group",
                        color === c.value
                          ? "border-teal-600 scale-110 shadow-lg shadow-teal-600/20 z-10"
                          : "border-transparent hover:scale-105 hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <div className={cn("w-full h-full rounded-[10px]", c.bg)} />
                      {color === c.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-sm" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="px-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outlineNeutral"
          onClick={onCancel}
          className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-9 px-10 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 text-[10px] font-black uppercase tracking-widest"
        >
          {initialData?.id ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}

