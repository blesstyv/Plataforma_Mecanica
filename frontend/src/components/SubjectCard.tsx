import { ArrowUpRight, Cog, Cpu, Flame, Droplets, Ruler, ShieldCheck, Wrench, Compass, Layers, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Subject } from '@/types/api'

const ICONS: [RegExp, LucideIcon][] = [
  [/solda/i, Flame], [/cnc|control num/i, Cpu], [/metrolog|medici|verific/i, Ruler], [/plano/i, Compass],
  [/mecaniz|fresa|torne/i, Cog], [/mantenim/i, Wrench], [/oleo|neum|hidr/i, Droplets], [/seguridad/i, ShieldCheck],
]
export const subjectIcon = (name: string): LucideIcon => ICONS.find(([r]) => r.test(name))?.[1] ?? Layers

export function SubjectCard({ subject }: { subject: Subject }) {
  const Icon = subjectIcon(subject.name)
  return (
    <Link
      to={`/asignaturas/${subject.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-electric/50 hover:shadow-lg"
    >
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)]">
        {subject.image_url ? (
          <img src={subject.image_url} alt="" loading="lazy" className="size-full object-cover opacity-90" />
        ) : (
          <>
            <div className="blueprint absolute inset-0" />
            <Icon className="absolute bottom-3 left-4 size-10 text-accent" strokeWidth={1.5} aria-hidden />
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="flex items-start justify-between gap-2 text-lg font-semibold leading-snug">
          {subject.name}
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-electric" aria-hidden />
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">{subject.description || 'Material de estudio de la asignatura.'}</p>
        <p className="mt-4 text-xs font-medium text-muted">
          {subject.category_count} {subject.category_count === 1 ? 'unidad' : 'unidades'} · {subject.material_count} {subject.material_count === 1 ? 'material' : 'materiales'}
        </p>
      </div>
    </Link>
  )
}
