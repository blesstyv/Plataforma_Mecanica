import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

const links = [
  { to: '/asignaturas', label: 'Asignaturas' },
  { to: '/materiales', label: 'Biblioteca' },
]

export default function PublicLayout() {
  const [open, setOpen] = useState(false)
  const cls = ({ isActive }: { isActive: boolean }) =>
    cn('rounded-[4px] px-3 py-2 text-sm font-medium transition-colors', isActive ? 'text-ink' : 'text-muted hover:text-ink')
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-[4px] focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {links.map((l) => <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>)}
            
            <Link to="/admin" className="ml-1 rounded-full border border-line px-4 py-1.5 text-sm font-medium hover:bg-surface-2">Profesor</Link>
          </nav>
          <div className="flex items-center gap-1 md:hidden">
            
            <button aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-9 place-items-center rounded-[4px] hover:bg-surface-2">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav aria-label="Móvil" className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
            {links.map((l) => <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>)}
            <Link to="/admin" className="rounded-[4px] px-3 py-2 text-sm font-medium hover:bg-surface-2">Acceso profesor</Link>
          </nav>
        )}
      </header>
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p>Material de estudio de Mecánica Industrial · Acceso libre para estudiantes.</p>
          <p>© {new Date().getFullYear()} MecaniLab</p>
        </div>
      </footer>
    </div>
  )
}
