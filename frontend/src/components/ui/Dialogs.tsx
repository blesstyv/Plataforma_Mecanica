import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

const overlay = 'fixed inset-0 z-50 bg-[#050d1c]/60 backdrop-blur-sm'
const panel = 'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl'

export function ConfirmDialog(props: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={overlay} />
        <AlertDialog.Content className={`${panel} max-w-md`}>
          <AlertDialog.Title className="font-display text-lg font-semibold">{props.title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">{props.description}</AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Cancelar</Button>
            </AlertDialog.Cancel>
            <Button variant="danger" loading={props.loading} onClick={props.onConfirm}>
              {props.confirmLabel ?? 'Eliminar'}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export function Modal({ open, onOpenChange, title, description, children, wide }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content className={`${panel} ${wide ? 'max-w-2xl' : 'max-w-lg'}`} aria-describedby={description ? undefined : undefined}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-lg font-semibold">{title}</Dialog.Title>
              <Dialog.Description className={description ? 'mt-1 text-sm text-muted' : 'sr-only'}>{description ?? title}</Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label="Cerrar">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
