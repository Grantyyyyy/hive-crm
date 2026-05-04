import React from "react";
import { Moon, Sun, BarChart3 } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "wouter";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex font-sans bg-background overflow-hidden">

      {/* ── LEFT PANEL — Branding (Static across auth routes) ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden
                      bg-slate-900 dark:bg-slate-950">

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-10 right-0 w-[260px] h-[260px] rounded-full bg-teal-400/5 blur-[90px] pointer-events-none" />

        {/* Top — status pill */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400">
              CRM Hub
            </span>
          </span>
        </div>

        {/* Middle — headline */}
        <div className="relative z-10 space-y-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500">
            Enterprise CRM Platform
          </p>
          <h1 className="text-5xl font-bold text-white leading-[1.08] tracking-tight">
            Everything your<br />
            sales team needs<br />
            <span className="text-teal-400">in one place.</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs">
            Leads, deals, contacts, projects, and inventory — unified and always in sync.
          </p>
        </div>

        {/* Bottom — progress bar + trust stats */}
        <div className="relative z-10">
          <div className="flex items-center gap-px mb-6">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-0.5 rounded-full"
                style={{
                  backgroundColor:
                    i < 28 ? "rgb(20 184 166 / 0.55)" : "rgb(255 255 255 / 0.07)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-8">
            {[
              { value: "99.9%", label: "Uptime SLA" },
              { value: "256-bit", label: "Encryption" },
              { value: "SOC 2", label: "Compliant" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-white font-bold text-base">{stat.value}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form area with transitions ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 bg-background relative overflow-hidden">

        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 z-50">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "light" ? <Moon className="w-5 h-5 text-text-secondary" /> : <Sun className="w-5 h-5 text-text-secondary" />}
          </Button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location}
            initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-sm"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
