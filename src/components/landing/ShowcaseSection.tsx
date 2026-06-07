import type { LandingTheme } from "./types";

interface ShowcaseSectionProps {
  theme: LandingTheme;
}

export function ShowcaseSection({ theme }: ShowcaseSectionProps) {
  const isDark = theme === "dark";

  return (
    <section className={`py-16 lg:py-24 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-10">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            See your whole business at a glance
          </h2>
          <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Everything is laid out clearly and labelled in plain English, so you always know
            what's going on — no manual, no guesswork.
          </p>
        </div>

        <div
          className={`rounded-3xl overflow-hidden border ${isDark
            ? "border-slate-800 shadow-2xl shadow-black/40"
            : "border-slate-200 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.18)]"
            }`}
        >
          <img
            src={isDark ? "/dashboard-dm.png" : "/lmode.png"}
            className="w-full h-auto"
            alt="The Hive dashboard, showing customers, sales, and stock together on one clear screen"
          />
        </div>
      </div>
    </section>
  );
}
