import { 
  Calendar, 
  Download, 
  Banknote, 
  TrendingUp, 
  Package, 
  Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Reports() {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in space-y-8">
        
        {/* Header Pattern */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">View and analyze your business performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineNeutral">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </Button>
            <Button variant="default">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg shadow-sm">+12.5%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
            <h3 className="text-2xl font-bold mt-1">$428,500</h3>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg shadow-sm">+2.1%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deal Conversion</p>
            <h3 className="text-2xl font-bold mt-1">24.8%</h3>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg shadow-sm">-0.5%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Inventory Turnover</p>
            <h3 className="text-2xl font-bold mt-1">4.2x</h3>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg shadow-sm">+8.4%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Customer LTV</p>
            <h3 className="text-2xl font-bold mt-1">$2,840</h3>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trends */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">Revenue Trends</h4>
              <select className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer text-slate-500 dark:text-slate-400">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-64 flex flex-col justify-end">
              <svg className="w-full h-48" preserveAspectRatio="none" viewBox="0 0 400 150">
                <path d="M0,120 Q50,110 80,70 T160,50 T240,80 T320,30 T400,20" fill="none" stroke="#4f46e5" strokeLinecap="round" strokeWidth="4"></path>
                <path d="M0,120 Q50,110 80,70 T160,50 T240,80 T320,30 T400,20 L400,150 L0,150 Z" fill="url(#grad1)"></path>
                <defs>
                  <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" style={{stopColor: "#4f46e5", stopOpacity: 0.2}}></stop>
                    <stop offset="100%" style={{stopColor: "#4f46e5", stopOpacity: 0}}></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-2">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>
          
          {/* Monthly Conversion */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">Conversion Growth</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span className="text-xs font-medium text-slate-500">Deals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                  <span className="text-xs font-medium text-slate-500">Target</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-4 px-2">
              <div className="flex-1 flex flex-col justify-end gap-1 h-full">
                <div className="w-full bg-indigo-600/20 rounded-t-lg" style={{ height: "60%" }}></div>
                <div className="w-full bg-indigo-600 rounded-t-lg" style={{ height: "45%" }}></div>
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">JAN</p>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-1 h-full">
                <div className="w-full bg-indigo-600/20 rounded-t-lg" style={{ height: "70%" }}></div>
                <div className="w-full bg-indigo-600 rounded-t-lg" style={{ height: "55%" }}></div>
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">FEB</p>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-1 h-full">
                <div className="w-full bg-indigo-600/20 rounded-t-lg" style={{ height: "85%" }}></div>
                <div className="w-full bg-indigo-600 rounded-t-lg" style={{ height: "75%" }}></div>
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">MAR</p>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-1 h-full">
                <div className="w-full bg-indigo-600/20 rounded-t-lg" style={{ height: "65%" }}></div>
                <div className="w-full bg-indigo-600 rounded-t-lg" style={{ height: "60%" }}></div>
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">APR</p>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-1 h-full">
                <div className="w-full bg-indigo-600/20 rounded-t-lg" style={{ height: "90%" }}></div>
                <div className="w-full bg-indigo-600 rounded-t-lg" style={{ height: "85%" }}></div>
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">MAY</p>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-1 h-full">
                <div className="w-full bg-indigo-600/20 rounded-t-lg" style={{ height: "80%" }}></div>
                <div className="w-full bg-indigo-600 rounded-t-lg" style={{ height: "95%" }}></div>
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">JUN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Detail Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Sales Breakdown */}
          <div className="xl:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Recent Performance Metrics</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="pb-4 font-semibold">Category</th>
                    <th className="pb-4 font-semibold">Volume</th>
                    <th className="pb-4 font-semibold">Growth</th>
                    <th className="pb-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">Enterprise Sales</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">$182.4k</td>
                    <td className="py-4 font-medium text-emerald-600 dark:text-emerald-500">+14.2%</td>
                    <td className="py-4 text-right">
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Stable</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">Retail Subscriptions</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">$94.2k</td>
                    <td className="py-4 font-medium text-emerald-600 dark:text-emerald-500">+8.5%</td>
                    <td className="py-4 text-right">
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Stable</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">Bulk Inventory</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">$151.9k</td>
                    <td className="py-4 font-medium text-rose-600 dark:text-rose-500">-2.4%</td>
                    <td className="py-4 text-right">
                      <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Watch</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Circular Metrics (e.g. Inventory Health) */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col items-center justify-center text-center">
            <h4 className="font-bold text-lg mb-8 w-full text-left text-slate-900 dark:text-white">Inventory Health</h4>
            <div className="relative w-40 h-40 mb-6">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-slate-100 dark:text-slate-800 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="10"></circle>
                <circle className="text-indigo-600 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeDasharray="251.2" strokeDashoffset="60" strokeLinecap="round" strokeWidth="10"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">76%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">Optimal</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 px-4">Your inventory efficiency is higher than 84% of competitors in your niche.</p>
            <Button variant="outline" className="w-full">Optimize Stock</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
