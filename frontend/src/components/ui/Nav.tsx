import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from './Button'

export interface Crumb { label: string; to?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
            {c.to ? <Link to={c.to} className="rounded hover:text-ink hover:underline">{c.label}</Link> : <span aria-current="page" className="font-medium text-ink">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Pagination({ page, count, pageSize, onChange }: { page: number; count: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (pages <= 1) return null
  return (
    <nav aria-label="Paginación" className="mt-8 flex items-center justify-center gap-3">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="size-4" aria-hidden /> Anterior
      </Button>
      <span className="text-sm text-muted" aria-live="polite">Página {page} de {pages}</span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  )
}
