export class ApiError extends Error {
  status: number
  code: string
  details: Record<string, unknown>
  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

const BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

function csrfToken(): string {
  const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

type Query = Record<string, string | number | boolean | undefined | null>

export function qs(params?: Query): string {
  if (!params) return ''
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json()
    const e = body?.error
    if (e) return new ApiError(res.status, e.code, e.message, e.details ?? {})
  } catch {
    /* cuerpo no JSON */
  }
  const fallback: Record<number, string> = {
    401: 'Tu sesión no es válida. Inicia sesión de nuevo.',
    403: 'No tienes permiso para realizar esta acción.',
    404: 'No se encontró el recurso solicitado.',
    413: 'El archivo es demasiado grande.',
    429: 'Demasiadas solicitudes. Inténtalo más tarde.',
  }
  return new ApiError(res.status, 'http_error', fallback[res.status] ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.')
}

export async function request<T>(method: string, path: string, opts: { body?: unknown; params?: Query } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined
  if (opts.body instanceof FormData) body = opts.body
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }
  if (method !== 'GET') headers['X-CSRFToken'] = csrfToken()
  let res: Response
  try {
    res = await fetch(`${BASE}${path}${qs(opts.params)}`, { method, headers, body, credentials: 'same-origin' })
  } catch {
    throw new ApiError(0, 'network_error', 'No se pudo conectar con el servidor. Revisa tu conexión.')
  }
  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, params?: Query) => request<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}

export function fileUrl(id: number, opts: { download?: boolean; preview?: boolean; admin?: boolean } = {}): string {
  const base = `${BASE}${opts.admin ? '/admin' : ''}/materials/${id}/${opts.preview ? 'preview' : 'file'}/`
  return opts.download ? `${base}?download=1` : base
}

/** Subida con progreso real (fetch no expone progreso de subida). */
export function upload<T>(method: string, path: string, form: FormData, onProgress?: (pct: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, `${BASE}${path}`)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.setRequestHeader('X-CSRFToken', csrfToken())
    xhr.withCredentials = true
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onerror = () => reject(new ApiError(0, 'network_error', 'No se pudo conectar con el servidor. Revisa tu conexión.'))
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve((xhr.status === 204 ? undefined : JSON.parse(xhr.responseText)) as T)
      const fake = new Response(xhr.responseText, { status: xhr.status })
      parseError(fake).then(reject)
    }
    xhr.send(form)
  })
}
