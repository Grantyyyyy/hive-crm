import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../lib/AuthContext";
import {
  ArrowRight,
  Shield,
  Check,
  Plus,
  ArrowUpRight,
  Menu,
  X,
  Package,
  ShoppingCart,
  Users,
  GitBranch,
  Clock,
  TrendingUp,
  Layers,
  ChevronDown,
  Activity
} from "lucide-react";

interface CounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

const AnimatedCounter: React.FC<CounterProps> = ({ value, duration = 2000, suffix = "", prefix = "" }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;
          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <span ref={countRef} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export const LandingPage: React.FC = () => {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [showcaseTheme, setShowcaseTheme] = useState<'dark' | 'light'>('dark');
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen font-sans selection:bg-[#0D9488] selection:text-white overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
      `}</style>

      {/* 1. MINIMALIST NAV */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md py-4 border-b-2 border-slate-200" : "bg-transparent py-8"}`}>
        <div className="max-w-[1800px] mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans font-black text-3xl tracking-tighter uppercase text-slate-900">HUB.</span>
          </div>

          <div className="hidden lg:flex items-center gap-12">
            {["Product", "Solutions", "Pricing", "Docs"].map((item) => (
              <a key={item} href="#" className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-[#0D9488] transition-colors">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden sm:flex items-center gap-6">
              {isSignedIn ? (
                <Link href="/dashboard" className="bg-slate-900 text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-slate-900/20">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-50 transition-opacity">Sign In</Link>
                  <Link href="/sign-up">
                    <button className="bg-[#0D9488] text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#0F766E] transition-all cursor-pointer shadow-lg shadow-[#0D9488]/20">
                      Join Now
                    </button>
                  </Link>
                </>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-slate-900 p-2 z-[110]">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`fixed inset-0 bg-white z-[100] lg:hidden transition-transform duration-500 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col items-center justify-center h-full gap-12 p-8">
            {["Product", "Solutions", "Pricing", "Docs"].map((item) => (
              <a key={item} href="#" onClick={() => setMobileMenuOpen(false)} className="text-4xl font-black uppercase tracking-tighter hover:text-[#0D9488] transition-colors">
                {item}
              </a>
            ))}
            <div className="flex flex-col gap-4 w-full">
              {isSignedIn ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 bg-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-xl">Go to Dashboard</Link>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 border-2 border-slate-200 text-sm font-black uppercase tracking-widest rounded-xl">Sign In</Link>
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-4 bg-[#0D9488] text-white text-sm font-black uppercase tracking-widest rounded-xl">Join Now</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 2. EDITORIAL HERO */}
      <header className="relative pt-48 pb-24 border-b border-slate-200 bg-white">
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_0.4fr] gap-20 items-end">
            <div className="space-y-12 animate-content-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#0D9488] flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[#0D9488]" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Revenue Infrastructure v2.0</span>
              </div>

              <div className="flex flex-col gap-10">
                <h1 className="text-[10vw] lg:text-[7vw] font-sans font-black leading-[0.8] tracking-tighter uppercase">
                  SCALE <br />
                  <span className="text-white bg-[#0D9488] px-4 inline-block transform -skew-x-6 rounded-md">FAST.</span>
                </h1>

                <div className="flex gap-12 border-t border-slate-100 pt-8 mt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Nodes</p>
                    <p className="text-2xl font-black tabular-nums text-slate-900 tracking-tighter">1,204</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Sync</p>
                    <p className="text-2xl font-black tabular-nums text-slate-900 tracking-tighter">0.04ms</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queue Status</p>
                    <p className="text-2xl font-black text-[#0D9488] tracking-tighter uppercase">Clear</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12 pb-10 animate-content-in" style={{ animationDelay: '0.2s' }}>
              <div className="space-y-6">
                <p className="text-xl lg:text-2xl font-bold leading-tight text-slate-700 max-w-xl">
                  Unified intelligence for teams that treat revenue as code. Scale your sales, inventory, and logistics with sub-millisecond sync.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=hub-${i}`} alt="user" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    <span className="text-slate-900">Phase 1:</span> Deployment Ready
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                <Link href="/sign-up">
                  <button className="w-full sm:w-auto px-12 py-6 bg-[#0D9488] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-center gap-4 group shadow-xl shadow-[#0D9488]/20">
                    Initialize System <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <a href="#docs" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-[#0D9488] transition-colors flex items-center gap-2 group">
                  Documentation <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              <div className="flex items-center gap-3 px-5 py-2 bg-slate-50 border border-slate-200 rounded-full w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Environment: Production Ready — Core v2.4.0</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. PARTNERS STRIP */}
      <div className="bg-white py-12 border-b border-slate-200">
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 shrink-0">Core Engine Architecture_</span>
            <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-20 opacity-30">
              {["Supabase", "React 19", "Tailwind v4", "Lucide", "Vite"].map((brand) => (
                <span key={brand} className="text-xl lg:text-2xl font-sans font-black uppercase tracking-tighter whitespace-nowrap">
                  {brand}
                </span>
              ))}
            </div>
            <div className="hidden lg:block w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-4 text-[#0D9488]">
              <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Global Mainnet Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ASYMMETRIC GRID FEATURES - CORE MODULES */}
      <section className="py-0 relative overflow-hidden bg-white">
        <div className="grid lg:grid-cols-4 border-b border-slate-200">
          {[
            { icon: Users, num: "01", title: "Sales CRM", desc: "Intelligent lead scoring & deal velocity tracking." },
            { icon: Package, num: "02", title: "Inventory", desc: "Real-time stock reservation and multi-location sync." },
            { icon: ShoppingCart, num: "03", title: "Logistics", desc: "Automated procurement and vendor orchestration." },
            { icon: GitBranch, num: "04", title: "Planning", desc: "Resource workload and project management." }
          ].map((item, i) => (
            <div key={i} className="p-16 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-8 hover:bg-[#0D9488] hover:text-white transition-all duration-500 group">
              <div className="w-16 h-16 bg-[#0D9488] text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#0D9488] transition-colors rounded-2xl">
                <item.icon className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 group-hover:text-white/60 tracking-[0.2em]">{item.num}. CAPACITY</span>
                <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter mt-1">{item.title}</h3>
              </div>
              <p className="text-base font-bold opacity-70 leading-snug">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 border-b border-slate-200">
          {[
            { icon: Clock, num: "05", title: "Automation", desc: "Recurring tasks and status workflow triggers." },
            { icon: Shield, num: "06", title: "Security", desc: "JWT Auth, RLS Policies & SOC2 Compliance." },
            { icon: TrendingUp, num: "07", title: "Analytics", desc: "Custom KPI dashboards and revenue forecasting." },
            { icon: Layers, num: "08", title: "Orders", desc: "Quote-to-order conversion and fulfillment." }
          ].map((item, i) => (
            <div key={i} className="p-16 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-8 hover:bg-slate-900 hover:text-white transition-all duration-500 group">
              <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center group-hover:bg-[#0D9488] transition-colors rounded-2xl">
                <item.icon className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 group-hover:text-white/60 tracking-[0.2em]">{item.num}. CORE</span>
                <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter mt-1">{item.title}</h3>
              </div>
              <p className="text-base font-bold opacity-70 leading-snug">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. LARGE IMAGE / DASHBOARD SHOWCASE */}
      <section className="py-32 bg-slate-900 text-white">
        <div className="max-w-[1800px] mx-auto px-8 space-y-20">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-12">
            <h2 className="text-6xl lg:text-7xl font-sans font-black tracking-tighter leading-[0.8] uppercase">
              THE <br /> INTERFACE <br /> OF POWER.
            </h2>
            <div className="max-w-md space-y-8">
              <p className="text-2xl font-bold opacity-60 leading-tight">
                We stripped away the fluff. Optimized for high-density information. Smooth interactions. Just raw data.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-5 py-2 border-2 border-[#0D9488] text-[10px] font-black uppercase tracking-widest text-[#0D9488] rounded-full">Optimized Density</div>
                <div className="px-5 py-2 border-2 border-white/20 text-[10px] font-black uppercase tracking-widest rounded-full">Cross-Platform</div>
                <div className="px-5 py-2 border-2 border-white/20 text-[10px] font-black uppercase tracking-widest rounded-full">Real-time sync</div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-1 rounded-full border border-white/10 flex items-center shrink-0">
               <button 
                 onClick={() => setShowcaseTheme('dark')}
                 className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${showcaseTheme === 'dark' ? "bg-[#0D9488] text-white" : "text-white/40 hover:text-white"}`}
               >
                 Dark Mode
               </button>
               <button 
                 onClick={() => setShowcaseTheme('light')}
                 className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${showcaseTheme === 'light' ? "bg-white text-slate-900" : "text-white/40 hover:text-white"}`}
               >
                 Light Mode
               </button>
            </div>
          </div>

          <div className="relative group p-4 border border-white/10 bg-white/5 rounded-3xl overflow-hidden">
            <div className="aspect-video bg-slate-800 overflow-hidden relative border border-white/10 rounded-2xl">
              <img
                src={showcaseTheme === 'dark' ? "/dashboard-dm.png" : "/dashboard-lm.png"}
                className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                alt="CRM Dashboard Interface"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />

              {/* Fake UI Overlay */}
              <div className="absolute top-10 right-10 flex gap-4">
                <div className="bg-slate-900/90 border border-white/10 p-6 backdrop-blur-xl space-y-2 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Win Rate</p>
                  <p className="text-4xl font-black text-[#0D9488]">34.2%</p>
                </div>
                <div className="bg-slate-900/90 border border-white/10 p-6 backdrop-blur-xl space-y-2 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Pipeline</p>
                  <p className="text-4xl font-black text-blue-400">$12.4M</p>
                </div>
              </div>

              <div className="absolute bottom-10 left-10">
                <div className="bg-[#0D9488] text-white px-8 py-5 font-black text-2xl uppercase tracking-tighter rounded-xl shadow-xl">
                  Hub Enterprise // Version 2.4.0_Stable
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DATA PROOF / STATS */}
      <section className="py-32 bg-white border-b border-slate-200">
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-20">
            {[
              { value: 12400, label: "Command Entities", suffix: "+" },
              { value: 5.2, label: "Processed Volume", prefix: "$", suffix: "B" },
              { value: 120, label: "Global Regions", suffix: "+" },
              { value: 99.99, label: "Uptime SLA", suffix: "%" },
            ].map((stat, i) => (
              <div key={i} className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">{stat.label}</p>
                <p className="text-5xl lg:text-7xl font-black tracking-tighter uppercase">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BRUTALIST PRICING */}
      <section className="py-32 bg-[#F8FAFC]">
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="text-center mb-24 space-y-6">
            <h2 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none">
              INVESTMENT.
            </h2>
            <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Predictable pricing for exponential growth.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-[1400px] mx-auto">
            {[
              {
                name: "Standard",
                price: "490",
                desc: "For fast-moving entities.",
                features: ["Up to 24 core users", "Real-time monitoring", "Global entity mapping", "L1 security patching", "Standard SLA (99.9%)"]
              },
              {
                name: "Elite",
                price: "1,250",
                desc: "For global empires.",
                features: ["Unlimited enterprise users", "Neural forecasting protocol", "24/7 priority support", "Custom API deep-linking", "Elite SLA (99.99%)"],
                highlight: true
              }
            ].map((plan, i) => (
              <div key={i} className={`p-16 space-y-12 rounded-3xl shadow-xl border ${plan.highlight ? "bg-slate-900 text-white border-slate-800" : "bg-white text-slate-900 border-slate-200"}`}>
                <div className="flex justify-between items-start text-left">
                  <div className="space-y-2">
                    <h3 className="text-5xl font-black uppercase tracking-tighter">{plan.name}</h3>
                    <p className="text-lg font-bold opacity-60 uppercase tracking-widest">{plan.desc}</p>
                  </div>
                  {plan.highlight && (
                    <span className="bg-[#0D9488] text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Most Selected</span>
                  )}
                </div>

                <div className="space-y-2 text-left">
                  <p className="text-8xl font-black tracking-tighter uppercase">${plan.price}</p>
                  <p className="text-sm font-bold opacity-40 uppercase tracking-[0.4em]">Per Node / Monthly</p>
                </div>

                <ul className="space-y-6 text-left">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-4">
                      <Check className={`w-5 h-5 text-[#0D9488]`} />
                      <span className="text-sm font-black uppercase tracking-widest">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/sign-up">
                  <button className={`w-full py-8 text-xl font-black uppercase tracking-[0.3em] transition-all cursor-pointer border-2 rounded-full ${plan.highlight ? "bg-[#0D9488] border-[#0D9488] text-white hover:bg-white hover:text-[#0D9488]" : "bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"}`}>
                    Execute Contract
                  </button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-12">All plans include 14-day initialization period. Cancel at any time.</p>
        </div>
      </section>

      {/* 8. BRUTALIST FAQ */}
      <section className="py-32 border-t border-slate-200 bg-white">
        <div className="max-w-[1500px] mx-auto px-8">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-20">
            <div className="space-y-8">
              <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.9]">FAQ_ <br /> SYSTEM_ <br /> LOGS.</h2>
              <p className="text-lg font-bold text-slate-500 uppercase tracking-widest leading-snug">Answers to the most common queries regarding our infrastructure.</p>
            </div>
            <div className="space-y-4">
              {[
                { q: "Is Hub suitable for enterprise teams?", a: "Hub is purpose-built for enterprise with JWT auth, Row Level Security, and role-based access control. Certified for scale." },
                { q: "Can I migrate data from my existing CRM?", a: "Yes. Our direct API pipe and legacy CSV ingestion support global migration within 24 hours." },
                { q: "What's included in the free trial?", a: "Total node access. All modules enabled. 14 days of raw performance testing." },
                { q: "Do you offer a self-hosted option?", a: "On-premise deployment is available for Elite-tier entities with dedicated implementation support." }
              ].map((item, i) => (
                <div key={i} className="border-2 border-slate-200 rounded-2xl overflow-hidden">
                  <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-8 text-left bg-white hover:bg-slate-50 transition-colors">
                    <span className="text-xl font-black uppercase tracking-tighter">{item.q}</span>
                    <ChevronDown className={`w-6 h-6 transition-transform ${activeFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {activeFaq === i && (
                    <div className="p-8 pt-0 bg-white border-t-2 border-slate-100">
                      <p className="text-lg font-bold text-slate-600 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. BRUTALIST FINAL CTA */}
      <section className="py-40 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:50px_50px]"></div>
        <div className="max-w-[1800px] mx-auto px-8 text-center space-y-16 relative z-10">
          <h2 className="text-6xl lg:text-8xl font-sans font-black tracking-tighter uppercase leading-none">
            READY TO <br /> DEPLOY?
          </h2>

          <div className="max-w-2xl mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row gap-0 group border-2 border-[#0D9488] rounded-3xl overflow-hidden shadow-2xl shadow-[#0D9488]/20">
              <input
                type="email"
                placeholder="CONTRACTOR@EMAIL.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white px-8 py-5 text-sm font-black text-slate-900 border-none focus:outline-none uppercase"
              />
              <Link href={`/sign-up?email=${encodeURIComponent(email)}`} className="bg-[#0D9488] px-10 py-5 text-sm font-black uppercase tracking-widest hover:bg-[#0F766E] transition-all flex items-center justify-center gap-4">
                Initialize <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">No credit card required. SOC2 Compliant Deployment.</p>
          </div>
        </div>
      </section>

      {/* 10. EDITORIAL FOOTER */}
      <footer className="bg-slate-950 text-white py-32 border-t border-[#0D9488]">
        <div className="max-w-[1800px] mx-auto px-8 grid lg:grid-cols-[1.5fr_1fr] gap-32">
          <div className="space-y-20">
            <span className="font-sans font-black text-6xl lg:text-7xl leading-none tracking-tighter uppercase">HUB.</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Location</h4>
                <p className="text-sm font-bold uppercase tracking-widest leading-relaxed text-slate-300">San Francisco, CA <br /> 4th St. 94103 <br /> USA</p>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Contact</h4>
                <p className="text-sm font-bold uppercase tracking-widest leading-relaxed text-slate-300">hello@crmhub.io <br /> +1 (555) 000-0000</p>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Legal</h4>
                <div className="flex flex-col gap-2">
                  <a href="#" className="text-sm font-bold uppercase tracking-widest text-[#0D9488] hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="text-sm font-bold uppercase tracking-widest text-[#0D9488] hover:text-white transition-colors">Terms of Service</a>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Social</h4>
                <div className="flex gap-4">
                  {["X", "GH", "LI"].map(s => (
                    <a key={s} href="#" className="w-10 h-10 border-2 border-white/20 flex items-center justify-center text-xs font-black hover:bg-white hover:text-slate-900 transition-all">{s}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-end items-start lg:items-end space-y-12">
            <div className="text-left lg:text-right space-y-4">
              <p className="text-3xl font-black uppercase tracking-tighter">SUBSCRIBE TO <br /> INFRASTRUCTURE UPDATES.</p>
              <div className="flex border-b-2 border-white/20 pb-4 w-full">
                <input type="text" placeholder="YOUR EMAIL" className="bg-transparent border-none focus:outline-none flex-1 text-sm font-black uppercase tracking-widest" />
                <ArrowRight className="w-5 h-5 opacity-40" />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.8em] opacity-20">© 2026 CRM HUB INFRASTRUCTURE // ALL RIGHTS RESERVED_</p>
          </div>
        </div>
      </footer>

    </div>
  );
}