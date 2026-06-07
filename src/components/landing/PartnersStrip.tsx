import { Smartphone, ShieldCheck, MessageCircleHeart } from "lucide-react";
import type { LandingTheme } from "./types";

interface PartnersStripProps {
  theme: LandingTheme;
}

const points = [
  { icon: Smartphone, title: "Works everywhere", desc: "On your computer, tablet, or phone." },
  { icon: ShieldCheck, title: "Safe & private", desc: "Your business data stays yours, always." },
  { icon: MessageCircleHeart, title: "Friendly help", desc: "Real people, ready when you need them." },
];

export function PartnersStrip({ theme }: PartnersStripProps) {
  const isDark = theme === "dark";

  return (
    <div className={`py-8 border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="grid sm:grid-cols-3 gap-6">
          {points.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-accent-dim text-accent flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{title}</p>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
