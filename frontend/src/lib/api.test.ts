import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, fileUrl, qs } from './api'
import { mockFetch } from '@/test/utils'

afterEach(() => vi.unstubAllGlobals())

describe('api', () => {
  it('construye query strings omitiendo vacíos', () => {
    expect(qs({ a: 1, b: '', c: undefined, d: 'x y' })).toBe('?a=1&d=x+y')
    expect(qs({})).toBe('')
  })

  it('lanza ApiError con el mensaje del backend', async () => {
    mockFetch(() => ({ status: 400, body: { error: { code: 'validation_error', message: 'Nombre duplicado', details: { name: ['x'] } } } }))
    await expect(api.post('/x/', {})).rejects.toMatchObject({ status: 400, code: 'validation_error', message: 'Nombre duplicado' })
  })

  it('usa un mensaje comprensible si la respuesta no es JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 403 })))
    await expect(api.get('/x/')).rejects.toThrow(/permiso/)
  })

  it('reporta error de red', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fail') }))
    const e = (await api.get('/x/').catch((x) => x)) as ApiError
    expect(e).toBeInstanceOf(ApiError)
    expect(e.code).toBe('network_error')
  })

  it('envía el token CSRF solo en métodos que modifican', async () => {
    document.cookie = 'csrftoken=abc123'
    const { calls } = mockFetch(() => ({ body: {} }))
    await api.get('/a/')
    await api.post('/b/', {})
    expect((calls[0].init.headers as Record<string, string>)['X-CSRFToken']).toBeUndefined()
    expect((calls[1].init.headers as Record<string, string>)['X-CSRFToken']).toBe('abc123')
    expect(calls[1].init.credentials).toBe('same-origin')
  })

  it('arma URLs de archivos', () => {
    expect(fileUrl(3)).toBe('/api/v1/materials/3/file/')
    expect(fileUrl(3, { download: true })).toBe('/api/v1/materials/3/file/?download=1')
    expect(fileUrl(3, { preview: true, admin: true })).toBe('/api/v1/admin/materials/3/preview/')
  })
})
