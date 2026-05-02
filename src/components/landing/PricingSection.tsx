import { Check } from "lucide-react";
import { Link } from "wouter";
import type { LandingTheme } from "./types";

interface PricingSectionProps {
  theme: LandingTheme;
}

export function PricingSection({ theme }: PricingSectionProps) {
  const isDark = theme === "dark";

  return (
    <section id="pricing" className={`py-6 lg:py-8 ${isDark ? "bg-slate-900" : "bg-[#F8FAFC]"}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="text-center mb-10 space-y-2">
          <h2 className={`text-3xl lg:text-4xl font-black tracking-tight uppercase leading-none ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Investment.
          </h2>
          <p className={`text-sm lg:text-base font-bold uppercase tracking-[0.25em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Predictable pricing for exponential growth.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 max-w-[1080px] mx-auto">
          {[
            {
              name: "Standard",
              price: "490",
              desc: "For fast-moving entities.",
              features: ["Up to 10 core users", "Sales & Deal Pipeline", "Inventory & Stock Tracking", "Project & Task Management", "Standard Audit Logging"],
            },
            {
              name: "Elite",
              price: "1,250",
              desc: "For global empires.",
              features: ["Unlimited enterprise users", "Full Procurement Workflow", "Advanced Quotes & Orders", "Multi-Org Management", "Granular RBAC & Branding", "Priority Support & SLA"],
              highlight: true,
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`p-7 lg:p-8 space-y-6 rounded-2xl shadow-lg border ${
                plan.highlight
                  ? "bg-slate-900 text-white border-slate-800"
                  : isDark
                    ? "bg-slate-950 text-slate-100 border-slate-800"
                    : "bg-white text-slate-900 border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start text-left gap-3">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black uppercase tracking-tight">{plan.name}</h3>
                  <p className="text-sm font-bold opacity-60 uppercase tracking-[0.2em]">{plan.desc}</p>
                </div>
                {plan.highlight && (
                  <span className="bg-[#0D9488] text-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] rounded-full">
                    Most Selected
                  </span>
                )}
              </div>

              <div className="space-y-1 text-left">
                <p className="text-5xl lg:text-6xl font-black tracking-tight uppercase">${plan.price}</p>
                <p className="text-[11px] font-bold opacity-40 uppercase tracking-[0.28em]">Per Node / Monthly</p>
              </div>

              <ul className="space-y-3 text-left">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#0D9488]" />
                    <span className="text-xs font-black uppercase tracking-[0.18em]">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/sign-up">
                <button
                  className={`w-full py-3.5 text-sm font-black uppercase tracking-[0.2em] transition-all cursor-pointer border-2 rounded-full ${
                    plan.highlight
                      ? "bg-[#0D9488] border-[#0D9488] text-white hover:bg-white hover:text-[#0D9488]"
                      : isDark
                        ? "bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-100 hover:text-slate-900"
                        : "bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  Execute Contract
                </button>
              </Link>
            </div>
          ))}
        </div>
        <p className={`text-center text-[9px] font-black uppercase tracking-[0.25em] mt-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          All plans include 14-day initialization period. Cancel at any time.
        </p>
      </div>
    </section>
  );
}
