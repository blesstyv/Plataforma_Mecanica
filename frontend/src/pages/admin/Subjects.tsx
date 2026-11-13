import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageOff, Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DataTable, PageHeader, Switch, Td, Th } from '@/components/admin'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Modal } from '@/components/ui/Dialogs'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/lib/utils'
import { adminService } from '@/services'
import type { AdminSubject } from '@/types/api'

const schema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio (mínimo 2 caracteres)').max(120),
  description: z.string().max(2000),
  display_order: z.coerce.number().int().min(0, 'Debe ser 0 o mayor'),
  is_published: z.boolean(),
})
type Form = z.input<typeof schema>

function SubjectForm({ subject, onDone }: { subject: AdminSubject | null; onDone: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: subject?.name ?? '', description: subject?.description ?? '', display_order: subject?.display_order ?? 0, is_published: subject?.is_published ?? false },
  })
  const m = useMutation({
    mutationFn: async (v: z.output<typeof schema>) => {
      const saved = subject ? await adminService.subjects.update(subject.id, v) : await adminService.subjects.create(v)
      if (image) await adminService.subjects.setImage(saved.id, image)
      return saved
    },
    onSuccess: () => { qc.invalidateQueries(); toast.ok(subject ? 'Asignatura actualizada' : 'Asignatura creada'); onDone() },
    onError: (e) => setError(errorMessage(e)),
  })
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => { setError(''); m.mutate(schema.parse(v)) })}>
      {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <Field label="Nombre" error={errors.name?.message}>{(p) => <Input {...p} {...register('name')} />}</Field>
      <Field label="Descripción" error={errors.description?.message}>{(p) => <Textarea {...p} {...register('description')} />}</Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Orden de aparición" error={errors.display_order?.message}>{(p) => <Input {...p} type="number" min={0} {...register('display_order')} />}</Field>
        <Field label="Imagen (JPG/PNG, opcional)" hint={subject?.image_url ? 'Ya tiene imagen; elegir otra la reemplaza.' : undefined}>{(p) => <Input {...p} type="file" accept=".jpg,.jpeg,.png" className="pt-1.5" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />}</Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" {...register('is_published')} /> Publicada (visible para los alumnos)</label>
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onDone}>Cancelar</Button><Button type="submit" loading={m.isPending}>Guardar</Button></div>
    </form>
  )
}

export default function Subjects() {
  const qc = useQueryClient()
  const toast = useToast()
  const q = useQuery({ queryKey: ['admin', 'subjects'], queryFn: () => adminService.subjects.list({ ordering: 'display_order' }) })
  const [editing, setEditing] = useState<AdminSubject | null | 'new'>(null)
  const [deleting, setDeleting] = useState<AdminSubject | null>(null)
  const toggle = useMutation({
    mutationFn: (s: AdminSubject) => adminService.subjects.update(s.id, { is_published: !s.is_published }),
    onSuccess: () => qc.invalidateQueries(), onError: (e) => toast.error(errorMessage(e)),
  })
  const del = useMutation({
    mutationFn: (s: AdminSubject) => adminService.subjects.remove(s.id),
    onSuccess: () => { qc.invalidateQueries(); toast.ok('Asignatura eliminada'); setDeleting(null) },
    onError: (e) => { toast.error(errorMessage(e)); setDeleting(null) },
  })
  return (
    <>
      <PageHeader title="Asignaturas" description="Áreas de estudio. Solo las publicadas son visibles para los alumnos." action={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />Nueva asignatura</Button>} />
      {q.isLoading ? <Spinner /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : q.data!.results.length === 0 ? (
        <EmptyState icon={Layers} title="Aún no hay asignaturas" action={<Button onClick={() => setEditing('new')}>Crear la primera</Button>}>Crea asignaturas como “Soldadura” o “Metrología” para organizar tus materiales.</EmptyState>
      ) : (
        <DataTable label="Asignaturas">
          <thead><tr><Th>Nombre</Th><Th>Categorías</Th><Th>Orden</Th><Th>Estado</Th><Th className="text-right">Acciones</Th></tr></thead>
          <tbody>{q.data!.results.map((s) => (
            <tr key={s.id}>
              <Td><p className="font-medium">{s.name}</p><p className="max-w-xs truncate text-xs text-muted">{s.description || <span className="inline-flex items-center gap-1"><ImageOff className="size-3" />Sin descripción</span>}</p></Td>
              <Td>{s.category_count}</Td><Td>{s.display_order}</Td>
              <Td><div className="flex items-center gap-2"><Switch checked={s.is_published} label={`Publicar ${s.name}`} onChange={() => toggle.mutate(s)} /><Badge tone={s.is_published ? 'success' : 'neutral'}>{s.is_published ? 'Publicada' : 'Oculta'}</Badge></div></Td>
              <Td className="text-right"><Button variant="ghost" size="sm" aria-label={`Editar ${s.name}`} onClick={() => setEditing(s)}><Pencil className="size-4" /></Button><Button variant="ghost" size="sm" aria-label={`Eliminar ${s.name}`} onClick={() => setDeleting(s)}><Trash2 className="size-4 text-danger" /></Button></Td>
            </tr>))}</tbody>
        </DataTable>
      )}
      <Modal open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nueva asignatura' : 'Editar asignatura'}>
        {editing !== null && <SubjectForm subject={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="¿Eliminar asignatura?" loading={del.isPending}
        description={<>Se eliminará <strong>{deleting?.name}</strong>. Si tiene categorías, primero debes eliminarlas o moverlas.</>} onConfirm={() => deleting && del.mutate(deleting)} />
    </>
  )
}
