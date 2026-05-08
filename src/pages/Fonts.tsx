import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function Fonts() {
  const [selectedFont, setSelectedFont] = useState('DM Sans')

  const fontOptions = [
    {
      name: 'Inter',
      family: "'Inter', sans-serif",
      description: 'Clean, modern, highly readable. Default for most web apps.',
      tags: ['Modern', 'Neutral', 'Safe']
    },
    {
      name: 'Plus Jakarta Sans',
      family: "'Plus Jakarta Sans', sans-serif",
      description: 'Geometric, friendly, great for UI. Used by many SaaS products.',
      tags: ['Geometric', 'Friendly', 'SaaS']
    },
    {
      name: 'Poppins',
      family: "'Poppins', sans-serif",
      description: 'Geometric, clean circles. Modern and professional.',
      tags: ['Geometric', 'Clean', 'Popular']
    },
    {
      name: 'DM Sans',
      family: "'DM Sans', sans-serif",
      description: 'Low contrast, friendly. Great for long reading sessions.',
      tags: ['Friendly', 'Readable', 'Modern']
    },
    {
      name: 'Work Sans',
      family: "'Work Sans', sans-serif",
      description: 'Optimized for screen. Professional yet approachable.',
      tags: ['Professional', 'Screen-optimized', 'Versatile']
    },
    {
      name: 'Nunito',
      family: "'Nunito', sans-serif",
      description: 'Rounded terminals. Friendly and warm.',
      tags: ['Rounded', 'Friendly', 'Warm']
    },
    {
      name: 'Outfit',
      family: "'Outfit', sans-serif",
      description: 'Contemporary, geometric. Clean and modern.',
      tags: ['Geometric', 'Contemporary', 'Clean']
    },
    {
      name: 'Lexend',
      family: "'Lexend', sans-serif",
      description: 'Designed to reduce visual stress. Highly readable.',
      tags: ['Readable', 'Accessible', 'Clean']
    },
  ]

  // Apply the selected font globally when it changes
  useEffect(() => {
    const font = fontOptions.find(f => f.name === selectedFont)
    if (font) {
      // Create or update a global style element
      let styleEl = document.getElementById('global-font-style') as HTMLStyleElement
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = 'global-font-style'
        document.head.appendChild(styleEl)
      }

      // Apply font to all elements with high specificity
      styleEl.textContent = `
        *, *::before, *::after, html, body, #root, .font-sans {
          font-family: ${font.family} !important;
        }
      `

      // Store in localStorage for persistence
      localStorage.setItem('selectedFont', selectedFont)
    }
  }, [selectedFont])

  // Load saved font preference on mount
  useEffect(() => {
    const savedFont = localStorage.getItem('selectedFont')
    if (savedFont && fontOptions.some(f => f.name === savedFont)) {
      setSelectedFont(savedFont)
    }
  }, [])

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mx-auto p-4 md:p-8 max-w-[1400px] animate-fade-in space-y-8">

        {/* Header */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
            Typography
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Font Combinations</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Preview different Google Fonts for your CRM interface.
          </p>
        </div>

        {/* Font Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fontOptions.map((font) => (
            <button
              key={font.name}
              onClick={() => setSelectedFont(font.name)}
              className={cn(
                "p-4 rounded-md border-2 text-left transition-all",
                selectedFont === font.name
                  ? "border-accent bg-accent-dim"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
              style={{ fontFamily: font.family }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  selectedFont === font.name ? "bg-accent" : "bg-slate-300 dark:bg-slate-600"
                )} />
                <span className="font-bold text-slate-900 dark:text-white">{font.name}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                {font.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {font.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Live Preview Card */}
        <div
          className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-8 shadow-sm"
          style={{ fontFamily: fontOptions.find(f => f.name === selectedFont)?.family }}
        >
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Live Preview — {selectedFont}</h3>

          <div className="space-y-6">
            {/* Header Example */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                Work Management
              </p>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Dashboard</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                Welcome back! Here's what's happening with your projects today.
              </p>
            </div>

            {/* Typography Scale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Headings</p>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Heading 1</h1>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Heading 2</h2>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Heading 3</h3>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Heading 4</h4>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Body Text</p>
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">Large body text for important content.</p>
                <p className="text-base text-slate-700 dark:text-slate-300 mb-2">Regular body text for standard content. The quick brown fox jumps over the lazy dog.</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Small text for secondary information and captions.</p>
              </div>
            </div>

            {/* UI Components */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">UI Components</p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button className="px-5 py-2.5 bg-accent hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-accent/20 dark:shadow-none">
                  Primary Button
                </button>
                <button className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Secondary
                </button>
                <button className="px-5 py-2.5 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Ghost
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Active
                </span>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Completed
                </span>
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Pending
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Draft
                </span>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Input Field
                  </label>
                  <input
                    type="text"
                    placeholder="Enter text..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Dropdown
                  </label>
                  <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all">
                    <option>Select an option</option>
                    <option>Option One</option>
                    <option>Option Two</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-accent uppercase tracking-widest mb-4">Table</p>
              <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Task</th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Status</th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Priority</th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">Review Q2 Reports</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          Done
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Low
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">Mar 25</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">Client Meeting</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> High
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">Mar 30</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-accent-dim border border-accent/20 rounded-md p-6">
          <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-3">Recommendation</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            <strong className="font-bold">Plus Jakarta Sans</strong> is recommended for CRM applications because:
          </p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">✓</span>
              <span>Excellent readability at all sizes, crucial for data-heavy interfaces</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">✓</span>
              <span>Modern, professional appearance that builds trust</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">✓</span>
              <span>Great character distinction (0 vs O, 1 vs l vs I)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">✓</span>
              <span>Free, open-source, and widely supported via Google Fonts</span>
            </li>
          </ul>
        </div>

        {/* Reset Font Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              setSelectedFont('DM Sans')
              localStorage.removeItem('selectedFont')
            }}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Reset to DM Sans (Default)
          </button>
        </div>

      </div>
    </div>
  )
}
