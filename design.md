## DESIGN SYSTEM — Follow these rules exactly for every new page ##

**STACK:** React + TypeScript + Tailwind CSS + shadcn/ui + lucide-react

---

## 60/30/10 COLOR RULE

This design system follows the 60/30/10 rule for balanced color usage:

### 60% — DOMINANT (Neutrals)
**Purpose:** Backgrounds, large surfaces, base layer

| Token | Value | Usage |
|-------|-------|-------|
| `bg-base` | `bg-slate-50 dark:bg-slate-950` | Page background |
| `bg-surface` | `bg-white dark:bg-slate-900` | Cards, containers |
| `bg-elevated` | `bg-slate-50 dark:bg-slate-900/50` | Headers, raised surfaces |
| `text-primary` | `text-slate-900 dark:text-white` | Primary text |
| `text-secondary` | `text-slate-700 dark:text-slate-300` | Secondary text |
| `text-muted` | `text-slate-500 dark:text-slate-400` | Muted text, icons |
| `border` | `border-slate-200 dark:border-slate-800` | Borders, dividers |

### 30% — SECONDARY (Supporting Color)
**Purpose:** Interactive elements, secondary backgrounds, status indicators

| Token | Value | Usage |
|-------|-------|-------|
| `bg-secondary` | `bg-slate-100 dark:bg-slate-800` | Hover states, chips |
| `bg-secondary-hover` | `bg-slate-200 dark:bg-slate-700` | Active hover |
| `text-link` | `text-slate-700 dark:text-slate-300` | Links, secondary actions |
| **Status backgrounds:** | | |
| Success | `bg-emerald-50 dark:bg-emerald-900/20` | Completed, active |
| Warning | `bg-amber-50 dark:bg-amber-900/20` | Pending, review |
| Info | `bg-blue-50 dark:bg-blue-900/20` | Informational |
| Neutral | `bg-slate-100 dark:bg-slate-800` | Draft, inactive |

### 10% — ACCENT (Teal)
**Purpose:** Primary actions, focus states, highlights, active states

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `text-teal-600 bg-teal-600` | Primary buttons, links |
| `accent-hover` | `text-teal-700 bg-teal-700` | Hover states |
| `accent-dim` | `bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400` | Subtle backgrounds |
| `accent-ring` | `focus:ring-teal-600/20` | Focus rings |
| `accent-border` | `border-teal-600` | Active borders |
| `accent-shadow` | `shadow-teal-200 dark:shadow-none` | Button shadows |

**NEVER use indigo as primary — always use teal**

---

## APPLYING THE 60/30/10 RULE

### Page Layout Example
```tsx
// 60% - Dominant neutrals (page wrapper, cards)
<div className="flex-1 bg-slate-50 dark:bg-slate-950">
  <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
    
    // 30% - Secondary (table headers, hover states)
    <thead className="bg-slate-50 dark:bg-slate-900/50">
      <tr className="hover:bg-slate-100 dark:hover:bg-slate-800">
    
    // 10% - Accent (primary button, active tab, focus)
    <button className="bg-teal-600 hover:bg-teal-700">
    <span className="text-teal-600 bg-teal-50">
```

### Component Breakdown

**Buttons:**
- Primary: `bg-teal-600` (10% accent)
- Secondary: `border-slate-200` (30% secondary)
- Ghost: `text-slate-600` (60% neutral text)

**Tables:**
- Rows: `bg-white` (60% dominant)
- Headers: `bg-slate-50` (30% secondary)
- Active row: `border-teal-600` (10% accent)

**Forms:**
- Inputs: `bg-white border-slate-200` (60% dominant)
- Labels: `text-slate-500` (60% neutral)
- Focus: `ring-teal-600/20` (10% accent)

**Navigation/Tabs:**
- Inactive: `text-slate-500` (60% neutral)
- Hover: `bg-slate-100` (30% secondary)
- Active: `text-teal-600 bg-teal-50` (10% accent)

---

## TYPOGRAPHY

**Font Family:** `DM Sans`, sans-serif
- Apply via: `font-sans` (ensure DM Sans is loaded in index.html)
- Google Fonts: `DM+Sans:wght@400;500;600;700`

**Font Weights:**
- Regular: `font-normal` (400) — Body text (60%)
- Medium: `font-medium` (500) — Secondary text (30%)
- Semibold: `font-semibold` (600) — Subheaders (30%)
- Bold: `font-bold` (700) — Headings, buttons (10%)

---

## PAGE WRAPPER
Every page must start with this structure:

```tsx
<div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
  <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">
    ...
  </div>
</div>
```

---

## HEADER PATTERN
```tsx
<div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
  <div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
      Category/Subtitle
    </p>
    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Page Title</h1>
    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Description here.</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Primary button (10% accent) */}
    <button className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-200 dark:shadow-none">
      Create
    </button>
    {/* Secondary button (30% secondary) */}
    <button className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50">
      Filter
    </button>
  </div>
</div>
```

---

## BUTTONS

**Primary (10% Accent):**
```tsx
<button className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-teal-200 dark:shadow-none">
  Primary Action
</button>
```

**Secondary (30% Secondary):**
```tsx
<button className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
  Secondary
</button>
```

**Ghost (60% Neutral):**
```tsx
<button className="px-5 py-2.5 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
  Ghost
</button>
```

**Destructive (10% Accent - Red):**
```tsx
<button className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors">
  Delete
</button>
```

---

## CARDS / CONTAINERS (60% Dominant)
```tsx
<div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

---

## SEARCH INPUT (60% Dominant + 10% Accent on focus)
```tsx
<div className="relative group/search">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-teal-600 transition-colors" />
  <input
    placeholder="Search..."
    className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 outline-none transition-all duration-300"
  />
</div>
```

---

## TAB NAVIGATION (60% Neutral inactive, 10% Accent active)
```tsx
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
  <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
    {/* Inactive tab (60% neutral) */}
    <button className="pb-4 font-bold text-sm tracking-wide text-slate-500 hover:text-slate-900">
      Tab Label
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
        {count}
      </span>
    </button>
    
    {/* Active tab (10% accent) */}
    <button className="pb-4 font-bold text-sm tracking-wide text-teal-600 relative">
      Active Tab
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400">
        {count}
      </span>
      <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
    </button>
  </div>
</div>
```

---

## TABLE COMPONENT

**Header (30% Secondary):**
```tsx
<thead className="bg-slate-50 dark:bg-slate-900/50">
  <tr>
    <th className="text-[11px] font-bold text-slate-400 uppercase tracking-tight px-6 py-4">
      Column
    </th>
  </tr>
</thead>
```

**Rows (60% Dominant):**
```tsx
<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer border-l-4 border-transparent hover:border-teal-600 hover:shadow-xl hover:shadow-teal-600/5">
    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
      Content
    </td>
  </tr>
</tbody>
```

**Status Badges (30% Secondary):**
```tsx
<span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
  COMPLETED
</span>
```

---

## STATUS BADGES (30% Secondary)

```tsx
// Success/Completed (emerald - secondary palette)
<span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">

// Pending/Warning (amber - secondary palette)
<span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg">

// Active (teal - accent palette - 10%)
<span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-lg">

// Draft/Neutral (slate - secondary palette)
<span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">

// Error/Overdue (red - accent palette)
<span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
```

---

## PRIORITY BADGES (30% Secondary)
```tsx
// High (red dot)
<span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> HIGH
</span>

// Medium (amber dot)
<span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> MEDIUM
</span>

// Low (green dot)
<span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> LOW
</span>
```

---

## LOADING SPINNER (10% Accent)
```tsx
<div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-r-transparent" />
```

---

## EMPTY STATE (60% Neutral)
```tsx
<div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
  No items found.
</div>
```

---

## BULK ACTIONS TOOLBAR (10% Accent background)
```tsx
<div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-md p-4 animate-fade-in">
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-teal-700 dark:text-teal-400">
      {count} item{count !== 1 ? 's' : ''} selected
    </span>
    <div className="flex items-center gap-2">
      <button className="h-8 text-xs border border-slate-200">Complete</button>
      <button className="h-8 text-xs bg-red-600 text-white">Delete</button>
    </div>
  </div>
</div>
```

---

## BORDER RADIUS SCALE

| Element | Radius | Usage |
|---------|--------|-------|
| Cards | `rounded-md` | 60% surfaces |
| Search/Tabs | `rounded-md` | 30% interactive |
| Buttons/Inputs | `rounded-xl` | 10% accent actions |
| Badges/Chips | `rounded-lg` | 30% status |
| Avatars | `rounded-full` | 60% media |
| Checkboxes | `rounded-sm` | 30% forms |

---

## TYPOGRAPHY SCALE

| Element | Classes | Color % |
|---------|---------|---------|
| Page title | `text-3xl font-bold tracking-tight` | 60% (slate-900) |
| Category label | `text-[10px] font-black uppercase tracking-[0.2em]` | 60% (slate-500) |
| Section label | `text-xs font-bold uppercase tracking-widest` | 60% (slate-400) |
| Table header | `text-[11px] font-bold uppercase tracking-tight` | 60% (slate-400) |
| H1 | `text-3xl font-bold` | 60% (slate-900) |
| H2 | `text-2xl font-bold` | 60% (slate-900) |
| H3 | `text-xl font-bold` | 60% (slate-900) |
| H4 | `text-lg font-bold` | 60% (slate-900) |
| Body Large | `text-lg` | 60% (slate-700) |
| Body Default | `text-base` | 60% (slate-700) |
| Body Small | `text-sm` | 60% (slate-600) |
| Caption/Meta | `text-xs` | 60% (slate-500) |
| Badge text | `text-[10px] font-black uppercase tracking-widest` | 30% (status colors) |
| Button text | `text-xs font-bold uppercase tracking-wider` | 10% (white on teal) |

---

## ICON SIZES

| Context | Size | Color % |
|---------|------|---------|
| Search icon | `h-4 w-4` | 60% (slate-400) |
| Filter icon | `w-4 h-4` | 60% (slate-400) |
| Action icon | `w-3.5 h-3.5` | 60% (slate-400) |
| Status dot | `w-1.5 h-1.5` | 30% (status color) |
| Avatar | `w-6 h-6` | 60% (neutral) |
| Focus icon | `h-4 w-4` | 10% (teal-600) |

---

## UTILITY CLASSES

- **Animation:** `animate-fade-in`, `animate-in slide-in-from-top-2`
- **Hover effects:** `transition-all`, `transition-colors`, `group-hover:`
- **Focus states:** `focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600`
- **Scrollbar:** `scrollbar-none` (hide scrollbar)

---

## POPOVER / DROPDOWN (60% Dominant surface)
```tsx
<div className="relative group">
  <button className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50">
    Menu <ChevronDown className="w-3.5 h-3.5 ml-1" />
  </button>
  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 min-w-[140px] hidden group-hover:block">
    <button className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 first:rounded-t-md last:rounded-b-md text-slate-700 dark:text-slate-300">
      Option
    </button>
  </div>
</div>
```

---

## FORM INPUTS (60% Dominant + 10% Accent on focus)
```tsx
<label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
  Input Label
</label>
<input
  type="text"
  placeholder="Enter text..."
  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
/>
```

**Input specs:**
- Height: `h-12` or `py-3`
- Padding: `px-4`
- Radius: `rounded-xl`
- Focus ring: `focus:ring-4 focus:ring-teal-600/20` (10% accent)
- Border: `border-slate-200 dark:border-slate-800` (60% neutral)

---

## COLOR DISTRIBUTION CHECKLIST

Before finalizing any page, verify:

- [ ] **60% Dominant:** Page uses slate-50/900/950 for backgrounds, slate-900/700/600/500 for text
- [ ] **30% Secondary:** Hover states use slate-100/800, status badges use emerald/amber/blue
- [ ] **10% Accent:** Primary buttons, active states, focus rings use teal-600
- [ ] **No indigo:** Replace any indigo references with teal
- [ ] **Font:** DM Sans applied via `font-sans`

---

## END DESIGN SYSTEM ##
