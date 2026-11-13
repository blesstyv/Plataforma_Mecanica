import { FolderTree, Layers, LayoutDashboard, FileStack, LogOut, Menu, X, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Spinner } from '@/components/ui/Feedback'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const items = [
  { to: '/admin', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/admin/asignaturas', label: 'Asignaturas', icon: Layers },
  { to: '/admin/categorias', label: 'Categorías', icon: FolderTree },
  { to: '/admin/materiales', label: 'Materiales', icon: FileStack },
]

export default function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  if (loading) return <Spinner label="Verificando sesión…" />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />

  const link = ({ isActive }: { isActive: boolean }) =>
    cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-primary text-on-primary' : 'text-ink hover:bg-surface-2')
  const nav_ = (
    <nav aria-label="Administración" className="flex flex-col gap-1" onClick={() => setOpen(false)}>
      {items.map(({ to, label, icon: I, end }) => <NavLink key={to} to={to} end={end} className={link}><I className="size-4" aria-hidden />{label}</NavLink>)}
    </nav>
  )
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 border-r border-line bg-surface p-4 transition-transform lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between"><Logo to="/admin" /><button className="lg:hidden" aria-label="Cerrar menú" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
        {nav_}
        <div className="mt-auto space-y-1 border-t border-line pt-4 text-sm">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium hover:bg-surface-2"><ExternalLink className="size-4" aria-hidden />Ver portal público</a>
          <button onClick={async () => { await logout(); nav('/admin/login') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium hover:bg-surface-2"><LogOut className="size-4" aria-hidden />Cerrar sesión</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-8">
          <button className="grid size-9 place-items-center rounded-lg hover:bg-surface-2 lg:hidden" aria-label="Abrir menú" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <p className="hidden text-sm text-muted lg:block">Sesión de <span className="font-medium text-ink">{user.first_name || user.username}</span></p>
          <ThemeToggle />
        </header>
        <main className="px-4 py-8 sm:px-8"><Outlet /></main>
      </div>
    </div>
  )
}
