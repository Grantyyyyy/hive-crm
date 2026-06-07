import { Check, Sprout, Zap, Crown } from "lucide-react";
import { Link } from "wouter";
import type { LandingTheme } from "./types";

interface PricingSectionProps {
  theme: LandingTheme;
}

const plans = [
  {
    icon: Sprout,
    name: "Free",
    tagline: "Perfect for trying it out",
    price: null,
    features: [
      "Up to 5 team members",
      "100 customers & contacts",
      "Track up to 50 deals",
      "3 active projects",
      "To-do lists & reminders",
      "Help from our community",
    ],
    highlight: false,
    cta: "Start for free",
    ctaHref: "/sign-up",
    priceNote: "No credit card needed",
  },
  {
    icon: Zap,
    name: "Pro",
    tagline: "Great for growing teams",
    price: "29",
    features: [
      "Up to 10 team members",
      "Unlimited customers & contacts",
      "Unlimited deals",
      "Stock & inventory tracking",
      "Buying from suppliers",
      "Add your own logo & colors",
    ],
    highlight: true,
    cta: "Get started",
    ctaHref: "/sign-up",
    priceNote: "per month, billed monthly",
  },
  {
    icon: Crown,
    name: "Business",
    tagline: "For bigger or multi-site teams",
    price: "129",
    features: [
      "Unlimited team members",
      "Full supplier purchasing",
      "Advanced quotes & orders",
      "Custom team permissions",
      "Manage multiple locations",
      "Priority support",
    ],
    highlight: false,
    cta: "Talk to us",
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
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? "text-accent" : "text-accent"}`}>
            Pricing
          </p>
          <h2 className={`text-4xl lg:text-5xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Simple, transparent pricing
          </h2>
          <p className={`text-sm font-medium max-w-md mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Start free and upgrade only when you're ready. No hidden fees and no surprises.
          </p>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`group relative flex flex-col rounded-3xl border transition-all duration-300 hover:translate-y-[-4px] ${plan.highlight
                  ? isDark
                    ? "bg-slate-900 border-accent/30 shadow-xl shadow-black/5"
                    : "bg-white border-accent/20 shadow-xl shadow-black/5"
                  : isDark
                    ? "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                  }`}
              >
                {/* Most Popular badge — Absolute for alignment consistency */}
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1.5 bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 flex flex-col h-full">
                  {/* Header Section with Icon */}
                  <div className="mb-8">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${plan.highlight
                      ? "bg-accent text-white shadow-sm"
                      : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                      }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isDark ? "text-accent/80" : "text-accent"}`}>
                      {plan.tagline}
                    </p>
                    <h3 className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      {plan.name}
                    </h3>
                  </div>

                  {/* Price Section */}
                  <div className={`mb-8 pb-8 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    {plan.price === null ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-5xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                            Free
                          </span>
                        </div>
                        <p className={`text-xs font-medium mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {plan.priceNote}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-bold ${isDark ? "text-slate-400" : "text-slate-400"}`}>$</span>
                          <span className={`text-5xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                            {plan.price}
                          </span>
                          <span className={`text-sm font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>/mo</span>
                        </div>
                        <p className={`text-xs font-medium mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          billed monthly
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight
                          ? "bg-accent-dim"
                          : isDark ? "bg-slate-800/50" : "bg-slate-100"
                          }`}>
                          <Check className={`w-3 h-3 ${plan.highlight ? "text-accent" : isDark ? "text-slate-500" : "text-slate-400"
                            }`} />
                        </div>
                        <span className={`text-sm leading-tight ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <Link href={plan.ctaHref}>
                    <button
                      className={`w-full py-4 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all duration-300 active:scale-95 ${plan.highlight
                        ? "bg-accent hover:opacity-90 text-white shadow-sm"
                        : isDark
                          ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                          : "bg-slate-100 text-slate-900 hover:bg-slate-200"
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