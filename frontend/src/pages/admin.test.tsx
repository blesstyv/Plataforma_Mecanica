import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { err, mockFetch, page, renderApp, teacher } from '@/test/utils'

afterEach(() => vi.unstubAllGlobals())

describe('login del profesor', () => {
  it('valida campos obligatorios sin llamar a la API', async () => {
    const { calls } = mockFetch((u) => (u.pathname.endsWith('/me/') ? err(403, 'x', 'x') : undefined))
    renderApp('/admin/login')
    await userEvent.click(await screen.findByRole('button', { name: /ingresar/i }))
    expect(await screen.findByText('Ingresa tu usuario')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument()
    expect(calls.some((c) => c.url.pathname.endsWith('/login/'))).toBe(false)
  })

  it('muestra el error cuando las credenciales son incorrectas', async () => {
    mockFetch((u) => {
      if (u.pathname.endsWith('/me/')) return err(403, 'x', 'x')
      if (u.pathname.endsWith('/csrf/')) return { body: {} }
      if (u.pathname.endsWith('/login/')) return err(401, 'invalid_credentials', 'Usuario o contraseña incorrectos.')
    })
    renderApp('/admin/login')
    await userEvent.type(await screen.findByLabelText('Usuario'), 'profe')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos.')
  })

  it('inicia sesión y entra al panel', async () => {
    let logged = false
    mockFetch((u) => {
      if (u.pathname.endsWith('/me/')) return logged ? { body: teacher } : err(403, 'x', 'x')
      if (u.pathname.endsWith('/csrf/')) return { body: {} }
      if (u.pathname.endsWith('/login/')) { logged = true; return { body: teacher } }
      if (u.pathname.endsWith('/dashboard/')) return { body: { subjects: 4, categories: 9, materials: 12, published: 8, drafts: 4, recent_materials: [] } }
    })
    renderApp('/admin/login')
    await userEvent.type(await screen.findByLabelText('Usuario'), 'profe')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave-segura-123')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(await screen.findByRole('heading', { name: 'Panel' })).toBeInTheDocument()
    expect(await screen.findByTestId('stat-Materiales')).toHaveTextContent('12')
    expect(screen.getByTestId('stat-Borradores')).toHaveTextContent('4')
  })
})

describe('protección de rutas', () => {
  it('redirige al login si no hay sesión', async () => {
    mockFetch((u) => (u.pathname.endsWith('/me/') ? err(403, 'not_authenticated', 'x') : undefined))
    renderApp('/admin/materiales')
    expect(await screen.findByRole('heading', { name: /acceso del profesor/i })).toBeInTheDocument()
  })
})

describe('gestión de asignaturas', () => {
  const sess = (extra: (u: URL, i: RequestInit) => { status?: number; body?: unknown } | undefined) => (u: URL, i: RequestInit) => {
    if (u.pathname.endsWith('/me/')) return { body: teacher }
    return extra(u, i)
  }
  const subj = { id: 1, name: 'Metrología', slug: 'metrologia', description: '', image_url: null, is_published: false, display_order: 0, category_count: 0, created_at: '', updated_at: '' }

  it('muestra estado vacío', async () => {
    mockFetch(sess((u) => (u.pathname.endsWith('/admin/subjects/') ? { body: page([]) } : undefined)))
    renderApp('/admin/asignaturas')
    expect(await screen.findByText(/aún no hay asignaturas/i)).toBeInTheDocument()
  })

  it('valida el formulario y crea una asignatura', async () => {
    const { calls } = mockFetch(sess((u, i) => {
      if (u.pathname.endsWith('/admin/subjects/') && i.method === 'POST') return { status: 201, body: { ...subj, name: 'Tribología' } }
      if (u.pathname.endsWith('/admin/subjects/')) return { body: page([subj]) }
    }))
    renderApp('/admin/asignaturas')
    await userEvent.click(await screen.findByRole('button', { name: /nueva asignatura/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nombre'), 'Tribología')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(calls.find((c) => c.init.method === 'POST')).toBeTruthy())
    expect(JSON.parse(String(calls.find((c) => c.init.method === 'POST')!.init.body))).toMatchObject({ name: 'Tribología', is_published: false })
    expect(await screen.findByText('Asignatura creada')).toBeInTheDocument()
  })

  it('pide confirmación antes de eliminar y muestra el error del backend', async () => {
    const { calls } = mockFetch(sess((u, i) => {
      if (u.pathname.endsWith('/admin/subjects/1/') && i.method === 'DELETE') return err(409, 'protected', 'No se puede eliminar: tiene elementos asociados.')
      if (u.pathname.endsWith('/admin/subjects/')) return { body: page([subj]) }
    }))
    renderApp('/admin/asignaturas')
    await userEvent.click(await screen.findByRole('button', { name: /eliminar metrología/i }))
    expect(calls.some((c) => c.init.method === 'DELETE')).toBe(false)
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText(/tiene elementos asociados/i)).toBeInTheDocument()
  })

  it('materiales: pide crear una categoría primero si no existe ninguna', async () => {
    mockFetch(sess((u) => (u.pathname.endsWith('/admin/categories/') ? { body: page([]) } : u.pathname.endsWith('/admin/materials/') ? { body: page([]) } : undefined)))
    renderApp('/admin/materiales')
    expect(await screen.findByText(/primero crea una categoría/i)).toBeInTheDocument()
  })

  it('materiales: valida el archivo y el título antes de subir', async () => {
    const cat = { id: 1, subject: 1, subject_name: 'Metrología', name: 'Calibres', slug: 'c', description: '', display_order: 0, is_published: true, material_count: 0 }
    const { calls } = mockFetch(sess((u) => (u.pathname.endsWith('/admin/categories/') ? { body: page([cat]) } : u.pathname.endsWith('/admin/materials/') ? { body: page([]) } : undefined)))
    renderApp('/admin/materiales')
    await userEvent.click(await screen.findByRole('button', { name: /subir material/i }))
    await userEvent.click(await screen.findByRole('button', { name: /^subir material$/i, hidden: false }).catch(() => screen.getAllByRole('button', { name: /subir material/i }).at(-1)!))
    expect(await screen.findByText(/el título es obligatorio/i)).toBeInTheDocument()
    expect(calls.some((c) => c.init.method === 'POST')).toBe(false)
  })
})
