import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { err, mockFetch, page, renderApp } from '@/test/utils'

afterEach(() => vi.unstubAllGlobals())

const subject = { id: 1, name: 'Soldadura SMAW y MIG', slug: 'soldadura', description: 'Procesos de soldadura', image_url: null, display_order: 0, category_count: 2, material_count: 3 }
const material = { id: 7, title: 'Guía de electrodos', slug: 'g', description: 'Tipos de electrodos', subject_slug: 'soldadura', subject_name: 'Soldadura SMAW y MIG', category: 1, category_slug: 'smaw', category_name: 'SMAW', file_type: 'pdf', original_filename: 'g.pdf', file_size: 2048, allow_download: true, has_preview: false, viewable: true, created_at: '2026-01-10T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' }

const handler = (over: Record<string, unknown> = {}) => (url: URL) => {
  if (url.pathname in over) return over[url.pathname] as never
  if (url.pathname === '/api/v1/auth/me/') return err(403, 'not_authenticated', 'x')
  if (url.pathname === '/api/v1/subjects/') return { body: page([subject]) }
  if (url.pathname === '/api/v1/materials/') return { body: page([material]) }
  if (url.pathname === '/api/v1/materials/7/') return { body: material }
  if (url.pathname === '/api/v1/subjects/soldadura/') return { body: { ...subject, categories: [{ id: 1, subject: 'soldadura', subject_name: subject.name, name: 'SMAW', slug: 'smaw', description: '', display_order: 0, material_count: 1 }] } }
}

describe('portal público', () => {
  it('la portada muestra asignaturas y materiales', async () => {
    mockFetch(handler())
    renderApp('/')
    expect(await screen.findByRole('heading', { name: /soldadura smaw y mig/i })).toBeInTheDocument()
    expect(await screen.findByText('Guía de electrodos')).toBeInTheDocument()
    expect(screen.getByRole('search')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay materiales', async () => {
    mockFetch(handler({ '/api/v1/materials/': { body: page([]) } }))
    renderApp('/materiales')
    expect(await screen.findByText(/todavía no hay materiales publicados/i)).toBeInTheDocument()
  })

  it('muestra error con reintento', async () => {
    let fail = true
    mockFetch((u) => (u.pathname === '/api/v1/materials/' && fail ? err(500, 'server_error', 'Falla del servidor') : handler()(u)))
    renderApp('/materiales')
    expect(await screen.findByText('Falla del servidor')).toBeInTheDocument()
    fail = false
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(await screen.findByText('Guía de electrodos')).toBeInTheDocument()
  })

  it('los filtros y la búsqueda se envían a la API', async () => {
    const { calls } = mockFetch(handler())
    renderApp('/materiales')
    await screen.findByText('Guía de electrodos')
    await userEvent.selectOptions(screen.getByLabelText('Formato'), 'pptx')
    await waitFor(() => expect(calls.some((c) => c.url.searchParams.get('file_type') === 'pptx')).toBe(true))
    await userEvent.type(screen.getByLabelText('Buscar'), 'cnc')
    await waitFor(() => expect(calls.some((c) => c.url.searchParams.get('search') === 'cnc')).toBe(true), { timeout: 2000 })
  })

  it('el detalle ofrece visor y descarga cuando está permitida', async () => {
    mockFetch(handler())
    renderApp('/materiales/7')
    expect(await screen.findByRole('heading', { name: 'Guía de electrodos' })).toBeInTheDocument()
    expect(screen.getByTitle(/visor/i)).toHaveAttribute('src', '/api/v1/materials/7/file/')
    expect(screen.getByRole('link', { name: /descargar pdf/i })).toHaveAttribute('href', '/api/v1/materials/7/file/?download=1')
    expect(screen.getByRole('navigation', { name: /ruta/i })).toBeInTheDocument()
  })

  it('oculta la descarga cuando no está permitida', async () => {
    mockFetch(handler({ '/api/v1/materials/7/': { body: { ...material, allow_download: false } } }))
    renderApp('/materiales/7')
    expect(await screen.findByText(/descarga no habilitada/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /descargar/i })).not.toBeInTheDocument()
  })

  it('PPTX sin vista previa explica que no se puede visualizar', async () => {
    mockFetch(handler({ '/api/v1/materials/7/': { body: { ...material, file_type: 'pptx', viewable: false } } }))
    renderApp('/materiales/7')
    expect(await screen.findByText(/no se puede visualizar en el navegador/i)).toBeInTheDocument()
  })

  it('material inexistente muestra 404', async () => {
    mockFetch(handler({ '/api/v1/materials/99/': err(404, 'not_found', 'No encontrado') }))
    renderApp('/materiales/99')
    expect(await screen.findByText(/ya no está disponible/i)).toBeInTheDocument()
  })

  it('detalle de asignatura agrupa materiales por categoría', async () => {
    mockFetch(handler())
    renderApp('/asignaturas/soldadura')
    const h = await screen.findByRole('heading', { name: 'SMAW' })
    expect(h).toBeInTheDocument()
    const section = h.closest('section')!
    expect(await within(section).findByText('Guía de electrodos')).toBeInTheDocument()
  })
})
