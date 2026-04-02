import { useEffect } from "react"

const FONT_OPTIONS = [
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Poppins', family: "'Poppins', sans-serif" },
  { name: 'DM Sans', family: "'DM Sans', sans-serif" },
  { name: 'Work Sans', family: "'Work Sans', sans-serif" },
  { name: 'Nunito', family: "'Nunito', sans-serif" },
  { name: 'Outfit', family: "'Outfit', sans-serif" },
  { name: 'Lexend', family: "'Lexend', sans-serif" },
]

export function FontProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load saved font preference on mount
    const savedFont = localStorage.getItem('selectedFont')
    if (savedFont) {
      const font = FONT_OPTIONS.find(f => f.name === savedFont)
      if (font) {
        applyFont(font.family)
      }
    }
  }, [])

  return <>{children}</>
}

function applyFont(fontFamily: string) {
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
      font-family: ${fontFamily} !important;
    }
  `
}
