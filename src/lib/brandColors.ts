export type BrandColorId =
  | "teal"
  | "emerald"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "rose"
  | "red"
  | "orange"
  | "amber"

export interface BrandColorPreset {
  id: BrandColorId
  label: string
  light: {
    accent: string
    accentDim: string
  }
  dark: {
    accent: string
    accentDim: string
  }
}

export const DEFAULT_BRAND_COLOR: BrandColorId = "teal"

export const BRAND_COLOR_PRESETS: BrandColorPreset[] = [
  { id: "teal", label: "Teal", light: { accent: "#0D9488", accentDim: "#F0FDFA" }, dark: { accent: "#14B8A6", accentDim: "#134E48" } },
  { id: "emerald", label: "Emerald", light: { accent: "#059669", accentDim: "#ECFDF5" }, dark: { accent: "#10B981", accentDim: "#064E3B" } },
  { id: "sky", label: "Sky", light: { accent: "#0284C7", accentDim: "#F0F9FF" }, dark: { accent: "#38BDF8", accentDim: "#0C4A6E" } },
  { id: "blue", label: "Blue", light: { accent: "#2563EB", accentDim: "#EFF6FF" }, dark: { accent: "#60A5FA", accentDim: "#1E3A8A" } },
  { id: "indigo", label: "Indigo", light: { accent: "#4F46E5", accentDim: "#EEF2FF" }, dark: { accent: "#818CF8", accentDim: "#312E81" } },
  { id: "violet", label: "Violet", light: { accent: "#7C3AED", accentDim: "#F5F3FF" }, dark: { accent: "#A78BFA", accentDim: "#4C1D95" } },
  { id: "rose", label: "Rose", light: { accent: "#E11D48", accentDim: "#FFF1F2" }, dark: { accent: "#FB7185", accentDim: "#881337" } },
  { id: "red", label: "Red", light: { accent: "#DC2626", accentDim: "#FEF2F2" }, dark: { accent: "#F87171", accentDim: "#7F1D1D" } },
  { id: "orange", label: "Orange", light: { accent: "#EA580C", accentDim: "#FFF7ED" }, dark: { accent: "#FB923C", accentDim: "#7C2D12" } },
  { id: "amber", label: "Amber", light: { accent: "#D97706", accentDim: "#FFFBEB" }, dark: { accent: "#FBBF24", accentDim: "#78350F" } },
]

export function isBrandColorId(value: string | null | undefined): value is BrandColorId {
  return BRAND_COLOR_PRESETS.some((preset) => preset.id === value)
}

export function getBrandColorPreset(value: string | null | undefined): BrandColorPreset {
  return BRAND_COLOR_PRESETS.find((preset) => preset.id === value) ?? BRAND_COLOR_PRESETS[0]
}
