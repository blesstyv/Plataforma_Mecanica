import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, FileStack, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { DataTable, PageHeader, Td, Th } from '@/components/admin'
import { FileIcon } from '@/components/FileIcon'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Modal } from '@/components/ui/Dialogs'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Nav'
import { useToast } from '@/components/ui/Toast'
import { useDebounce } from '@/hooks/useDebounce'
import { errorMessage, fileLabel, formatBytes, formatDate } from '@/lib/utils'
import { adminService } from '@/services'
import type { AdminCategory, AdminMaterial } from '@/types/api'
import { Viewer } from '../MaterialDetail'

const ACCEPT = '.pdf,.pptx,.docx,.jpg,.jpeg,.png'
const MAX_MB = 50
const PAGE_SIZE = 15

const base = {
  category: z.coerce.number({ message: 'Selecciona una categoría' }).int().positive('Selecciona una categoría'),
  title: z.string().trim().min(2, 'El título es obligatorio (mínimo 2 caracteres)').max(200),
  description: z.string().max(5000),
  allow_download: z.boolean(),
}
const createSchema = z.object({ ...base, publish: z.boolean() })
const editSchema = z.object(base)
type CreateForm = z.input<typeof createSchema>

function validateFile(f: File | null, required: boolean, types = ACCEPT): string | undefined {
  if (!f) return required ? 'Selecciona un archivo' : undefined
  const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase()
  if (!types.split(',').includes(ext)) return `Formato no permitido. Usa: ${types.replaceAll('.', '')}`
  if (f.size > MAX_MB * 1024 * 1024) return `El archivo supera ${MAX_MB} MB`
  return undefined
}

function ProgressBar({ pct }: { pct: number }) {
  return <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de subida" className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-electric transition-all" style={{ width: `${pct}%` }} /></div>
}

function CategorySelect({ cats, error, ...p }: { cats: AdminCategory[]; error?: string } & Record<string, unknown>) {
  return <Select {...p}><option value="">Selecciona…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.subject_name} › {c.name}</option>)}</Select>
}

function MaterialForm({ material, cats, onDone }: { material: AdminMaterial | null; cats: AdminCategory[]; onDone: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<File | null>(null)
  const [fileErr, setFileErr] = useState<string>()
  const [prevErr, setPrevErr] = useState<string>()
  const [pct, setPct] = useState(0)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(material)
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(material ? editSchema : createSchema) as never,
    defaultValues: { category: material?.category ?? ('' as unknown as number), title: material?.title ?? '', description: material?.description ?? '', allow_download: material?.allow_download ?? true, publish: false },
  })
  const needsPreview = (name?: string) => !!name && /\.(pptx|docx)$/i.test(name)
  const refresh = () => qc.invalidateQueries()

  const save = useMutation({
    mutationFn: async (v: CreateForm) => {
      if (material) {
        const ext = validateFile(file, false); if (ext) throw new Error(ext)
        let m = await adminService.materials.update(material.id, { title: v.title, description: v.description, category: Number(v.category), allow_download: v.allow_download })
        if (file) m = await adminService.materials.replaceFile(material.id, file, setPct)
        if (preview) m = await adminService.materials.setPreview(material.id, preview)
        return m
      }
      const e1 = validateFile(file, true); if (e1) { setFileErr(e1); throw new Error(e1) }
      const f = new FormData()
      f.append('category', String(v.category)); f.append('title', v.title); f.append('description', v.description)
      f.append('allow_download', String(v.allow_download)); f.append('status', v.publish ? 'published' : 'draft')
      f.append('file', file!)
      if (preview) f.append('preview_file', preview)
      return adminService.materials.create(f, setPct)
    },
    onSuccess: () => { refresh(); toast.ok(material ? 'Material actualizado' : 'Material subido correctamente'); onDone() },
    onError: (e) => setError(errorMessage(e)),
  })
  const rmPreview = useMutation({
    mutationFn: () => adminService.materials.removePreview(material!.id),
    onSuccess: (m) => { setCurrent(m); refresh(); toast.ok('Vista previa quitada') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => { setError(''); setPct(0); save.mutate(v) })}>
      {error && <p role="alert" className="rounded-[4px] bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <Field label="Título" error={errors.title?.message}>{(p) => <Input {...p} {...register('title')} />}</Field>
      <Field label="Categoría" error={errors.category?.message}>{(p) => <CategorySelect cats={cats} {...p} {...register('category')} />}</Field>
      <Field label="Descripción" error={errors.description?.message}>{(p) => <Textarea {...p} {...register('description')} />}</Field>
      <Field label={material ? 'Reemplazar archivo (opcional)' : 'Archivo'} error={fileErr} hint={material ? `Actual: ${material.original_filename} (${formatBytes(material.file_size)})` : `PDF, PPTX, DOCX, JPG o PNG · máx. ${MAX_MB} MB`}>
        {(p) => <Input {...p} type="file" accept={ACCEPT} className="pt-1.5" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setFileErr(validateFile(f, !material)) }} />}
      </Field>
      {(needsPreview(file?.name) || needsPreview(material?.original_filename)) && (
        <Field label="PDF para visualizar en línea (recomendado para PowerPoint/Word)" error={prevErr}
          hint={current?.has_preview ? 'Este material ya tiene vista previa. Subir otro PDF la reemplaza.' : 'Los navegadores no abren PPTX/DOCX. Adjunta una versión PDF para que los alumnos la vean sin descargar.'}>
          {(p) => <Input {...p} type="file" accept=".pdf" className="pt-1.5" onChange={(e) => { const f = e.target.files?.[0] ?? null; setPreview(f); setPrevErr(validateFile(f, false, '.pdf')) }} />}
        </Field>)}
      {current?.has_preview && <Button type="button" variant="secondary" size="sm" loading={rmPreview.isPending} onClick={() => rmPreview.mutate()}>Quitar vista previa PDF</Button>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" {...register('allow_download')} /> Permitir descarga a los alumnos</label>
      {!material && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" {...register('publish')} /> Publicar inmediatamente</label>}
      {save.isPending && file && <ProgressBar pct={pct} />}
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onDone}>Cancelar</Button>
        <Button type="submit" loading={save.isPending}>{!material && <Upload className="size-4" aria-hidden />}{material ? 'Guardar cambios' : 'Subir material'}</Button></div>
    </form>
  )
}

export default function Materials() {
  const qc = useQueryClient()
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const [term, setTerm] = useState('')
  const search = useDebounce(term)
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminMaterial | null | 'new'>(sp.get('nuevo') ? 'new' : null)
  const [viewing, setViewing] = useState<AdminMaterial | null>(null)
  const [deleting, setDeleting] = useState<AdminMaterial | null>(null)
  const params = { search, status, file_type: type, page, page_size: PAGE_SIZE }
  const q = useQuery({ queryKey: ['admin', 'materials', params], queryFn: () => adminService.materials.list(params), placeholderData: (p) => p })
  const cats = useQuery({ queryKey: ['admin', 'categories', ''], queryFn: () => adminService.categories.list({ ordering: 'display_order' }) })
  const closeEdit = () => { setEditing(null); if (sp.get('nuevo')) setSp({}, { replace: true }) }

  const toggle = useMutation({
    mutationFn: (m: AdminMaterial) => (m.status === 'published' ? adminService.materials.unpublish(m.id) : adminService.materials.publish(m.id)),
    onSuccess: (m) => { qc.invalidateQueries(); toast.ok(m.status === 'published' ? 'Material publicado' : 'Material despublicado') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const del = useMutation({
    mutationFn: (m: AdminMaterial) => adminService.materials.remove(m.id),
    onSuccess: () => { qc.invalidateQueries(); toast.ok('Material eliminado'); setDeleting(null) },
    onError: (e) => { toast.error(errorMessage(e)); setDeleting(null) },
  })
  const noCats = cats.data?.results.length === 0
  const filtered = !!(search || status || type)

  return (
    <>
      <PageHeader title="Materiales" description="Sube, edita y publica documentos para tus alumnos." action={<Button disabled={noCats} onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />Subir material</Button>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_10rem_10rem]" role="search">
        <div className="relative"><label htmlFor="am-q" className="sr-only">Buscar materiales</label><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted" aria-hidden />
          <input id="am-q" value={term} onChange={(e) => { setTerm(e.target.value); setPage(1) }} placeholder="Buscar por título o archivo" className="h-10 w-full rounded-[4px] border border-line bg-surface pl-9 pr-3 text-sm focus:border-electric" /></div>
        <div><label htmlFor="am-s" className="sr-only">Estado</label><Select id="am-s" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">Todos los estados</option><option value="published">Publicados</option><option value="draft">Borradores</option></Select></div>
        <div><label htmlFor="am-t" className="sr-only">Formato</label><Select id="am-t" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}><option value="">Todos los formatos</option><option value="pdf">PDF</option><option value="pptx">PowerPoint</option><option value="docx">Word</option><option value="jpg">JPG</option><option value="png">PNG</option></Select></div>
      </div>
      {noCats ? <EmptyState icon={FileStack} title="Primero crea una categoría">Los materiales se guardan dentro de una categoría de una asignatura.</EmptyState>
        : q.isLoading ? <Spinner /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : q.data!.results.length === 0 ? (
          <EmptyState icon={FileStack} title={filtered ? 'Sin resultados' : 'Aún no has subido materiales'} action={!filtered && <Button onClick={() => setEditing('new')}>Subir el primero</Button>}>{filtered ? 'Prueba con otros filtros.' : 'Sube un PDF, presentación o documento para empezar.'}</EmptyState>
        ) : (
          <>
            <DataTable label="Materiales">
              <thead><tr><Th>Material</Th><Th>Ubicación</Th><Th>Formato</Th><Th>Estado</Th><Th className="text-right">Acciones</Th></tr></thead>
              <tbody>{q.data!.results.map((m) => (
                <tr key={m.id}>
                  <Td><div className="flex items-center gap-3"><FileIcon type={m.file_type} className="size-9" /><div className="min-w-0"><p className="max-w-[16rem] truncate font-medium">{m.title}</p><p className="text-xs text-muted">{formatBytes(m.file_size)} · {formatDate(m.created_at)}</p></div></div></Td>
                  <Td className="text-muted">{m.subject_name} › {m.category_name}</Td>
                  <Td><Badge tone="accent">{fileLabel(m.file_type)}</Badge></Td>
                  <Td><Button variant="secondary" size="sm" loading={toggle.isPending && toggle.variables?.id === m.id} onClick={() => toggle.mutate(m)} aria-label={m.status === 'published' ? `Despublicar ${m.title}` : `Publicar ${m.title}`}>
                    <span className={`size-2 rounded-full ${m.status === 'published' ? 'bg-success' : 'bg-warn'}`} aria-hidden />{m.status === 'published' ? 'Publicado' : 'Borrador'}</Button></Td>
                  <Td className="text-right"><Button variant="ghost" size="sm" aria-label={`Vista previa de ${m.title}`} onClick={() => setViewing(m)}><Eye className="size-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Editar ${m.title}`} onClick={() => setEditing(m)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Eliminar ${m.title}`} onClick={() => setDeleting(m)}><Trash2 className="size-4 text-danger" /></Button></Td>
                </tr>))}</tbody>
            </DataTable>
            <Pagination page={page} count={q.data!.count} pageSize={PAGE_SIZE} onChange={setPage} />
          </>)}
      <Modal wide open={editing !== null} onOpenChange={(o) => !o && closeEdit()} title={editing === 'new' ? 'Subir material' : 'Editar material'} description="Los materiales nuevos se crean como borrador salvo que marques publicar.">
        {editing !== null && <MaterialForm material={editing === 'new' ? null : editing} cats={cats.data?.results ?? []} onDone={closeEdit} />}
      </Modal>
      <Modal wide open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} title={viewing?.title ?? ''} description="Vista previa tal como la verán los alumnos.">
        {viewing && <Viewer m={viewing} admin />}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="¿Eliminar material?" loading={del.isPending}
        description={<>Se eliminará <strong>{deleting?.title}</strong> y su archivo de forma permanente. Esta acción no se puede deshacer.</>} onConfirm={() => deleting && del.mutate(deleting)} />
    </>
  )
}
