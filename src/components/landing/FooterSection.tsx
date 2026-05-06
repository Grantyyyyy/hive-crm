import { ArrowRight } from "lucide-react";
import type { LandingTheme } from "./types";

interface FooterSectionProps {
  theme: LandingTheme;
}

export function FooterSection({ theme }: FooterSectionProps) {
  const isDark = theme === "dark";

  return (
    <footer className={`py-8 border-t border-accent ${isDark ? "bg-slate-950 text-white" : "bg-slate-900 text-white"}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 grid lg:grid-cols-[1.5fr_1fr] gap-10">
        <div className="space-y-10">
          <span className="font-sans font-black text-4xl lg:text-5xl leading-none tracking-tight uppercase">HUB.</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Location</h4>
              <p className="text-sm font-bold uppercase tracking-widest leading-relaxed text-slate-300">
                San Francisco, CA <br /> 4th St. 94103 <br /> USA
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Contact</h4>
              <p className="text-sm font-bold uppercase tracking-widest leading-relaxed text-slate-300">
                hello@crmhub.io <br /> +1 (555) 000-0000
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Legal</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm font-bold uppercase tracking-widest text-accent hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm font-bold uppercase tracking-widest text-accent hover:text-white transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Social</h4>
              <div className="flex gap-4">
                {["X", "GH", "LI"].map((s) => (
                  <a key={s} href="#" className="w-10 h-10 border-2 border-white/20 flex items-center justify-center text-xs font-black hover:bg-white hover:text-slate-900 transition-all">
                    {s}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end items-start lg:items-end space-y-8">
          <div className="text-left lg:text-right space-y-4">
            <p className="text-3xl font-black uppercase tracking-tight">
              SUBSCRIBE TO <br /> INFRASTRUCTURE UPDATES.
            </p>
            <div className="flex border-b-2 border-white/20 pb-4 w-full">
              <input type="text" placeholder="YOUR EMAIL" className="bg-transparent border-none focus:outline-none flex-1 text-sm font-black uppercase tracking-widest" />
              <ArrowRight className="w-5 h-5 opacity-40" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.8em] opacity-20">
            Copyright 2026 CRM HUB INFRASTRUCTURE // ALL RIGHTS RESERVED_
          </p>
        </div>
      </div>
    </footer>
  );
}
