import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch { /* modo privado */ }
    setDark(next)
  }
  return (
    <button onClick={toggle} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'} className={`grid size-9 place-items-center rounded-lg hover:bg-surface-2 ${className ?? ''}`}>
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
