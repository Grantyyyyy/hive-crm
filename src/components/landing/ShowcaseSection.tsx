import type { LandingTheme } from "./types";

interface ShowcaseSectionProps {
  theme: LandingTheme;
}

export function ShowcaseSection({ theme }: ShowcaseSectionProps) {
  const isDark = theme === "dark";

  return (
    <section className={`py-8 lg:py-10 ${isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <h2 className="text-3xl lg:text-4xl font-sans font-black tracking-tight leading-[0.9] uppercase">
            THE <br /> INTERFACE <br /> OF POWER.
          </h2>
          <div className="max-w-md space-y-4">
            <p className={`text-base lg:text-lg font-bold leading-tight ${isDark ? "opacity-70" : "text-slate-600"}`}>
              High-density information, cleaner workflows, and faster execution from first lead to final fulfillment.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-1.5 border-2 border-[#0D9488] text-[9px] font-black uppercase tracking-[0.2em] text-[#0D9488] rounded-full">Optimized Density</div>
              <div className={`px-4 py-1.5 border-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-full ${isDark ? "border-white/20" : "border-slate-300 text-slate-600"}`}>Cross-Platform</div>
              <div className={`px-4 py-1.5 border-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-full ${isDark ? "border-white/20" : "border-slate-300 text-slate-600"}`}>Real-time Sync</div>
            </div>
          </div>
          <div className={`p-1 rounded-full border flex items-center shrink-0 ${isDark ? "bg-slate-800/70 border-white/10" : "bg-slate-100 border-slate-200"}`}>
            <span className="px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full bg-[#0D9488] text-white">
              {isDark ? "Dark Theme" : "Light Theme"}
            </span>
          </div>
        </div>

        <div className={`relative group p-2 border rounded-2xl overflow-hidden ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
          <div className={`aspect-video overflow-hidden relative border rounded-xl ${isDark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"}`}>
            <img
              src={isDark ? "/dashboard-dm.png" : "/lmode.png"}
              className="w-full h-full object-cover transition-all duration-700 ease-in-out"
              alt="CRM Dashboard Interface"
            />
            <div className={`absolute inset-0 transition-colors ${isDark ? "bg-slate-950/20 group-hover:bg-transparent" : "bg-white/10 group-hover:bg-transparent"}`} />

            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2">
              <div className={`p-2.5 sm:p-3 backdrop-blur-xl space-y-1 rounded-xl border ${isDark ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200 shadow-sm"}`}>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Global Win Rate</p>
                <p className="text-xl sm:text-2xl font-black text-[#0D9488]">34.2%</p>
              </div>
              <div className={`p-2.5 sm:p-3 backdrop-blur-xl space-y-1 rounded-xl border ${isDark ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200 shadow-sm"}`}>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Active Pipeline</p>
                <p className="text-xl sm:text-2xl font-black text-blue-400">$12.4M</p>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
              <div className="bg-[#0D9488] text-white px-4 py-2 sm:px-5 sm:py-2.5 font-black text-xs sm:text-sm uppercase tracking-[0.15em] rounded-lg shadow-lg">
                Hub Enterprise // Version 2.4.0_Stable
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
