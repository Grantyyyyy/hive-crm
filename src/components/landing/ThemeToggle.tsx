import { Moon, Sun } from "lucide-react";
import type { LandingTheme } from "./types";

interface ThemeToggleProps {
  theme: LandingTheme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <div className="fixed top-5 right-5 z-50">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-[0.2em] transition-colors ${
          isDark
            ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        {isDark ? "Light" : "Dark"}
      </button>
    </div>
  );
}
