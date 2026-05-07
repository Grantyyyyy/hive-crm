import { ArrowUpRight } from "lucide-react";
import type { LandingTheme } from "./types";

interface HeroSectionProps {
  theme: LandingTheme;
}

export function HeroSection({ theme }: HeroSectionProps) {
  const isDark = theme === "dark";

  return (
    <header
      className={`relative pt-12 pb-8 border-b ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
        }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-[1fr_0.45fr] gap-10 lg:gap-6 items-end">
          <div className="space-y-8 animate-content-in">
            <div className="flex flex-col gap-6">
              <h1
                className={`text-6xl sm:text-7xl lg:text-8xl font-sans font-black leading-[0.85] tracking-tight uppercase max-w-4xl ${isDark ? "text-slate-100" : "text-slate-900"
                  }`}
              >
                Orchestrate <br />
                <span className="text-accent">
                  Sales & Growth.
                </span>
              </h1>
              <p
                className={`text-lg sm:text-xl font-bold max-w-2xl leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"
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
                  <p className="text-xl sm:text-2xl font-black text-accent tracking-tight uppercase">Online</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 pb-1 animate-content-in" style={{ animationDelay: "0.2s" }}>
            <div className={`relative overflow-hidden p-6 border-2 rounded-[2rem] transition-all duration-500 hover:border-accent/30 group ${isDark
              ? "border-slate-800 bg-slate-900/40 backdrop-blur-xl"
              : "border-slate-100 bg-white shadow-[0_32px_64px_-16px_rgba(15,23,42,0.08)]"
              }`}>
              <div className="relative z-10 space-y-7">
                <div className="flex items-center justify-between">
                  <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Operational Intelligence
                  </div>
                  <div className="flex items-end gap-1 h-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-accent transition-all duration-300 group-hover:bg-accent"
                        style={{
                          height: `${20 + Math.random() * 80}%`,
                          animation: `grow-shrink ${1 + i * 0.2}s ease-in-out infinite alternate`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className={`text-3xl sm:text-4xl font-black leading-[1] tracking-tighter uppercase ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    Scale <span className="text-accent">Without</span> <br />
                    the Friction.
                  </h3>
                  <p className={`text-base font-bold leading-relaxed max-w-[320px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Eliminate architectural bottlenecks with a modular engine built for extreme throughput and sub-40ms latency.
                  </p>
                </div>

                <div className="flex items-center gap-5 pt-2">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`w-9 h-9 rounded-full border-2 ${isDark ? "border-slate-900" : "border-white"} bg-slate-800 overflow-hidden ring-4 ring-transparent group-hover:ring-accent/10 transition-all`}>
                        <img src={`https://i.pravatar.cc/100?u=tech-${i}`} alt="tech" className="w-full h-full object-cover grayscale brightness-110" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                      Enterprise Grade
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Validated by 500+ orgs
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full group-hover:bg-accent/10 transition-colors duration-700" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <div className="flex items-center gap-10">
                <a href="#modules" className={`text-xs font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3 group ${isDark ? "text-slate-400 hover:text-accent" : "text-slate-500 hover:text-accent"}`}>
                  Technical Specs 
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isDark ? "border-slate-800 group-hover:border-accent" : "border-slate-200 group-hover:border-accent"} group-hover:bg-accent group-hover:text-white`}>
                    <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                <a href="#pricing" className={`text-xs font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3 group ${isDark ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-900"}`}>
                  View Pricing 
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isDark ? "border-slate-800 group-hover:border-slate-100" : "border-slate-200 group-hover:border-slate-900"} group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900`}>
                    <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              </div>
            </div>

            <div className={`flex items-center gap-4 px-5 py-3 border rounded-2xl w-fit transition-all hover:border-accent/30 ${isDark ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
              <div className="flex gap-4 items-center">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Core Engine: <span className={isDark ? "text-slate-100" : "text-slate-900"}>Healthy</span>
                </p>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Latency: <span className={isDark ? "text-slate-100" : "text-slate-900"}>14ms</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
