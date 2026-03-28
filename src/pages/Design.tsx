import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  PlusCircle,
  Check,
  Trash2,
  LayoutGrid,
  LayoutList
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Design() {
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming'>('all')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(['1', '2']))

  const colorOptions = [
    { name: 'Teal', value: 'teal', class: 'text-teal-600 bg-teal-600 border-teal-600 ring-teal-600', bgDim: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' },
    { name: 'Indigo', value: 'indigo', class: 'text-indigo-600 bg-indigo-600 border-indigo-600 ring-indigo-600', bgDim: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' },
    { name: 'Blue', value: 'blue', class: 'text-blue-600 bg-blue-600 border-blue-600 ring-blue-600', bgDim: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
    { name: 'Emerald', value: 'emerald', class: 'text-emerald-600 bg-emerald-600 border-emerald-600 ring-emerald-600', bgDim: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
    { name: 'Violet', value: 'violet', class: 'text-violet-600 bg-violet-600 border-violet-600 ring-violet-600', bgDim: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' },
    { name: 'Rose', value: 'rose', class: 'text-rose-600 bg-rose-600 border-rose-600 ring-rose-600', bgDim: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400' },
    { name: 'Amber', value: 'amber', class: 'text-amber-600 bg-amber-600 border-amber-600 ring-amber-600', bgDim: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
    { name: 'Cyan', value: 'cyan', class: 'text-cyan-600 bg-cyan-600 border-cyan-600 ring-cyan-600', bgDim: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400' },
    { name: 'Fuchsia', value: 'fuchsia', class: 'text-fuchsia-600 bg-fuchsia-600 border-fuchsia-600 ring-fuchsia-600', bgDim: 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400' },
    { name: 'Orange', value: 'orange', class: 'text-orange-600 bg-orange-600 border-orange-600 ring-orange-600', bgDim: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' },
    { name: 'Sky', value: 'sky', class: 'text-sky-600 bg-sky-600 border-sky-600 ring-sky-600', bgDim: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400' },
    { name: 'Purple', value: 'purple', class: 'text-purple-600 bg-purple-600 border-purple-600 ring-purple-600', bgDim: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' },
  ]

  const [selectedColor, setSelectedColor] = useState('teal')
  const selectedOption = colorOptions.find(c => c.value === selectedColor) || colorOptions[0]
  const colorClass = selectedOption.class
  const bgDimClass = selectedOption.bgDim

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1400px] animate-fade-in space-y-8">

        {/* Color Picker */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">CRM Accent Color Preview</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Select a color to preview how it looks across CRM components
          </p>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={cn(
                  "px-4 py-3 rounded-md border-2 text-sm font-semibold transition-all",
                  selectedColor === color.value
                    ? `${color.class} border-current bg-opacity-10`
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                )}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header Example */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Header Pattern</h3>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
              Work Management
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Manage, prioritize and track your team's workload.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md p-1">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" className="border-slate-200 dark:border-slate-800">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button className={`${colorClass} text-white`}>
              <PlusCircle className="w-4 h-4" /> Create Task
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Example */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Tab Navigation</h3>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            {(['all', 'today', 'upcoming'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 font-bold text-sm tracking-wide transition-colors relative flex items-center gap-2 shrink-0",
                  activeTab === tab ? colorClass : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  activeTab === tab ? bgDimClass : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  {tab === 'all' ? '24' : tab === 'today' ? '8' : '12'}
                </span>
                {activeTab === tab && (
                  <div className={`absolute bottom-[-1px] left-0 right-0 h-0.5 ${colorClass.replace('text-', 'bg-')} rounded-t-full`} />
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 w-full lg:max-w-xl pb-4 lg:pb-3">
            <div className="relative group/search">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:${colorClass.split(' ')[0]} transition-colors`} />
              <input
                placeholder="Search tasks..."
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-semibold focus:ring-4 focus:border-current placeholder:text-slate-400 outline-none transition-all duration-300"
                style={{ '--tw-ring-color': `var(--${selectedColor}-600)`, borderColor: `var(--${selectedColor}-600)` } as React.CSSProperties}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons Example */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button className={`${colorClass} text-white shadow-lg`}>
            Primary Button
          </Button>
          <Button variant="outline" className="border-slate-200 dark:border-slate-800">
            Outline
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>

      {/* Status Badges Example */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Status Badges</h3>
        <div className="flex flex-wrap gap-3">
          <span className={cn("inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm", bgDimClass)}>
            {selectedColor.toUpperCase()}
          </span>
          <span className="inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            PENDING
          </span>
          <span className="inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
            COMPLETED
          </span>
          <span className="inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            DRAFT
          </span>
        </div>
      </div>

      {/* Table Row Example */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest p-4 border-b border-slate-200 dark:border-slate-800">
          Table Row Example
        </h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {/* Header */}
          <div className="grid grid-cols-[50px_1fr_120px_140px_100px] items-center gap-4 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Select</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Item</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Status</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Priority</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Actions</div>
          </div>

          {/* Row 1 - Selected */}
          <div className={cn(
            "grid grid-cols-[50px_1fr_120px_140px_100px] items-center gap-4 px-4 py-3 transition-all cursor-pointer border-l-4 border-transparent hover:border-current hover:shadow-xl hover:shadow-current/5",
            selectedItems.has('1') ? bgDimClass.replace('text-', 'bg-').replace('700', '50').replace('400', '10') : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
          )}>
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  const next = new Set(selectedItems)
                  next.has('1') ? next.delete('1') : next.add('1')
                  setSelectedItems(next)
                }}
                className={cn(
                  "w-5 h-5 rounded-sm flex items-center justify-center transition-all shadow-sm border",
                  selectedItems.has('1')
                    ? `${colorClass} border-current text-white opacity-100`
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-current opacity-0 group-hover:opacity-100"
                )}
              >
                {selectedItems.has('1') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </div>
            <div className="text-[13px] font-bold text-slate-900 dark:text-white">Task Item 1</div>
            <div>
              <span className={cn("inline-flex px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest", bgDimClass)}>
                ACTIVE
              </span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest bg-slate-100 dark:bg-slate-800 text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> HIGH
              </span>
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Row 2 - Selected */}
          <div className={cn(
            "grid grid-cols-[50px_1fr_120px_140px_100px] items-center gap-4 px-4 py-3 transition-all cursor-pointer border-l-4 border-transparent hover:border-current hover:shadow-xl hover:shadow-current/5 group",
            selectedItems.has('2') ? bgDimClass.replace('text-', 'bg-').replace('700', '50').replace('400', '10') : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
          )}>
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  const next = new Set(selectedItems)
                  next.has('2') ? next.delete('2') : next.add('2')
                  setSelectedItems(next)
                }}
                className={cn(
                  "w-5 h-5 rounded-sm flex items-center justify-center transition-all shadow-sm border",
                  selectedItems.has('2')
                    ? `${colorClass} border-current text-white opacity-100`
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-current opacity-0 group-hover:opacity-100"
                )}
              >
                {selectedItems.has('2') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </div>
            <div className="text-[13px] font-bold text-slate-900 dark:text-white">Task Item 2</div>
            <div>
              <span className="inline-flex px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                PENDING
              </span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest bg-slate-100 dark:bg-slate-800 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> MEDIUM
              </span>
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Row 3 - Not Selected */}
          <div className={cn(
            "grid grid-cols-[50px_1fr_120px_140px_100px] items-center gap-4 px-4 py-3 transition-all cursor-pointer border-l-4 border-transparent hover:border-current hover:shadow-xl hover:shadow-current/5 group",
            "hover:bg-slate-50 dark:hover:bg-slate-800/30"
          )}>
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  const next = new Set(selectedItems)
                  next.has('3') ? next.delete('3') : next.add('3')
                  setSelectedItems(next)
                }}
                className={cn(
                  "w-5 h-5 rounded-sm flex items-center justify-center transition-all shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-current opacity-0 group-hover:opacity-100"
                )}
              >
                <Check className={cn("w-3.5 h-3.5 stroke-[3]", selectedItems.has('3') ? `${colorClass} text-white` : "text-transparent")} />
              </button>
            </div>
            <div className="text-[13px] font-bold text-slate-900 dark:text-white">Task Item 3</div>
            <div>
              <span className="inline-flex px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                COMPLETED
              </span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest bg-slate-100 dark:bg-slate-800 text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> LOW
              </span>
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && (
        <div className={cn("border rounded-md p-4 animate-fade-in", bgDimClass.replace('text-', 'border-').replace('700', '300').replace('400', '200').replace('bg-', 'bg-').replace('/20', '/30'))}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn("text-sm font-bold", colorClass.split(' ')[0])}>
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-xs">Clear selection</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Check className="w-3.5 h-3.5 mr-1.5" /> Complete
              </Button>
              <Button variant="destructive" size="sm" className="h-8 text-xs">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-6 text-center">
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          <strong className="text-slate-900 dark:text-white">Recommendation:</strong> Teal provides a fresh, modern look for CRM systems.
          It conveys growth, balance, and professionalism while standing out from typical blue business software.
        </p>
      </div>

    </div>
  )
}
