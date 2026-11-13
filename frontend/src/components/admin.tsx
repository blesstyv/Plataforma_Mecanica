import type { ReactNode } from 'react'

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-medium sm:text-3xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
      {action}
    </div>
  )
}

export function DataTable({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="overflow-x-auto rounded-[4px] border border-line bg-surface shadow-card">
      <table className="w-full min-w-[640px] text-left text-sm" aria-label={label}>{children}</table>
    </div>
  )
}
export const Th = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <th scope="col" className={`border-b border-line bg-surface-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${className}`}>{children}</th>
)
export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <td className={`border-b border-line px-4 py-3 align-middle last:border-b-0 ${className}`}>{children}</td>
)

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-success' : 'bg-line'}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}
