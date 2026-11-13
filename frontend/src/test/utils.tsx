import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/hooks/useAuth'
import { routes } from '@/routes'

type Handler = (url: URL, init: RequestInit) => { status?: number; body?: unknown } | undefined

/** Simula fetch: el primer handler que devuelva respuesta gana. */
export function mockFetch(handler: Handler) {
  const calls: { url: URL; init: RequestInit }[] = []
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input), 'http://localhost')
    calls.push({ url, init })
    const r = handler(url, init) ?? { status: 404, body: { error: { code: 'not_found', message: 'No encontrado', details: {} } } }
    return new Response(r.status === 204 ? null : JSON.stringify(r.body ?? {}), { status: r.status ?? 200, headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fn)
  return { fn, calls }
}

export const page = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results })

export function renderApp(path: string, extra?: RouteObject[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(extra ?? routes, { initialEntries: [path] })
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider><ToastProvider><RouterProvider router={router} /></ToastProvider></AuthProvider>
    </QueryClientProvider>,
  )
}

export const teacher = { id: 1, username: 'profe', email: '', first_name: 'Raúl', last_name: '', is_staff: true }
export const err = (status: number, code: string, message: string) => ({ status, body: { error: { code, message, details: {} } } })
