import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpen, Layers, Search, Smartphone } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MaterialCard } from '@/components/MaterialCard'
import { SubjectCard } from '@/components/SubjectCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { errorMessage } from '@/lib/utils'
import { publicService } from '@/services'

export default function Home() {
  const nav = useNavigate()
  const [term, setTerm] = useState('')
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: () => publicService.subjects() })
  const recent = useQuery({ queryKey: ['materials', 'recent'], queryFn: () => publicService.materials({ page_size: 4 }) })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    nav(`/materiales${term ? `?search=${encodeURIComponent(term)}` : ''}`)
  }
  const totalMaterials = subjects.data?.results.reduce((a, s) => a + s.material_count, 0) ?? 0

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-white">
        <div className="blueprint absolute inset-0" aria-hidden />
        <svg aria-hidden viewBox="0 0 200 200" className="gear-spin pointer-events-none absolute -right-16 -top-16 size-[26rem] text-cyan-300/15 md:-right-8 md:size-[34rem]" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
          <circle cx="100" cy="100" r="42" /><circle cx="100" cy="100" r="14" />
          <path d="M100 20v22M100 158v22M20 100h22M158 100h22M43 43l16 16M141 141l16 16M157 43l-16 16M59 141l-16 16" />
        </svg>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <span className="size-1.5 rounded-full bg-cyan-300" /> Mecánica Industrial
            </p>
            <h1 className="text-4xl font-bold leading-[1.1] sm:text-5xl">Aprende cómo se fabrica el mundo, paso a paso.</h1>
            <p className="mt-5 text-lg text-blue-100/90">
              Apuntes, presentaciones y guías de taller organizados por asignatura y unidad. Sin registro: entra, busca y estudia desde cualquier dispositivo.
            </p>
            <form onSubmit={submit} role="search" className="mt-8 flex max-w-xl gap-2 rounded-xl bg-white p-1.5 shadow-xl">
              <label htmlFor="home-search" className="sr-only">Buscar materiales</label>
              <Search className="ml-3 mt-3 size-5 shrink-0 text-slate-400" aria-hidden />
              <input id="home-search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Busca: soldadura MIG, calibre, CNC…" className="min-w-0 flex-1 bg-transparent px-1 text-slate-900 placeholder:text-slate-400 focus:outline-none" />
              <button className="rounded-lg bg-[#0a2a5e] px-5 text-sm font-semibold text-white hover:bg-[#123f8c]">Buscar</button>
            </form>
          </motion.div>
          <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4 text-center">
            {[[subjects.data?.count ?? '–', 'asignaturas'], [totalMaterials || '–', 'materiales'], ['Libre', 'acceso']].map(([v, l]) => (
              <div key={l as string} className="rounded-xl border border-white/15 bg-white/5 px-3 py-3">
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-2xl font-bold">{v}</dd>
                <dd className="text-xs text-blue-200">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Asignaturas</h2>
            <p className="mt-1 text-muted">Elige un área y recorre sus unidades.</p>
          </div>
          <Link to="/asignaturas" className="hidden items-center gap-1 text-sm font-medium text-electric hover:underline sm:flex">Ver todas <ArrowRight className="size-4" /></Link>
        </div>
        {subjects.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-52" />)}</div>
        ) : subjects.isError ? (
          <ErrorState message={errorMessage(subjects.error)} onRetry={() => subjects.refetch()} />
        ) : subjects.data!.results.length === 0 ? (
          <EmptyState icon={BookOpen} title="Aún no hay asignaturas publicadas">El profesor está preparando el contenido. Vuelve pronto.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{subjects.data!.results.slice(0, 6).map((s) => <SubjectCard key={s.id} subject={s} />)}</div>
        )}
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {[
            [Layers, 'Organizado por unidades', 'Cada asignatura se divide en unidades para estudiar en orden.'],
            [Search, 'Busca y filtra', 'Encuentra un tema por palabra, asignatura o formato de archivo.'],
            [Smartphone, 'En cualquier pantalla', 'Lee y descarga desde el computador, la tablet o el teléfono.'],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Layers
            return (
              <div key={t as string} className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><I className="size-5" aria-hidden /></div>
                <div><h3 className="font-semibold">{t as string}</h3><p className="mt-1 text-sm text-muted">{d as string}</p></div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-7 flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Últimos materiales</h2>
          <Link to="/materiales" className="flex items-center gap-1 text-sm font-medium text-electric hover:underline">Biblioteca <ArrowRight className="size-4" /></Link>
        </div>
        {recent.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : recent.isError ? (
          <ErrorState message={errorMessage(recent.error)} onRetry={() => recent.refetch()} />
        ) : recent.data!.results.length === 0 ? (
          <EmptyState title="Todavía no hay materiales publicados">Cuando el profesor publique documentos aparecerán aquí.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{recent.data!.results.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
        )}
      </section>
    </>
  )
}
