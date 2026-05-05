import type { LandingTheme } from "./types";

interface ShowcaseSectionProps {
  theme: LandingTheme;
}

export function ShowcaseSection({ theme }: ShowcaseSectionProps) {
  const isDark = theme === "dark";

  return (
    <section className={`py-12 lg:py-16 ${isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 space-y-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-sans font-black tracking-tighter leading-[0.85] uppercase">
              The Interface <br />
              of <span className="text-[#0D9488]">Efficiency.</span>
            </h2>
            <p className={`text-base lg:text-lg font-bold leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              High-density information architecture designed to eliminate friction and accelerate execution.
            </p>
          </div>
          <div className={`px-5 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
            Production // {isDark ? "Dark Mode" : "Light Mode"}
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-[2rem]">
          <div className="aspect-[16/9] overflow-hidden relative bg-slate-800">
            <img
              src={isDark ? "/dashboard-dm.png" : "/lmode.png"}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.01]"
              alt="CRM Dashboard Interface"
            />
            <div className={`absolute inset-0 transition-opacity duration-700 ${isDark ? "bg-slate-950/10 group-hover:opacity-0" : "bg-white/5 group-hover:opacity-0"}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
