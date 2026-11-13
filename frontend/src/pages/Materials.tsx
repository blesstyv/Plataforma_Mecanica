import { useQuery } from '@tanstack/react-query'
import { FileSearch, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MaterialCard } from '@/components/MaterialCard'
import { Select } from '@/components/ui/Field'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Breadcrumbs, Pagination } from '@/components/ui/Nav'
import { Button } from '@/components/ui/Button'
import { useDebounce } from '@/hooks/useDebounce'
import { errorMessage } from '@/lib/utils'
import { publicService } from '@/services'

const PAGE_SIZE = 10
const TYPES = [['pdf', 'PDF'], ['pptx', 'PowerPoint'], ['docx', 'Word'], ['jpg', 'Imagen JPG'], ['png', 'Imagen PNG']]
const ORDER = [['-created_at', 'Más recientes'], ['created_at', 'Más antiguos'], ['title', 'Título A-Z'], ['-title', 'Título Z-A']]

export default function Materials() {
  const [sp, setSp] = useSearchParams()
  const get = (k: string) => sp.get(k) ?? ''
  const [term, setTerm] = useState(get('search'))
  const debounced = useDebounce(term)
  const page = Number(get('page') || 1)

  const set = (k: string, v: string, resetPage = true) => {
    const n = new URLSearchParams(sp)
    v ? n.set(k, v) : n.delete(k)
    if (resetPage) n.delete('page')
    setSp(n, { replace: true })
  }
  useEffect(() => {
    if (debounced !== get('search')) set('search', debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const subjects = useQuery({ queryKey: ['subjects'], queryFn: () => publicService.subjects() })
  const params = { search: get('search'), subject: get('subject'), category: get('category'), file_type: get('file_type'), ordering: get('ordering') || '-created_at', page, page_size: PAGE_SIZE }
  const q = useQuery({ queryKey: ['materials', params], queryFn: () => publicService.materials(params), placeholderData: (p) => p })
  const hasFilters = !!(get('search') || get('subject') || get('category') || get('file_type'))

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Biblioteca' }]} />
      <h1 className="text-3xl font-medium">Biblioteca de materiales</h1>
      <p className="mb-6 mt-2 text-muted">Busca entre todos los documentos publicados.</p>

      <div role="search" className="mb-6 grid gap-3 rounded-[4px] border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="q" className="sr-only">Buscar</label>
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted" aria-hidden />
          <input id="q" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar por título o descripción" className="h-10 w-full rounded-[4px] border border-line bg-surface pl-9 pr-3 text-sm focus:border-electric" />
        </div>
        <div><label htmlFor="f-subject" className="sr-only">Asignatura</label>
          <Select id="f-subject" value={get('subject')} onChange={(e) => { const n = new URLSearchParams(sp); e.target.value ? n.set('subject', e.target.value) : n.delete('subject'); n.delete('category'); n.delete('page'); setSp(n, { replace: true }) }}>
            <option value="">Todas las asignaturas</option>
            {subjects.data?.results.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
          </Select></div>
        <div><label htmlFor="f-type" className="sr-only">Formato</label>
          <Select id="f-type" value={get('file_type')} onChange={(e) => set('file_type', e.target.value)}>
            <option value="">Todos los formatos</option>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select></div>
        <div><label htmlFor="f-order" className="sr-only">Ordenar</label>
          <Select id="f-order" value={get('ordering') || '-created_at'} onChange={(e) => set('ordering', e.target.value)}>
            {ORDER.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select></div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-muted" aria-live="polite">
        <span>{q.data ? `${q.data.count} ${q.data.count === 1 ? 'resultado' : 'resultados'}` : ' '}</span>
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setTerm(''); setSp({}, { replace: true }) }}><X className="size-4" /> Limpiar filtros</Button>}
      </div>

      {q.isLoading ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.results.length === 0 ? (
        <EmptyState icon={FileSearch} title={hasFilters ? 'No encontramos materiales con esos filtros' : 'Todavía no hay materiales publicados'}>
          {hasFilters ? 'Prueba con otras palabras o quita algún filtro.' : 'Cuando el profesor publique documentos aparecerán aquí.'}
        </EmptyState>
      ) : (
        <>
          <div className="space-y-4">{q.data!.results.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
          <Pagination page={page} count={q.data!.count} pageSize={PAGE_SIZE} onChange={(p) => { set('page', String(p), false); window.scrollTo({ top: 0 }) }} />
        </>
      )}
    </div>
  )
}
