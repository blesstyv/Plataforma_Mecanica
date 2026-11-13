import { useQuery } from '@tanstack/react-query'
import { FolderOpen } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { MaterialCard } from '@/components/MaterialCard'
import { subjectIcon } from '@/components/SubjectCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Breadcrumbs } from '@/components/ui/Nav'
import { ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/utils'
import { publicService } from '@/services'
import NotFound from './NotFound'

export default function SubjectDetail() {
  const { slug = '' } = useParams()
  const subject = useQuery({ queryKey: ['subject', slug], queryFn: () => publicService.subject(slug), retry: false })
  const materials = useQuery({ queryKey: ['materials', 'subject', slug], queryFn: () => publicService.materials({ subject: slug, page_size: 100, ordering: 'title' }), enabled: subject.isSuccess })

  if (subject.error instanceof ApiError && subject.error.status === 404) return <NotFound />
  if (subject.isLoading) return <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
  if (subject.isError) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message={errorMessage(subject.error)} onRetry={() => subject.refetch()} /></div>
  const s = subject.data!
  const Icon = subjectIcon(s.name)
  const byCat = (id: number) => materials.data?.results.filter((m) => m.category === id) ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Asignaturas', to: '/asignaturas' }, { label: s.name }]} />
      <header className="mb-10 flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white sm:flex-row sm:items-center sm:p-8">
        {s.image_url ? <img src={s.image_url} alt="" className="size-20 rounded-xl object-cover" /> : <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-white/10"><Icon className="size-10 text-cyan-300" strokeWidth={1.5} aria-hidden /></div>}
        <div>
          <h1 className="text-3xl font-bold">{s.name}</h1>
          <p className="mt-2 max-w-2xl text-blue-100">{s.description}</p>
          <p className="mt-3 text-sm text-cyan-200">{s.category_count} unidades · {s.material_count} materiales</p>
        </div>
      </header>

      {s.categories.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Esta asignatura aún no tiene unidades">El profesor publicará el contenido próximamente.</EmptyState>
      ) : (
        <div className="space-y-10">
          {s.categories.map((c, i) => (
            <section key={c.id} aria-labelledby={`cat-${c.id}`}>
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-display text-sm font-bold text-accent">{String(i + 1).padStart(2, '0')}</span>
                <h2 id={`cat-${c.id}`} className="text-xl font-semibold">{c.name}</h2>
                <Link to={`/materiales?subject=${s.slug}&category=${c.slug}`} className="ml-auto text-sm font-medium text-electric hover:underline">Ver en biblioteca</Link>
              </div>
              {c.description && <p className="mb-4 text-sm text-muted">{c.description}</p>}
              {materials.isLoading ? <Skeleton className="h-24" /> : byCat(c.id).length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-4 py-6 text-sm text-muted">Aún no hay materiales publicados en esta unidad.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">{byCat(c.id).map((m) => <MaterialCard key={m.id} m={m} />)}</div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
