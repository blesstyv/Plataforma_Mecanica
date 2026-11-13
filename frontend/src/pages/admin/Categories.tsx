import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DataTable, PageHeader, Switch, Td, Th } from '@/components/admin'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Modal } from '@/components/ui/Dialogs'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/lib/utils'
import { adminService } from '@/services'
import type { AdminCategory, AdminSubject } from '@/types/api'

const schema = z.object({
  subject: z.coerce.number({ message: 'Selecciona una asignatura' }).int().positive('Selecciona una asignatura'),
  name: z.string().trim().min(2, 'El nombre es obligatorio (mínimo 2 caracteres)').max(120),
  description: z.string().max(2000),
  display_order: z.coerce.number().int().min(0, 'Debe ser 0 o mayor'),
  is_published: z.boolean(),
})
type Form = z.input<typeof schema>

function CategoryForm({ cat, subjects, defaultSubject, onDone }: { cat: AdminCategory | null; subjects: AdminSubject[]; defaultSubject?: string; onDone: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { subject: cat?.subject ?? (defaultSubject ? Number(defaultSubject) : ('' as unknown as number)), name: cat?.name ?? '', description: cat?.description ?? '', display_order: cat?.display_order ?? 0, is_published: cat?.is_published ?? false },
  })
  const m = useMutation({
    mutationFn: (v: z.output<typeof schema>) => (cat ? adminService.categories.update(cat.id, v) : adminService.categories.create(v)),
    onSuccess: () => { qc.invalidateQueries(); toast.ok(cat ? 'Categoría actualizada' : 'Categoría creada'); onDone() },
    onError: (e) => setError(errorMessage(e)),
  })
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => { setError(''); m.mutate(schema.parse(v)) })}>
      {error && <p role="alert" className="rounded-[4px] bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <Field label="Asignatura" error={errors.subject?.message}>{(p) => <Select {...p} {...register('subject')}><option value="">Selecciona…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
      <Field label="Nombre de la categoría / unidad" error={errors.name?.message}>{(p) => <Input {...p} {...register('name')} />}</Field>
      <Field label="Descripción" error={errors.description?.message}>{(p) => <Textarea {...p} {...register('description')} />}</Field>
      <Field label="Orden de aparición" error={errors.display_order?.message}>{(p) => <Input {...p} type="number" min={0} {...register('display_order')} />}</Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" {...register('is_published')} /> Publicada (visible para los alumnos)</label>
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onDone}>Cancelar</Button><Button type="submit" loading={m.isPending}>Guardar</Button></div>
    </form>
  )
}

export default function Categories() {
  const qc = useQueryClient()
  const toast = useToast()
  const [filter, setFilter] = useState('')
  const subjects = useQuery({ queryKey: ['admin', 'subjects'], queryFn: () => adminService.subjects.list({ ordering: 'display_order' }) })
  const q = useQuery({ queryKey: ['admin', 'categories', filter], queryFn: () => adminService.categories.list({ subject: filter, ordering: 'display_order' }) })
  const [editing, setEditing] = useState<AdminCategory | null | 'new'>(null)
  const [deleting, setDeleting] = useState<AdminCategory | null>(null)
  const toggle = useMutation({
    mutationFn: (c: AdminCategory) => adminService.categories.update(c.id, { is_published: !c.is_published }),
    onSuccess: () => qc.invalidateQueries(), onError: (e) => toast.error(errorMessage(e)),
  })
  const del = useMutation({
    mutationFn: (c: AdminCategory) => adminService.categories.remove(c.id),
    onSuccess: () => { qc.invalidateQueries(); toast.ok('Categoría eliminada'); setDeleting(null) },
    onError: (e) => { toast.error(errorMessage(e)); setDeleting(null) },
  })
  const noSubjects = subjects.data?.results.length === 0
  return (
    <>
      <PageHeader title="Categorías" description="Unidades dentro de cada asignatura." action={<Button disabled={noSubjects} onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />Nueva categoría</Button>} />
      <div className="mb-4 max-w-xs"><label htmlFor="cf" className="sr-only">Filtrar por asignatura</label>
        <Select id="cf" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Todas las asignaturas</option>{subjects.data?.results.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
      {noSubjects ? <EmptyState icon={FolderTree} title="Primero crea una asignatura">Las categorías pertenecen a una asignatura.</EmptyState>
        : q.isLoading ? <Spinner /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : q.data!.results.length === 0 ? (
          <EmptyState icon={FolderTree} title="No hay categorías" action={<Button onClick={() => setEditing('new')}>Crear categoría</Button>}>Crea unidades como “Introducción” o “Procesos” dentro de una asignatura.</EmptyState>
        ) : (
          <DataTable label="Categorías">
            <thead><tr><Th>Categoría</Th><Th>Asignatura</Th><Th>Materiales</Th><Th>Orden</Th><Th>Estado</Th><Th className="text-right">Acciones</Th></tr></thead>
            <tbody>{q.data!.results.map((c) => (
              <tr key={c.id}><Td className="font-medium">{c.name}</Td><Td>{c.subject_name}</Td><Td>{c.material_count}</Td><Td>{c.display_order}</Td>
                <Td><div className="flex items-center gap-2"><Switch checked={c.is_published} label={`Publicar ${c.name}`} onChange={() => toggle.mutate(c)} /><Badge tone={c.is_published ? 'success' : 'neutral'}>{c.is_published ? 'Publicada' : 'Oculta'}</Badge></div></Td>
                <Td className="text-right"><Button variant="ghost" size="sm" aria-label={`Editar ${c.name}`} onClick={() => setEditing(c)}><Pencil className="size-4" /></Button><Button variant="ghost" size="sm" aria-label={`Eliminar ${c.name}`} onClick={() => setDeleting(c)}><Trash2 className="size-4 text-danger" /></Button></Td></tr>))}</tbody>
          </DataTable>)}
      <Modal open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nueva categoría' : 'Editar categoría'}>
        {editing !== null && <CategoryForm cat={editing === 'new' ? null : editing} subjects={subjects.data?.results ?? []} defaultSubject={filter} onDone={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="¿Eliminar categoría?" loading={del.isPending}
        description={<>Se eliminará <strong>{deleting?.name}</strong>. Si contiene materiales, primero debes eliminarlos o moverlos.</>} onConfirm={() => deleting && del.mutate(deleting)} />
    </>
  )
}
