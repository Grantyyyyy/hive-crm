import { ChevronDown } from "lucide-react";
import type { LandingTheme } from "./types";

interface FaqSectionProps {
  theme: LandingTheme;
  activeFaq: number | null;
  onToggleFaq: (index: number) => void;
}

export function FaqSection({ theme, activeFaq, onToggleFaq }: FaqSectionProps) {
  const isDark = theme === "dark";

  return (
    <section className={`py-6 lg:py-8 border-t ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-6 lg:gap-14">
          <div className="space-y-5">
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tight uppercase leading-[0.95] ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Frequently <br /> Asked <br /> Questions.
            </h2>
            <p className={`text-lg font-bold uppercase tracking-widest leading-snug ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Answers to the most common queries regarding our platform.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { q: "Is Hub suitable for enterprise teams?", a: "Yes. Hub is built for scale with secure authentication, granular permissions, and organization-level data isolation." },
              { q: "Can I migrate data from my existing CRM?", a: "Absolutely. We support direct API integration and CSV imports to help you move your data quickly." },
              { q: "What's included in the free trial?", a: "You get full access to all modules and features for 14 days so you can test the platform with your team." },
              { q: "Do you offer a self-hosted option?", a: "On-premise deployment is available for enterprise customers with dedicated implementation support." },
            ].map((item, i) => (
              <div key={i} className={`border-2 rounded-2xl overflow-hidden ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <button
                  onClick={() => onToggleFaq(i)}
                  className={`w-full flex items-center justify-between p-6 text-left transition-colors ${
                    isDark ? "bg-slate-900 hover:bg-slate-800" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-lg font-black uppercase tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>{item.q}</span>
                  <ChevronDown className={`w-6 h-6 transition-transform ${activeFaq === i ? "rotate-180" : ""} ${isDark ? "text-slate-300" : "text-slate-600"}`} />
                </button>
                {activeFaq === i && (
                  <div className={`p-6 pt-0 border-t-2 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                    <p className={`text-base font-bold leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
