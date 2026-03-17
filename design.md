## DESIGN SYSTEM — Follow these rules exactly for every new page ##

STACK: React + TypeScript + Tailwind CSS + shadcn/ui + lucide-react

PAGE WRAPPER (every page must start with this):
<div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
  <div className="mx-auto p-4 md:p-8 max-w-[1600px] animate-fade-in">
    ...
  </div>
</div>

HEADER PATTERN (every page):
<div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
  <div>
    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Page Title</h1>
    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Subtitle here.</p>
  </div>
  <div className="flex items-center gap-3">
    {/* action buttons */}
  </div>
</div>

COLORS:
- Backgrounds: bg-slate-50 (page) · bg-white dark:bg-slate-900 (cards)
- Borders: border-slate-200 dark:border-slate-800
- Primary: indigo-600 (buttons, active states, focus rings)
- Text: slate-900/white (primary) · slate-500/slate-400 (muted) · slate-400 (icons)
- NEVER use gray/zinc/stone — always slate

BUTTONS:
Primary: bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-5
         shadow-lg shadow-indigo-200 dark:shadow-none font-bold text-xs uppercase tracking-wider
Outline: variant="outline" rounded-xl border-slate-200 dark:border-slate-800
         h-11 px-5 font-bold text-xs uppercase tracking-wider

CARDS / CONTAINERS:
bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800
shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden

SEARCH INPUT:
h-14 rounded-2xl pl-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800
shadow-sm text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400
+ Search icon: absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400

FILTER TAB BAR:
Wrapper: bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit
Active tab: bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 text-xs font-bold px-5 py-2
Inactive tab: text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-bold px-5 py-2

TABLE HEADERS:
text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 px-6 py-5

TABLE ROWS:
hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer
Divider: divide-y divide-slate-50 dark:divide-slate-800/50

STATUS BADGES:
px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm
- new:         bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400
- contacted:   bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400
- qualified:   bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400
- unqualified: bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
- converted:   bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400

LOADING SPINNER:
h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent
in: flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950

EMPTY STATE (inside a card):
flex flex-col items-center gap-3 py-20 text-center
Icon: w-10 h-10 text-slate-300
Text: text-slate-500 font-medium

BORDER RADIUS SCALE:
Cards: rounded-[2rem] · Search/Tabs: rounded-2xl · Buttons/Inputs: rounded-xl
Badges/chips: rounded-lg · Avatars: rounded-full

TYPOGRAPHY:
Page title: text-3xl font-bold tracking-tight
Section label: text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400
Body strong: text-sm font-bold text-slate-900 dark:text-white
Body muted: text-sm font-medium text-slate-500 dark:text-slate-400
Small/meta: text-xs font-medium text-slate-500

## END DESIGN SYSTEM ##
