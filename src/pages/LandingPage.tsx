import { Link } from "wouter";
import { SignedIn, SignedOut } from "@/lib/AuthContext";
import {
  BarChart3,
  Users,
  Shield,
  Zap,
  TrendingUp,
  Lock,
  Globe,
  Database,
  Star,
  Check,
  ZapIcon
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="bg-[#FAF9F6] dark:bg-slate-950 min-h-screen font-sans selection:bg-teal-600 selection:text-white text-slate-900 dark:text-slate-100 overflow-x-hidden">

      {/* 1. VIBRANT NAVIGATION */}
      <nav className="fixed top-0 w-full z-[100] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/20 rounded-2xl px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-600/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase px-1">CRM Hub</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Platform", "Solutions", "Enterprise", "Pricing"].map((item) => (
              <a key={item} href="#" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <Link href="/sign-in">
                <button className="text-xs font-bold text-slate-900 dark:text-white hover:text-teal-600 transition-colors">Log In</button>
              </Link>
              <Link href="/sign-up">
                <button className="bg-teal-600 text-white px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-teal-600/10 active:scale-95 transition-all">Get Started</button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button className="bg-teal-600 text-white px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-teal-600/10 active:scale-95 transition-all">Launch Dashboard</button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* 2. ASYMMETRIC HERO (Combined Styles) */}
      <header className="relative pt-32 pb-60 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#E0F7F6] dark:bg-teal-900/10 z-0 rounded-bl-[10rem] hidden lg:block" />

        <div className="max-w-7xl mx-auto px-8 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-full shadow-lg shadow-teal-600/20 active:scale-95 cursor-default">
              <Star className="w-3.5 h-3.5 fill-white" />
              <span className="text-[10px] font-black uppercase tracking-widest">Next-Gen Revenue Engine</span>
            </div>

            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] text-slate-900 dark:text-white">
              RUN ON <br />
              <span className="text-teal-600">HUB.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
              Unify your sales, inventory, and logistics in a single high-bandwidth workspace.
              Built for teams who outpace their software.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/sign-up">
                <button className="w-full sm:w-auto px-10 py-5 bg-teal-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-teal-700 active:scale-95 transition-all">
                  Initialize Free Trial
                </button>
              </Link>
              <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 group cursor-pointer hover:border-teal-500 transition-all">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                </div>
                <span className="text-[10px] font-black text-slate-400 group-hover:text-teal-600 uppercase tracking-widest">+12k Teams Joined</span>
              </div>
            </div>

            <div className="flex items-center gap-12 pt-10">
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">4.9/5</p>
                <div className="flex gap-0.5 py-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-teal-500 text-teal-500" />)}
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">G2 Rating</p>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">2.4M</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 py-1">Deals Synced</p>
              </div>
            </div>
          </div>

          {/* FLOATING CUT-OUT DASHBOARD */}
          <div className="relative group perspective-1000">
            <div className="absolute inset-0 bg-teal-600/20 blur-[100px] rounded-full scale-75 animate-pulse" />
            <div className="relative z-10 bg-white dark:bg-slate-900 p-3 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group-hover:rotate-y-12 transition-all duration-1000">
              <div className="rounded-[2.4rem] overflow-hidden border border-slate-100 dark:border-slate-800">
                <img
                  src="/crm_hero_dashboard.png"
                  alt="CRM Hub Dashboard"
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              {/* Floating Badges */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#FFEB3B] rounded-full flex flex-col items-center justify-center text-center p-4 shadow-xl rotate-12 group-hover:rotate-0 transition-transform">
                <span className="text-2xl font-black text-slate-900 leading-none">99.9%</span>
                <span className="text-[9px] font-black uppercase text-slate-700 tracking-tighter">Availability</span>
              </div>
              <div className="absolute -bottom-10 -right-5 px-6 py-4 bg-teal-600 text-white rounded-3xl shadow-2xl -rotate-6 group-hover:rotate-0 transition-transform">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Live Feed</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-bold">Syncing US-WEST-2</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ORGANIC WAVE TRANSITION */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-[calc(100%+1.3px)] h-[150px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-[#FAF9F6] dark:fill-slate-950"></path>
          </svg>
        </div>
      </header>

      {/* 3. HIGH DENSITY FEATURES (Blue Style) */}
      <section className="bg-teal-600 py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#ffffff10,transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 text-white">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
                Your assistant <br />
                <span className="text-teal-200 italic">handles the work.</span>
              </h2>
              <div className="space-y-6">
                {[
                  "Automated multi-channel integration",
                  "Real-time pipeline synchronization",
                  "Predictive win-rate forecasting",
                  "Scale up to 10M entities without lag"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-all">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-lg font-medium opacity-90">{item}</span>
                  </div>
                ))}
              </div>
              <button className="px-8 py-4 bg-white text-teal-600 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-slate-50 active:scale-95 transition-all">
                View Full Platform
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Revenue flow", icon: TrendingUp },
                { title: "Entity graph", icon: Users },
                { title: "Scalability", icon: ZapIcon },
                { title: "Global sync", icon: Globe }
              ].map((card, i) => (
                <div key={i} className="bg-white/10 border border-white/20 p-10 rounded-[2.5rem] backdrop-blur-xl group hover:bg-white/20 transition-all">
                  <card.icon className="w-10 h-10 mb-6 opacity-60 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                  <p className="text-sm font-medium opacity-70 leading-relaxed">
                    High-bandwidth data processing for enterprise-grade operations.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. EVERYTHING YOU NEED (Bento Mix) */}
      <section className="py-40 bg-white dark:bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-8 space-y-20">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9]">
              EVERYTHING YOU NEED <br />
              TO RUN ON <span className="text-teal-600">AUTOPILOT.</span>
            </h2>
            <div className="w-20 h-2 bg-teal-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2 row-span-2 bg-[#F2F2F2] dark:bg-slate-800 rounded-[3rem] p-12 space-y-12 overflow-hidden relative group">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Module 01 // Operations</p>
                <h3 className="text-4xl font-bold">Dynamic Pipelines</h3>
                <p className="text-slate-500 font-medium">Custom stages with in-line logic and status monitoring.</p>
              </div>
              <div className="translate-y-10 group-hover:translate-y-0 transition-transform duration-700">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
                    <span className="text-xs font-bold">Active Deal Transit</span>
                    <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase">Optimal</div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-600" style={{ width: i === 1 ? '70%' : i === 2 ? '40%' : '85%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#E9FBF9] dark:bg-teal-900/10 rounded-[3rem] p-10 space-y-6">
              <Shield className="w-10 h-10 text-teal-600" />
              <h3 className="text-xl font-bold">Enterprise Security</h3>
              <p className="text-sm font-medium text-slate-500">Bank-level encryption and SOC2 cluster protection.</p>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 space-y-6 text-white">
              <Database className="w-10 h-10 text-teal-500" />
              <h3 className="text-xl font-bold">Data Sovereignty</h3>
              <p className="text-sm font-medium opacity-60">Complete ownership of your cluster and data streams.</p>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-[3rem] p-10 flex items-center justify-between group">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Global Presence</h3>
                <p className="text-sm font-medium text-slate-500">22 Data centers worldwide for sub-10ms latency.</p>
              </div>
              <Globe className="w-16 h-16 text-slate-100 group-hover:text-teal-100 transition-colors" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. VIBRANT FOOTER */}
      <footer className="bg-teal-600 pt-32 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
          <svg className="relative block w-[calc(110%+1.3px)] h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white dark:fill-slate-900"></path>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-8 relative z-10 text-white space-y-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-teal-600" />
                </div>
                <span className="font-black text-2xl tracking-tighter uppercase">CRM Hub</span>
              </div>
              <p className="text-teal-100 font-medium leading-relaxed">
                The modern standard for high-bandwidth revenue and operations management.
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer" />)}
              </div>
            </div>

            {["Product", "Company", "Solutions", "Legal"].map((col) => (
              <div key={col} className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em]">{col}</h4>
                <ul className="space-y-4">
                  {["Infrastructure", "Analytics", "Security", "Scale"].map(link => (
                    <li key={link}><a href="#" className="text-teal-100 text-sm hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-16 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 text-teal-200">
            <p className="text-sm font-medium">© 2026 CRM Hub. All systems operational.</p>
            <div className="flex items-center gap-8 text-xs font-black uppercase tracking-widest">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Use</a>
              <a href="#" className="hover:text-white flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> SOC2 Compliance
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Badge */}
      <button className="fixed bottom-10 right-10 w-20 h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-2xl flex flex-col items-center justify-center group active:scale-90 transition-all z-[200]">
        <Zap className="w-6 h-6 text-teal-600 group-hover:scale-125 transition-transform" />
        <span className="text-[8px] font-black uppercase text-slate-400 mt-1">Deploy</span>
      </button>

    </div>
  );
}
