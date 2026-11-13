import { useQuery } from '@tanstack/react-query'
import { Download, Lock, Presentation } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { FileIcon } from '@/components/FileIcon'
import { Button } from '@/components/ui/Button'
import { Badge, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Breadcrumbs } from '@/components/ui/Nav'
import { ApiError, fileUrl } from '@/lib/api'
import { errorMessage, fileLabel, formatBytes, formatDate } from '@/lib/utils'
import { publicService } from '@/services'
import type { Material } from '@/types/api'
import NotFound from './NotFound'

export function Viewer({ m, admin = false }: { m: Material; admin?: boolean }) {
  const isImage = ['jpg', 'jpeg', 'png'].includes(m.file_type)
  if (isImage) return <img src={fileUrl(m.id, { admin })} alt={m.title} className="mx-auto max-h-[75vh] rounded-[4px] border border-line bg-surface object-contain" />
  if (m.file_type === 'pdf' || m.has_preview) {
    const src = m.file_type === 'pdf' ? fileUrl(m.id, { admin }) : fileUrl(m.id, { preview: true, admin })
    return <iframe title={`Visor: ${m.title}`} src={src} className="h-[75vh] w-full rounded-[4px] border border-line bg-surface" />
  }
  return (
    <div className="grid place-items-center rounded-[4px] border border-dashed border-line bg-surface px-6 py-16 text-center">
      <Presentation className="mb-3 size-10 text-muted" aria-hidden />
      <p className="font-medium">Este formato no se puede visualizar en el navegador.</p>
      <p className="mt-1 max-w-md text-sm text-muted">{m.allow_download ? 'Descárgalo para abrirlo en tu equipo.' : 'El profesor no ha habilitado la descarga ni una vista previa de este documento.'}</p>
    </div>
  )
}

export default function MaterialDetail() {
  const { id = '' } = useParams()
  const q = useQuery({ queryKey: ['material', id], queryFn: () => publicService.material(id), retry: false })
  if (q.error instanceof ApiError && q.error.status === 404) return <NotFound message="Este material no existe o ya no está disponible." />
  if (q.isLoading) return <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-[60vh]" /></div>
  if (q.isError) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /></div>
  const m = q.data!
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Asignaturas', to: '/asignaturas' }, { label: m.subject_name, to: `/asignaturas/${m.subject_slug}` }, { label: m.category_name }, { label: m.title }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <div className="flex items-start gap-4">
            <FileIcon type={m.file_type} className="size-14" />
            <div><h1 className="text-2xl font-medium sm:text-3xl">{m.title}</h1>
              <p className="mt-1 text-muted"><Link className="hover:underline" to={`/asignaturas/${m.subject_slug}`}>{m.subject_name}</Link> · {m.category_name}</p></div>
          </div>
          <Viewer m={m} />
        </div>
        <aside className="h-fit space-y-5 rounded-[4px] border border-line bg-surface p-5 shadow-card">
          {m.allow_download ? (
            <a href={fileUrl(m.id, { download: true })} download><Button className="w-full"><Download className="size-4" aria-hidden /> Descargar {fileLabel(m.file_type)}</Button></a>
          ) : (
            <p className="flex items-center gap-2 rounded-[4px] bg-surface-2 px-3 py-2.5 text-sm text-muted"><Lock className="size-4" aria-hidden /> Descarga no habilitada</p>
          )}
          {m.description && <div><h2 className="mb-1 text-sm font-semibold">Descripción</h2><p className="whitespace-pre-line text-sm text-muted">{m.description}</p></div>}
          <dl className="space-y-2 text-sm">
            {[['Formato', <Badge key="f" tone="accent">{fileLabel(m.file_type)}</Badge>], ['Tamaño', formatBytes(m.file_size)], ['Publicado', formatDate(m.created_at)], ['Archivo', <span key="n" className="break-all">{m.original_filename}</span>]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
          <Link to={`/asignaturas/${m.subject_slug}`} className="block text-sm font-medium text-electric hover:underline">← Volver a {m.subject_name}</Link>
        </aside>
      </div>
    </div>
  )
}
