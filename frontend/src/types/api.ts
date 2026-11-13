export interface Page<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
}

export interface Subject {
  id: number
  name: string
  slug: string
  description: string
  image_url: string | null
  display_order: number
  category_count: number
  material_count: number
}

export interface PublicCategory {
  id: number
  subject: string
  subject_name: string
  name: string
  slug: string
  description: string
  display_order: number
  material_count: number
}

export interface SubjectDetail extends Subject {
  categories: PublicCategory[]
}

export interface Material {
  id: number
  title: string
  slug: string
  description: string
  subject_slug: string
  subject_name: string
  category: number
  category_slug: string
  category_name: string
  file_type: string
  original_filename: string
  file_size: number
  allow_download: boolean
  has_preview: boolean
  viewable: boolean
  created_at: string
  updated_at: string
}

export interface AdminSubject {
  id: number
  name: string
  slug: string
  description: string
  image_url: string | null
  is_published: boolean
  display_order: number
  category_count: number
  created_at: string
  updated_at: string
}

export interface AdminCategory {
  id: number
  subject: number
  subject_name: string
  name: string
  slug: string
  description: string
  display_order: number
  is_published: boolean
  material_count: number
}

export interface AdminMaterial extends Material {
  status: 'draft' | 'published'
  mime_type: string
}

export interface Dashboard {
  subjects: number
  categories: number
  materials: number
  published: number
  drafts: number
  recent_materials: AdminMaterial[]
}
