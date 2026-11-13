import { useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { SubjectCard } from '@/components/SubjectCard'
import { Breadcrumbs } from '@/components/ui/Nav'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { errorMessage } from '@/lib/utils'
import { publicService } from '@/services'

export default function Subjects() {
  const q = useQuery({ queryKey: ['subjects'], queryFn: () => publicService.subjects() })
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Asignaturas' }]} />
      <h1 className="text-3xl font-medium">Asignaturas</h1>
      <p className="mb-8 mt-2 text-muted">Todas las áreas de Mecánica Industrial disponibles para estudiar.</p>
      {q.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-52" />)}</div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data!.results.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aún no hay asignaturas publicadas">El profesor está preparando el contenido.</EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{q.data!.results.map((s) => <SubjectCard key={s.id} subject={s} />)}</div>
      )}
    </div>
  )
}
