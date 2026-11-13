# API REST v1

Base: `/api/v1/`. Esquema OpenAPI: `/api/schema/` · Swagger UI: `/api/docs/`. Paginación: `?page=&page_size=` (máx. 100) → `{count,next,previous,results}`.
Filtros comunes: `?search=`, `?ordering=` (prefijo `-` para descendente).

## Errores
```json
{"error": {"code": "validation_error", "message": "Ya existe …", "details": {"name": ["…"]}}}
```
`400` validación · `401/403` sin sesión/permiso · `404` · `409` eliminación protegida · `429` demasiados intentos de login.

## Autenticación (sesión + CSRF)
| Método | Ruta | Notas |
|---|---|---|
| GET | `/auth/csrf/` | Establece la cookie `csrftoken` |
| POST | `/auth/login/` | `{username,password}`; exige `X-CSRFToken`; solo `is_staff`; bloqueo tras `LOGIN_MAX_FAILURES` intentos |
| POST | `/auth/logout/` | 204 |
| GET | `/auth/me/` | Usuario actual |

Toda petición que modifica datos debe enviar `X-CSRFToken` (valor de la cookie `csrftoken`).

## Público (solo contenido publicado)
| Ruta | Descripción |
|---|---|
| `GET /subjects/` · `GET /subjects/{slug}/` | Asignaturas (detalle incluye categorías con conteo) · `/subjects/{slug}/image/` |
| `GET /categories/?subject__slug=` | Categorías publicadas |
| `GET /materials/` | Filtros: `subject`, `category`, `file_type`, `search`, `ordering` (`created_at`, `title`, `file_size`) |
| `GET /materials/{id}/` | Metadatos (sin claves de almacenamiento) |
| `GET /materials/{id}/file/` | Visualizar; `?download=1` fuerza descarga (403 si `allow_download=false`) |
| `GET /materials/{id}/preview/` | PDF de vista previa (404 si no existe) |

## Administración (requiere sesión de profesor; 401/403 en otro caso)
| Ruta | Descripción |
|---|---|
| `GET /admin/dashboard/` | Totales y últimos 5 materiales |
| `/admin/subjects/` CRUD · `POST/DELETE /admin/subjects/{id}/image/` | Asignaturas |
| `/admin/categories/` CRUD | Filtros `subject`, `is_published` |
| `/admin/materials/` CRUD (multipart al crear: `category,title,description,file,preview_file?,allow_download,status`) | Filtros `status`, `subject`, `category_id`, `file_type` |
| `POST /admin/materials/{id}/publish/` · `unpublish/` | Cambia estado |
| `POST /admin/materials/{id}/replace-file/` (`file`) | Reemplaza el archivo y borra el anterior |
| `POST/DELETE /admin/materials/{id}/preview-file/` | Adjunta/quita PDF de vista previa |
| `GET /admin/materials/{id}/file/` · `preview/` | El profesor puede ver borradores |

Permisos: público = `AllowAny` sobre querysets `.public()`; administración = `IsTeacher` (`is_authenticated ∧ is_active ∧ is_staff`).
