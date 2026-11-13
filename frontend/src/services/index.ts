import { api, request, upload } from '@/lib/api'
import type {
  AdminCategory, AdminMaterial, AdminSubject, Dashboard, Material, Page, PublicCategory, Subject, SubjectDetail, User,
} from '@/types/api'

export type Params = Record<string, string | number | boolean | undefined | null>

export const authService = {
  csrf: () => api.get<unknown>('/auth/csrf/'),
  me: () => api.get<User>('/auth/me/'),
  login: async (username: string, password: string) => {
    await authService.csrf()
    return api.post<User>('/auth/login/', { username, password })
  },
  logout: () => api.post<void>('/auth/logout/'),
}

export const publicService = {
  subjects: (p?: Params) => api.get<Page<Subject>>('/subjects/', { page_size: 50, ...p }),
  subject: (slug: string) => api.get<SubjectDetail>(`/subjects/${slug}/`),
  categories: (p?: Params) => api.get<Page<PublicCategory>>('/categories/', p),
  materials: (p?: Params) => api.get<Page<Material>>('/materials/', p),
  material: (id: number | string) => api.get<Material>(`/materials/${id}/`),
}

function crud<T, W>(resource: string) {
  return {
    list: (p?: Params) => api.get<Page<T>>(`/admin/${resource}/`, { page_size: 100, ...p }),
    create: (data: W) => api.post<T>(`/admin/${resource}/`, data),
    update: (id: number, data: Partial<W>) => api.patch<T>(`/admin/${resource}/${id}/`, data),
    remove: (id: number) => api.delete(`/admin/${resource}/${id}/`),
  }
}

export const adminService = {
  dashboard: () => api.get<Dashboard>('/admin/dashboard/'),
  subjects: {
    ...crud<AdminSubject, Pick<AdminSubject, 'name' | 'description' | 'is_published' | 'display_order'>>('subjects'),
    setImage: (id: number, file: File) => {
      const f = new FormData()
      f.append('file', file)
      return request<AdminSubject>('POST', `/admin/subjects/${id}/image/`, { body: f })
    },
    removeImage: (id: number) => request<AdminSubject>('DELETE', `/admin/subjects/${id}/image/`),
  },
  categories: crud<AdminCategory, Pick<AdminCategory, 'subject' | 'name' | 'description' | 'is_published' | 'display_order'>>('categories'),
  materials: {
    ...crud<AdminMaterial, never>('materials'),
    get: (id: number) => api.get<AdminMaterial>(`/admin/materials/${id}/`),
    create: (form: FormData, onProgress?: (n: number) => void) => upload<AdminMaterial>('POST', '/admin/materials/', form, onProgress),
    update: (id: number, data: Partial<Pick<AdminMaterial, 'title' | 'description' | 'category' | 'allow_download' | 'status'>>) =>
      api.patch<AdminMaterial>(`/admin/materials/${id}/`, data),
    publish: (id: number) => api.post<AdminMaterial>(`/admin/materials/${id}/publish/`),
    unpublish: (id: number) => api.post<AdminMaterial>(`/admin/materials/${id}/unpublish/`),
    replaceFile: (id: number, file: File, onProgress?: (n: number) => void) => {
      const f = new FormData()
      f.append('file', file)
      return upload<AdminMaterial>('POST', `/admin/materials/${id}/replace-file/`, f, onProgress)
    },
    setPreview: (id: number, file: File, onProgress?: (n: number) => void) => {
      const f = new FormData()
      f.append('file', file)
      return upload<AdminMaterial>('POST', `/admin/materials/${id}/preview-file/`, f, onProgress)
    },
    removePreview: (id: number) => api.delete<AdminMaterial>(`/admin/materials/${id}/preview-file/`),
  },
}
