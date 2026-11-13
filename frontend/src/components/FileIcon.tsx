import { FileImage, FileText, Presentation, FileType2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAP: Record<string, { icon: LucideIcon; cls: string }> = {
  pdf: { icon: FileText, cls: 'bg-danger-soft text-danger' },
  pptx: { icon: Presentation, cls: 'bg-warn-soft text-warn' },
  docx: { icon: FileType2, cls: 'bg-accent-soft text-electric' },
  jpg: { icon: FileImage, cls: 'bg-success-soft text-success' },
  jpeg: { icon: FileImage, cls: 'bg-success-soft text-success' },
  png: { icon: FileImage, cls: 'bg-success-soft text-success' },
}

export function FileIcon({ type, className }: { type: string; className?: string }) {
  const { icon: Icon, cls } = MAP[type] ?? { icon: FileText, cls: 'bg-surface-2 text-muted' }
  return (
    <div className={cn('grid size-11 shrink-0 place-items-center rounded-[4px]', cls, className)}>
      <Icon className="size-5" aria-hidden />
    </div>
  )
}
