import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { Link } from "wouter";
import type { LandingTheme } from "./types";

interface HeroSectionProps {
  theme: LandingTheme;
}

export function HeroSection({ theme }: HeroSectionProps) {
  const isDark = theme === "dark";

  return (
    <header
      className={`relative pt-12 pb-8 border-b ${
        isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-[1fr_0.45fr] gap-10 lg:gap-12 items-end">
          <div className="space-y-8 animate-content-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#0D9488] flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#0D9488]" />
              </div>
              <span
                className={`text-xs font-black uppercase tracking-[0.35em] ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Enterprise CRM Platform v2.0
              </span>
            </div>

            <div className="flex flex-col gap-6">
              <h1
                className={`text-6xl sm:text-7xl lg:text-8xl font-sans font-black leading-[0.85] tracking-tight uppercase max-w-4xl ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Orchestrate <br />
                <span className="text-[#0D9488]">
                  Sales & Growth.
                </span>
              </h1>
              <p
                className={`text-lg sm:text-xl font-bold max-w-2xl leading-relaxed ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                A unified workspace designed to eliminate silos between sales, inventory, and fulfillment.
                Execute faster, scale further, and build with clarity.
              </p>

              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 border-t pt-5 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                <div className="space-y-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>Active Users</p>
                  <p className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>1,204</p>
                </div>
                <div className="space-y-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>Data Sync</p>
                  <p className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>Real-time</p>
                </div>
                <div className="space-y-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>Platform Status</p>
                  <p className="text-xl sm:text-2xl font-black text-[#0D9488] tracking-tight uppercase">Online</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 pb-1 animate-content-in" style={{ animationDelay: "0.2s" }}>
            <div className={`space-y-4 p-5 border rounded-2xl ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50/60"}`}>
              <p className={`text-lg font-bold leading-relaxed ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                Start with the core modules, launch quickly, then scale into analytics and automation
                as your operation grows.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=hub-${i}`} alt="user" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <span className={isDark ? "text-slate-100" : "text-slate-900"}>Phase 1:</span> Deployment Ready
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/sign-up">
                <button className="w-full sm:w-auto px-10 py-5 bg-[#0D9488] text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-center gap-4 group shadow-xl hover:-translate-y-1">
                  Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <div className="flex items-center gap-6">
                <a href="#modules" className={`text-[10px] font-black uppercase tracking-[0.25em] transition-colors flex items-center gap-2 group ${isDark ? "text-slate-400 hover:text-[#0D9488]" : "text-slate-500 hover:text-[#0D9488]"}`}>
                  Explore Modules <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#pricing" className={`text-[10px] font-black uppercase tracking-[0.25em] transition-colors ${isDark ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-900"}`}>
                  View Pricing
                </a>
              </div>
            </div>

            <div className={`flex items-center gap-3 px-5 py-2 border rounded-full w-fit ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                System Status: All Systems Operational
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
