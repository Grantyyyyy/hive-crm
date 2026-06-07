import { Bell, BarChart3, ClipboardList, Lock, Package, ShoppingCart, Users, FileText } from "lucide-react";
import type { LandingTheme } from "./types";

interface ModulesSectionProps {
  theme: LandingTheme;
}

const features = [
  { icon: Users, title: "Customers & leads", desc: "Keep every customer in one tidy list and never forget to follow up." },
  { icon: Package, title: "Stock & inventory", desc: "See what you have in stock at a glance, so you never run out or over-order." },
  { icon: FileText, title: "Quotes & orders", desc: "Send a quote, turn it into an order with one click, and track it to delivery." },
  { icon: ShoppingCart, title: "Buying from suppliers", desc: "Order what you need and keep all your supplier paperwork in one place." },
  { icon: ClipboardList, title: "Projects & tasks", desc: "Plan the work, share it with your team, and see what's getting done." },
  { icon: Bell, title: "Helpful reminders", desc: "Hive nudges you about follow-ups and low stock so nothing slips through." },
  { icon: BarChart3, title: "Easy reports", desc: "Clear, simple charts that show how your business is really doing." },
  { icon: Lock, title: "Private & secure", desc: "Decide who on your team sees what — your information stays protected." },
];

export function ModulesSection({ theme }: ModulesSectionProps) {
  const isDark = theme === "dark";
  const sectionBg = isDark ? "bg-slate-950" : "bg-white";
  const cardBorder = isDark ? "border-slate-800" : "border-slate-200";
  const cardBg = isDark ? "bg-slate-900/40 hover:bg-slate-900" : "bg-white hover:bg-slate-50";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const subColor = isDark ? "text-slate-400" : "text-slate-600";

  return (
    <section id="modules" className={`py-16 lg:py-24 ${sectionBg}`}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12 space-y-4">
          <p className="text-sm font-bold uppercase tracking-wide text-accent">Everything in one place</p>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${textColor}`}>
            One simple tool for the whole business
          </h2>
          <p className={`text-lg ${subColor}`}>
            No more juggling spreadsheets and sticky notes. Hive brings the everyday parts of
            your business together, so everything just works.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 ${cardBorder} ${cardBg}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-accent-dim text-accent flex items-center justify-center mb-5">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${textColor}`}>{title}</h3>
              <p className={`text-sm leading-relaxed ${subColor}`}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
