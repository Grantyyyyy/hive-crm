import { ArrowRight } from "lucide-react";
import type { LandingTheme } from "./types";

interface FooterSectionProps {
  theme: LandingTheme;
}

export function FooterSection({ theme }: FooterSectionProps) {
  const isDark = theme === "dark";

  return (
    <footer className={`py-12 ${isDark ? "bg-slate-950 border-t border-slate-800 text-white" : "bg-slate-900 text-white"}`}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 grid lg:grid-cols-[1.5fr_1fr] gap-12">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <img src="/hub.svg" alt="Hive logo" className="w-10 h-10 invert" />
            <span className="font-extrabold text-3xl tracking-tight">Hive</span>
          </div>

          <p className="text-base text-slate-300 max-w-sm leading-relaxed">
            The simple, all-in-one tool that helps small teams keep their customers,
            sales, and stock organized — without the headaches.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Get in touch</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                hello@hivecrm.io <br /> +1 (555) 000-0000
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Company</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Follow along</h4>
              <div className="flex gap-3">
                {["X", "in", "f"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="w-9 h-9 rounded-xl border border-white/20 flex items-center justify-center text-sm font-bold hover:bg-white hover:text-slate-900 transition-all"
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 lg:items-end">
          <div className="space-y-4 w-full lg:text-right">
            <p className="text-xl font-bold">Tips & updates, now and then</p>
            <p className="text-sm text-slate-400">Helpful ideas for running your business — no spam, ever.</p>
            <div className="flex items-center gap-2 border-b border-white/20 pb-3 w-full">
              <input
                type="email"
                placeholder="Your email"
                className="bg-transparent border-none focus:outline-none flex-1 text-sm text-white placeholder:text-slate-500"
              />
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <p className="text-xs text-slate-500 lg:text-right">
            © 2026 Hive. Made for small businesses.
          </p>
        </div>
      </div>
    </footer>
  );
}
