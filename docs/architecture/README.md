# Arquitectura

Monolito modular con API REST. El navegador solo habla con la API; PostgreSQL y el almacenamiento de objetos nunca se exponen directamente.

```
Navegador ──► Vercel (React SPA) ──/api/*──► Render (Django + DRF) ──► PostgreSQL
                                                    └──► Supabase Storage / S3 compatible (bucket privado, URLs firmadas)
```

## Módulos del backend (`backend/apps`)

| App | Responsabilidad |
|---|---|
| `accounts` | Usuario personalizado (`AbstractUser`), login/logout/me por **sesión**, bloqueo por intentos fallidos, comando `create_teacher` |
| `subjects` | `Subject`: asignaturas + imagen opcional; API pública y administrativa |
| `categories` | `Category`: unidades dentro de una asignatura (slug único por asignatura) |
| `materials` | `Material`: metadatos, estado draft/published, permiso de descarga; `services.py` concentra la lógica de negocio |
| `audit` | `AuditLog` de operaciones administrativas (crear/editar/eliminar/publicar/login…) |
| `core` | Validación y entrega de archivos (`files.py`), permisos, errores uniformes, paginación, slugs, dashboard, enrutado `/api/v1/` |

Capas: *vistas/serializadores* (HTTP, validación) → *services* (reglas de negocio) → *modelos* (persistencia) → *core.files* (almacenamiento). En el frontend: *pages* → *services* (HTTP, `lib/api.ts`) → *TanStack Query* (estado del servidor); componentes reutilizables en `components/ui`.

## Modelo de datos

```
User 1─* Material(uploaded_by, SET_NULL)         User 1─* AuditLog(actor, SET_NULL)
Subject 1─* Category(PROTECT) 1─* Material(PROTECT)
```
- `Category`: `UNIQUE(subject, slug)` y `UNIQUE(subject, name)`.
- `Material`: `UNIQUE(category, slug)`; `status ∈ {draft, published}`; `file_key`/`preview_key` son claves de objeto (los bytes viven en el almacenamiento, no en PostgreSQL).
- Eliminación **controlada**: `PROTECT` impide borrar asignaturas con categorías o categorías con materiales (la API responde 409 con mensaje claro). Borrar un material elimina también sus archivos.
- Un material es **público** solo si: `status=published` ∧ categoría publicada ∧ asignatura publicada (`Material.objects.public()`), de modo que ocultar una asignatura oculta todo su contenido.
- Extensible: unidades/lecciones/evaluaciones pueden colgar de `Category`/`Material` sin romper el esquema.

## Decisiones técnicas

1. **Autenticación por sesión de Django + CSRF**, sin tokens en `localStorage`. Para que funcione con Vercel y Render en dominios distintos sin depender de cookies de terceros, el frontend **proxifica `/api/*` hacia Render** (rewrite de Vercel): para el navegador todo es *mismo origen* y las cookies son de primera parte (`SameSite=Lax`, `Secure`, `HttpOnly` para la sesión). En desarrollo, el proxy de Vite cumple el mismo papel.
2. **Archivos privados**: ningún enlace público. `GET /materials/{id}/file/` verifica publicación y permiso; en producción responde 302 a una URL firmada del bucket (o streaming con `S3_SERVE_MODE=stream`) (5 min por defecto, con `Content-Disposition`); en local transmite el archivo. Los borradores devuelven 404.
3. **Validación de archivos** sin dependencias nativas: lista blanca de extensiones, comprobación del contenido real (firmas PDF/PNG/JPEG; estructura OOXML para DOCX/PPTX), tamaño máximo configurable, nombre saneado y clave de almacenamiento UUID.
4. **PPTX/DOCX**: el navegador no los renderiza; el profesor adjunta un **PDF de vista previa** (`preview_key`) que se muestra en el visor. Sin PDF, se ofrece solo descarga (si está permitida). No se usa conversión automática para no depender de LibreOffice en Render.
5. **Visor PDF/imagen** nativo del navegador (`<iframe>`/`<img>`, mismo origen; `X_FRAME_OPTIONS=SAMEORIGIN`). Evita un bundle de PDF.js; coste: sin controles personalizados.
6. **Sin Celery/Redis**. El bloqueo de login usa caché local (por proceso); ver limitaciones.
7. Errores uniformes `{"error": {"code", "message", "details"}}`.
