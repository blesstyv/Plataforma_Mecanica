import { useQuery } from '@tanstack/react-query'
import { FileStack, FilePlus2, FolderTree, Layers, Eye, FilePen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/admin'
import { FileIcon } from '@/components/FileIcon'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { errorMessage, formatDate } from '@/lib/utils'
import { adminService } from '@/services'

export default function Dashboard() {
  const q = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminService.dashboard })
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
  const d = q.data
  const stats = [
    ['Asignaturas', d?.subjects, Layers], ['Categorías', d?.categories, FolderTree], ['Materiales', d?.materials, FileStack],
    ['Publicados', d?.published, Eye], ['Borradores', d?.drafts, FilePen],
  ] as const
  return (
    <>
      <PageHeader title="Panel" description="Resumen del contenido que administras." action={<Link to="/admin/materiales?nuevo=1"><Button><FilePlus2 className="size-4" aria-hidden />Subir material</Button></Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(([label, val, Icon]) => (
          <div key={label} className="rounded-[4px] border border-line bg-surface p-4 shadow-card">
            <Icon className="size-5 text-accent" aria-hidden />
            {q.isLoading ? <Skeleton className="mt-3 h-8 w-12" /> : <p className="mt-3 font-medium text-3xl font-medium" data-testid={`stat-${label}`}>{val}</p>}
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section aria-labelledby="recent"><h2 id="recent" className="mb-3 text-lg font-semibold">Últimos materiales</h2>
          {q.isLoading ? <Skeleton className="h-40" /> : d!.recent_materials.length === 0 ? (
            <EmptyState title="Aún no has subido materiales" action={<Link to="/admin/materiales?nuevo=1"><Button>Subir el primero</Button></Link>}>Crea una asignatura y una categoría, y luego sube tu primer documento.</EmptyState>
          ) : (
            <ul className="divide-y divide-line rounded-[4px] border border-line bg-surface shadow-card">
              {d!.recent_materials.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-4"><FileIcon type={m.file_type} />
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{m.title}</p><p className="truncate text-sm text-muted">{m.subject_name} · {m.category_name} · {formatDate(m.created_at)}</p></div>
                  <Badge tone={m.status === 'published' ? 'success' : 'warn'}>{m.status === 'published' ? 'Publicado' : 'Borrador'}</Badge></li>
              ))}
            </ul>)}
        </section>
        <section aria-labelledby="quick"><h2 id="quick" className="mb-3 text-lg font-semibold">Accesos rápidos</h2>
          <div className="flex flex-col gap-2">
            {[['/admin/asignaturas', 'Gestionar asignaturas'], ['/admin/categorias', 'Gestionar categorías'], ['/admin/materiales', 'Gestionar materiales']].map(([to, l]) => (
              <Link key={to} to={to} className="rounded-[4px] border border-line bg-surface px-4 py-3 text-sm font-medium shadow-card hover:border-electric/50">{l}</Link>))}
          </div>
        </section>
      </div>
    </>
  )
}
