import { ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";
import type { LandingTheme } from "./types";
import { DemoButton } from "./DemoButton";

interface HeroSectionProps {
  theme: LandingTheme;
}

export function HeroSection({ theme }: HeroSectionProps) {
  const isDark = theme === "dark";

  return (
    <header
      className={`relative pt-12 pb-14 lg:pt-16 lg:pb-20 border-b ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
        }`}
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
          {/* Left: message */}
          <div className="space-y-7 animate-content-in text-center lg:text-left">
            <h1
              className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight ${isDark ? "text-white" : "text-slate-900"
                }`}
            >
              Keep your customers, sales, and stock{" "}
              <span className="text-accent">all in one place.</span>
            </h1>

            <p
              className={`text-lg sm:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"
                }`}
            >
              Hive is the easy-to-use tool that helps small teams stay organized — no
              spreadsheets, no training, and no tech skills needed. If you can use email,
              you can use Hive.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-1 justify-center lg:justify-start">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap bg-accent text-white px-7 py-4 rounded-2xl text-base font-bold shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Start for free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <DemoButton
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap px-7 py-4 rounded-2xl text-base font-bold border-2 transition-all disabled:opacity-70 ${isDark
                  ? "border-slate-700 text-slate-200 hover:border-slate-500"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              />
              <a
                href="#modules"
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap px-5 py-4 rounded-2xl text-base font-bold transition-all ${isDark
                  ? "text-slate-300 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                See how it works
              </a>
            </div>

            {/* Reassurances */}
            <ul className={`flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 justify-center lg:justify-start ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {["Free to start", "No credit card needed", "Ready in minutes"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-medium">
                  <Check className="w-4 h-4 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: friendly product preview */}
          <div className="animate-content-in" style={{ animationDelay: "0.15s" }}>
            <div
              className={`rounded-3xl border overflow-hidden ${isDark
                ? "border-slate-800 bg-slate-900 shadow-2xl shadow-black/40"
                : "border-slate-200 bg-white shadow-[0_32px_64px_-16px_rgba(15,23,42,0.18)]"
                }`}
            >
              {/* Window bar */}
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
                <span className="w-3 h-3 rounded-full bg-red/70" />
                <span className="w-3 h-3 rounded-full bg-amber/70" />
                <span className="w-3 h-3 rounded-full bg-green/70" />
                <span className={`ml-3 text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Your dashboard
                </span>
              </div>
              <img
                src={isDark ? "/dashboard-dm.png" : "/lmode.png"}
                alt="A look inside Hive — your customers, sales, and stock on one screen"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
