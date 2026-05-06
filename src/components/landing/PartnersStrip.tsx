import type { LandingTheme } from "./types";

interface PartnersStripProps {
  theme: LandingTheme;
}

export function PartnersStrip({ theme }: PartnersStripProps) {
  const isDark = theme === "dark";

  return (
    <div className={`py-8 border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <span className={`text-[10px] font-black uppercase tracking-[0.5em] shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Powered by Modern Technology_
          </span>
          <div className={`flex flex-wrap items-center justify-center gap-8 lg:gap-6 ${isDark ? "opacity-45" : "opacity-30"}`}>
            {["Supabase", "React 19", "Tailwind v4", "Lucide", "Vite"].map((brand) => (
              <span key={brand} className={`text-xl lg:text-2xl font-sans font-black uppercase tracking-tight whitespace-nowrap ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {brand}
              </span>
            ))}
          </div>
          <div className={`hidden lg:block w-px h-8 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
          <div className="flex items-center gap-4 text-accent">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Platform Status: Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
