import clsx, { type ClassValue } from 'clsx'

export const cn = (...v: ClassValue[]) => clsx(v)

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 ** 2).toFixed(1)} MB`
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

export const FILE_LABELS: Record<string, string> = { pdf: 'PDF', pptx: 'PowerPoint', docx: 'Word', jpg: 'Imagen', jpeg: 'Imagen', png: 'Imagen' }
export const fileLabel = (t: string) => FILE_LABELS[t] ?? t.toUpperCase()
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado.')
