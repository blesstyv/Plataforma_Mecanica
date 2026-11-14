# Despliegue gratuito y sin tarjeta (Supabase + Render + Vercel)

> Estado: **preparado, no desplegado**. Ningún recurso externo se creó.
> Condiciones de los planes gratuitos (verificar en cada sitio antes de registrarte): [Render](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026) no pide tarjeta; [Supabase](https://supabase.com/docs/guides/storage/uploads/file-limits) ofrece 1 GB de archivos y máx. 50 MB por archivo; Vercel Hobby es gratis.

## 1. Supabase (PostgreSQL + archivos)
1. Crea una cuenta en supabase.com y un proyecto (anota la contraseña de la base de datos y la **región**).
2. **Base de datos**: *Connect* → *Session pooler* → copia la cadena (`postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres`) y añade `?sslmode=require` al final. Usa el pooler: la conexión directa es solo IPv6 y puede fallar en Render.
3. **Archivos**: *Storage* → *New bucket* → nombre `materiales`, **privado** (Public OFF).
4. *Project Settings → Storage → S3 Connection*: copia el **Endpoint** (`https://<ref>.storage.supabase.co/storage/v1/s3`) y la **Región**; pulsa *New access key* y guarda *Access key ID* y *Secret access key* (el secreto se muestra una vez).

## 2. Render (API, plan Free)
1. render.com → cuenta con GitHub → *New → Blueprint* → repositorio, rama `main` (`render.yaml` ya usa `plan: free`).
2. Variables (solo en el panel):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | cadena del Session pooler (paso 1.2) |
| `S3_BUCKET_NAME` | `materiales` |
| `S3_ENDPOINT_URL` | endpoint del paso 1.4 |
| `S3_REGION` | región real del proyecto (p. ej. `us-east-1`) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | claves del paso 1.4 |
| `DJANGO_TEACHER_USERNAME` / `DJANGO_TEACHER_PASSWORD` | **tu usuario y contraseña de administrador** |
| `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS` | se completan tras Vercel (ver abajo) |

3. El build instala, migra y **crea/actualiza tu usuario administrador** desde esas dos variables (el plan gratuito no garantiza Shell). La contraseña se guarda cifrada en la base de datos.
4. Si las descargas fallan por URLs firmadas, define `S3_SERVE_MODE=stream`.
5. Limitaciones del plan gratuito: el servicio **se duerme tras 15 min sin visitas** (la primera visita tarda ~1 min); los archivos NO se pierden porque viven en Supabase.

## 3. Vercel (web, plan Hobby)
1. Edita `frontend/vercel.json`: reemplaza `REEMPLAZAR-HOST-DE-RENDER.onrender.com` por tu host de Render.
2. vercel.com → *Add New → Project* → repositorio, **Root Directory = `frontend`** → Deploy.
3. Vuelve a Render y completa: `DJANGO_ALLOWED_HOSTS` = `<host-render>,<app>.vercel.app`; `CSRF_TRUSTED_ORIGINS` y `CORS_ALLOWED_ORIGINS` = `https://<app>.vercel.app`.

## 4. Verificación posterior
- `https://<render>/health/` → `{"status":"ok"}`.
- Abre el sitio de Vercel: portada y asignaturas cargan; `/admin` pide login; inicia sesión; crea asignatura → categoría → sube PDF → publica; ábrelo en ventana privada; despublica y confirma 404.
- Comprueba en DevTools que `sessionid` es `HttpOnly; Secure`.

## Respaldo y recuperación
- PostgreSQL: usa los backups automáticos del plan de Render y un `pg_dump` periódico (`pg_dump "$DATABASE_URL" -Fc -f backup.dump`); restaura con `pg_restore -d <nueva_url> backup.dump`.
- Archivos: descarga periódicamente el bucket (Supabase Storage / `rclone` con la API S3) a tu equipo. La base guarda solo claves: restaurar BD + bucket reconstruye el sistema.
- Recuperación total: nuevo servicio Render con el mismo `render.yaml`, mismas variables, restaurar BD, apuntar al bucket.

## Seguridad en producción (ya aplicada en `config/settings/production.py`)
`DEBUG=False`, HTTPS forzado + HSTS, cookies `Secure`, `SECRET_KEY` y `USE_S3` obligatorios, CORS/CSRF restringidos a orígenes explícitos, logs a stdout.
