import { useEffect, useState } from "react"
import { Check, Loader2, Palette } from "lucide-react"
import { toast } from "sonner"
import { useAuth, useUser } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { BRAND_COLOR_PRESETS, type BrandColorId } from "@/lib/brandColors"

export function AppearancePopover() {
  const { user } = useUser()
  const { brandColor, setBrandColor } = useAuth()
  const [selectedBrandColor, setSelectedBrandColor] = useState<BrandColorId>(brandColor)
  const [savingBrandColor, setSavingBrandColor] = useState<BrandColorId | null>(null)

  useEffect(() => {
    setSelectedBrandColor(brandColor)
  }, [brandColor])

  const handleBrandColorSelect = async (nextBrandColor: BrandColorId) => {
    if (!user || nextBrandColor === selectedBrandColor || savingBrandColor) return

    const previousBrandColor = selectedBrandColor
    setSelectedBrandColor(nextBrandColor)
    setBrandColor(nextBrandColor)
    setSavingBrandColor(nextBrandColor)

    try {
      const { error } = await supabase
        .from("app_users")
        .update({ brand_color: nextBrandColor, updated_at: new Date().toISOString() })
        .eq("auth_user_id", user.id)

      if (error) throw error

      toast.success("Brand color updated", {
        description: "Your app accent has been saved.",
      })
    } catch (err: unknown) {
      setSelectedBrandColor(previousBrandColor)
      setBrandColor(previousBrandColor)
      toast.error("Update failed", {
        description: (err as Error).message,
      })
    } finally {
      setSavingBrandColor(null)
    }
  }

  return (
    <div className="w-80 p-2">
      <div className="px-3 py-2 border-b border-border mb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <Palette className="w-4 h-4 text-accent" />
          Appearance
        </div>
        <p className="mt-1 text-xs text-text-muted">
          Choose the accent used across your branded workspace sections.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {BRAND_COLOR_PRESETS.map((preset) => {
          const isSelected = selectedBrandColor === preset.id
          const isSavingPreset = savingBrandColor === preset.id

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleBrandColorSelect(preset.id)}
              disabled={!!savingBrandColor}
              className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:opacity-70 ${
                isSelected
                  ? "border-accent bg-accent-dim ring-2 ring-accent/15"
                  : "border-slate-200 dark:border-slate-800 hover:border-accent/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                style={{ backgroundColor: preset.light.accent }}
              >
                {isSavingPreset ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isSelected ? (
                  <Check className="size-3.5" />
                ) : null}
              </span>
              <span className="min-w-0 text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {preset.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
