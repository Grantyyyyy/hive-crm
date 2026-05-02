import { Clock, GitBranch, Layers, Package, Shield, ShoppingCart, TrendingUp, Users } from "lucide-react";
import type { LandingTheme } from "./types";

interface ModulesSectionProps {
  theme: LandingTheme;
}

const topModules = [
  { icon: Users, num: "01", title: "Sales CRM", desc: "Lead management, deal pipeline, and automated activity tracking." },
  { icon: Package, num: "02", title: "Inventory", desc: "Real-time stock monitoring, transaction history, and master data sync." },
  { icon: ShoppingCart, num: "03", title: "Procurement", desc: "End-to-end purchasing from requests (PR) to purchase orders (PO)." },
  { icon: GitBranch, num: "04", title: "Planning", desc: "Project lifecycle management and team workload orchestration." },
];

const bottomModules = [
  { icon: Layers, num: "05", title: "Fulfillment", desc: "Seamless conversion from quotes to sales orders with tracking." },
  { icon: Shield, num: "06", title: "Governance", desc: "Multi-tenant isolation, granular RBAC, and audit logging." },
  { icon: TrendingUp, num: "07", title: "Analytics", desc: "Unified reporting dashboards and performance forecasting." },
  { icon: Clock, num: "08", title: "Automation", desc: "Scheduled background jobs and event-driven status triggers." },
];

export function ModulesSection({ theme }: ModulesSectionProps) {
  const isDark = theme === "dark";
  const sectionBg = isDark ? "bg-slate-950" : "bg-white";
  const borderColor = isDark ? "border-slate-800" : "border-slate-200";
  const textColor = isDark ? "text-slate-100" : "text-slate-900";
  const labelColor = isDark ? "text-slate-500 group-hover:text-white/60" : "text-slate-400 group-hover:text-white/60";

  return (
    <section id="modules" className={`py-12 lg:py-16 relative overflow-hidden ${sectionBg}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="mb-12 space-y-4">
          <h2 className={`text-4xl lg:text-6xl font-sans font-black tracking-tight uppercase leading-none ${textColor}`}>
            Modular <br /> Architecture.
          </h2>
          <p className={`text-lg font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Select the components required for your operation.
          </p>
        </div>

        <div className={`grid lg:grid-cols-4 border ${borderColor} rounded-3xl overflow-hidden shadow-2xl shadow-black/10`}>
          {topModules.map((item, i) => (
            <div
              key={i}
              className={`p-10 lg:p-12 border-b lg:border-b-0 lg:border-r ${borderColor} space-y-6 hover:bg-[#0D9488] hover:text-white transition-all duration-500 group`}
            >
              <div className="w-16 h-16 bg-[#0D9488] text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#0D9488] transition-colors rounded-2xl">
                <item.icon className="w-8 h-8" />
              </div>
              <div>
                <span className={`text-[10px] font-black tracking-[0.2em] ${labelColor}`}>{item.num}. CAPACITY</span>
                <h3 className={`text-xl lg:text-2xl font-black uppercase tracking-tight mt-1 ${textColor} group-hover:text-white`}>{item.title}</h3>
              </div>
              <p className={`text-sm sm:text-base font-bold opacity-70 leading-snug ${textColor} group-hover:text-white`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className={`grid lg:grid-cols-4 border-x border-b border-t-0 ${borderColor} rounded-b-3xl overflow-hidden shadow-2xl shadow-black/10`}>
          {bottomModules.map((item, i) => (
            <div
              key={i}
              className={`p-10 lg:p-12 border-b lg:border-b-0 lg:border-r ${borderColor} space-y-6 hover:bg-slate-900 hover:text-white transition-all duration-500 group`}
            >
              <div className={`w-16 h-16 ${isDark ? "bg-slate-700" : "bg-slate-900"} text-white flex items-center justify-center group-hover:bg-[#0D9488] transition-colors rounded-2xl`}>
                <item.icon className="w-8 h-8" />
              </div>
              <div>
                <span className={`text-[10px] font-black tracking-[0.2em] ${labelColor}`}>{item.num}. CORE</span>
                <h3 className={`text-xl lg:text-2xl font-black uppercase tracking-tight mt-1 ${textColor} group-hover:text-white`}>{item.title}</h3>
              </div>
              <p className={`text-sm sm:text-base font-bold opacity-70 leading-snug ${textColor} group-hover:text-white`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
