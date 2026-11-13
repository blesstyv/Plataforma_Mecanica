import { Download, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatBytes, formatDate, fileLabel } from '@/lib/utils'
import type { Material } from '@/types/api'
import { FileIcon } from './FileIcon'
import { Badge } from './ui/Feedback'

export function MaterialCard({ m }: { m: Material }) {
  return (
    <Link
      to={`/materiales/${m.id}`}
      className="group flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card transition hover:border-electric/50 hover:shadow-lg"
    >
      <FileIcon type={m.file_type} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold group-hover:text-electric">{m.title}</h3>
        <p className="mt-0.5 truncate text-sm text-muted">{m.subject_name} · {m.category_name}</p>
        {m.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{m.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge tone="accent">{fileLabel(m.file_type)}</Badge>
          <span>{formatBytes(m.file_size)}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(m.created_at)}</span>
          <span className="ml-auto flex items-center gap-2">
            {m.viewable && <Eye className="size-3.5" aria-label="Se puede visualizar" />}
            {m.allow_download && <Download className="size-3.5" aria-label="Descarga permitida" />}
          </span>
        </div>
      </div>
    </Link>
  )
}
