import { Check, Sprout, Zap, Building2 } from "lucide-react";
import { Link } from "wouter";
import type { LandingTheme } from "./types";

interface PricingSectionProps {
  theme: LandingTheme;
}

const plans = [
  {
    icon: Sprout,
    name: "Free",
    tagline: "Try before you commit",
    price: null,
    features: [
      "1 user",
      "Up to 50 leads & contacts",
      "Basic deal pipeline",
      "Task management",
      "Community support",
    ],
    highlight: false,
    cta: "Start for Free",
    ctaHref: "/sign-up",
    priceNote: "No credit card required",
  },
  {
    icon: Zap,
    name: "Standard",
    tagline: "For fast-moving teams",
    price: "490",
    features: [
      "Up to 10 users",
      "Unlimited leads & contacts",
      "Sales & deal pipeline",
      "Inventory & stock tracking",
      "Project & task management",
      "Standard audit logging",
    ],
    highlight: false,
    cta: "Get Started",
    ctaHref: "/sign-up",
    priceNote: "per month, billed monthly",
  },
  {
    icon: Building2,
    name: "Elite",
    tagline: "For scaling enterprises",
    price: "1,250",
    features: [
      "Unlimited users",
      "Full procurement workflow",
      "Advanced quotes & orders",
      "Multi-org management",
      "Granular RBAC & branding",
      "Priority support & SLA",
    ],
    highlight: true,
    cta: "Get Started",
    ctaHref: "/sign-up",
    priceNote: "per month, billed monthly",
  },
];

export function PricingSection({ theme }: PricingSectionProps) {
  const isDark = theme === "dark";

  return (
    <section
      id="pricing"
      className={`py-20 lg:py-28 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-6">

        {/* Header */}
        <div className="text-center mb-14 space-y-3">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? "text-teal-500" : "text-teal-600"}`}>
            Pricing
          </p>
          <h2 className={`text-4xl lg:text-5xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Simple, transparent pricing
          </h2>
          <p className={`text-sm font-medium max-w-md mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Start free, scale when you're ready. No hidden fees, no per-seat surprises.
          </p>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-5 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl border ${plan.highlight
                    ? isDark
                      ? "bg-slate-900 border-teal-600/50"
                      : "bg-white border-teal-600/40 shadow-lg"
                    : isDark
                      ? "bg-slate-900/50 border-slate-800"
                      : "bg-white border-slate-200 shadow-sm"
                  }`}
              >
                {/* Top accent line on highlighted card only */}
                {plan.highlight && (
                  <div className="h-0.5 w-full bg-teal-600 rounded-t-2xl" />
                )}

                <div className="p-7 flex flex-col gap-6">

                  {/* Icon + plan name */}
                  <div>
                    {/* Most Popular badge — inline, inside the card */}
                    {plan.highlight && (
                      <div className="mb-4">
                        <span className="px-3 py-1 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${plan.highlight
                        ? "bg-teal-600 text-white"
                        : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                      }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {plan.tagline}
                    </p>
                    <h3 className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      {plan.name}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className={`pb-6 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    {plan.price === null ? (
                      <div>
                        <span className={`text-5xl font-bold tracking-tight leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
                          Free
                        </span>
                        <p className={`text-xs font-medium mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {plan.priceNote}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-end gap-1">
                          <span className={`text-sm font-bold pb-1 ${isDark ? "text-slate-400" : "text-slate-400"}`}>$</span>
                          <span className={`text-5xl font-bold tracking-tight leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
                            {plan.price}
                          </span>
                        </div>
                        <p className={`text-xs font-medium mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {plan.priceNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight
                            ? isDark ? "bg-teal-900/40" : "bg-teal-50"
                            : isDark ? "bg-slate-800" : "bg-slate-100"
                          }`}>
                          <Check className={`w-3 h-3 ${plan.highlight ? "text-teal-600" : isDark ? "text-slate-400" : "text-slate-500"
                            }`} />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href={plan.ctaHref}>
                    <button
                      className={`w-full py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${plan.highlight
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : isDark
                            ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className={`text-center text-xs font-medium mt-8 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
          All paid plans include a 14-day free trial. Cancel any time.
        </p>
      </div>
    </section>
  );
}