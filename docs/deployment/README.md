# Despliegue

> Estado: **preparado, no desplegado**. Ningún recurso externo se creó. Lo siguiente requiere tus cuentas y credenciales.

## 1. Cloudflare R2 (archivos)
1. Cloudflare → R2 → *Create bucket* (p. ej. `mecanilab-files`). **Déjalo privado** (sin dominio público ni r2.dev).
2. R2 → *Manage API tokens* → *Create API token* con permiso **Object Read & Write** limitado a ese bucket. Copia *Access Key ID* y *Secret Access Key* (se muestran una vez).
3. Anota el *Account ID*: `S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
4. Si usarás el visor desde un origen distinto al proxy, no necesitas CORS en el bucket: el `<iframe>` y las descargas navegan directamente a la URL firmada. Si más adelante haces `fetch` desde el navegador, añade una regla CORS con tu dominio.

Variables: `USE_S3=True`, `S3_BUCKET_NAME`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION=auto`.

## 2. Render (API + PostgreSQL)
1. Render → *New → Blueprint* → conecta `blesstyv/Plataforma_Mecanica` (usa [`render.yaml`](../../render.yaml)). Revisa el plan de la base de datos (puede tener costo).
2. Completa las variables `sync:false`: `DJANGO_ALLOWED_HOSTS` (host de Render **y** el de Vercel, separados por comas), `CSRF_TRUSTED_ORIGINS` y `CORS_ALLOWED_ORIGINS` (`https://<tu-app>.vercel.app`) y las 4 de R2. `DJANGO_SECRET_KEY` y `DATABASE_URL` se generan solos.
3. El build ejecuta `backend/build.sh` (instala, `collectstatic`, `migrate`). Health check: `/health/`.
4. Crea el profesor en *Shell* de Render: `python manage.py create_teacher --username profesor` (con `DJANGO_TEACHER_PASSWORD` definida temporalmente, o `--password`). Opcional: `python manage.py seed_subjects --publish`.

## 3. Vercel (frontend)
1. Importa el repositorio, **Root Directory = `frontend`** (Vite se detecta solo).
2. Edita [`frontend/vercel.json`](../../frontend/vercel.json): reemplaza `REEMPLAZAR-HOST-DE-RENDER.onrender.com` por el host real de Render. Ese rewrite hace que `/api/*` sea *mismo origen* (cookies de primera parte). Si se despliega sin cambiarlo, la API no responderá.
3. Si Vercel envía el `Host` original en el proxy, añade ese dominio a `DJANGO_ALLOWED_HOSTS`.

## 4. Verificación posterior
- `https://<render>/health/` → `{"status":"ok"}`.
- Abre el sitio de Vercel: portada y asignaturas cargan; `/admin` pide login; inicia sesión; crea asignatura → categoría → sube PDF → publica; ábrelo en ventana privada; despublica y confirma 404.
- Comprueba en DevTools que `sessionid` es `HttpOnly; Secure`.

## Respaldo y recuperación
- PostgreSQL: usa los backups automáticos del plan de Render y un `pg_dump` periódico (`pg_dump "$DATABASE_URL" -Fc -f backup.dump`); restaura con `pg_restore -d <nueva_url> backup.dump`.
- R2: activa *Object Versioning* o replica con `rclone sync` a otro bucket. La base guarda solo claves: restaurar BD + bucket reconstruye el sistema.
- Recuperación total: nuevo servicio Render con el mismo `render.yaml`, mismas variables, restaurar BD, apuntar al bucket.

## Seguridad en producción (ya aplicada en `config/settings/production.py`)
`DEBUG=False`, HTTPS forzado + HSTS, cookies `Secure`, `SECRET_KEY` y `USE_S3` obligatorios, CORS/CSRF restringidos a orígenes explícitos, logs a stdout.
