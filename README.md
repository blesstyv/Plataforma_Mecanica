# MecaniLab · Plataforma Educativa de Mecánica Industrial

Plataforma web para que un docente organice, publique y comparta material de estudio (PDF, PPTX, DOCX, imágenes) por **asignatura → categoría/unidad → material**. Los alumnos entran sin registrarse; el profesor administra todo desde un panel propio.

## Tecnologías

| Capa | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS 4, TanStack Query, React Hook Form + Zod, Radix UI (diálogos), Lucide, Motion |
| Backend | Django 5.2 LTS, Django REST Framework, django-filter, drf-spectacular (OpenAPI), WhiteNoise, Gunicorn |
| Datos | PostgreSQL (psycopg 3) |
| Archivos | Disco privado local en desarrollo · S3 compatible (Cloudflare R2) en producción, con URLs firmadas temporales |
| Pruebas | pytest + pytest-django · Vitest + Testing Library · Playwright |
| Despliegue | Vercel (frontend) · Render (API + PostgreSQL) · Cloudflare R2 (archivos) |

## Requisitos

Python ≥ 3.12, Node.js ≥ 22, npm, PostgreSQL ≥ 16, Git. (Verificado con Python 3.13, Node 22, PostgreSQL 16.)

## Instalación y ejecución local

```bash
# 1) Base de datos (una vez)
createuser -P mecanica            # contraseña: la que pongas en DATABASE_URL
createdb -O mecanica plataforma_mecanica
```
```bash
# 2) Backend
cd backend
python -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env              # Windows: copy .env.example .env  → ajusta DATABASE_URL
python manage.py migrate
python manage.py create_teacher --username profesor --password "<contraseña-segura>"
python manage.py seed_subjects --publish   # opcional: 10 asignaturas sugeridas, sin contenido
python manage.py runserver        # http://127.0.0.1:8000
```
```bash
# 3) Frontend (otra terminal)
cd frontend
npm install
npm run dev                       # http://localhost:5173  (proxy /api → :8000)
```
Panel del profesor: <http://localhost:5173/admin> · Django Admin (respaldo): <http://127.0.0.1:8000/django-admin/> · Documentación OpenAPI: <http://127.0.0.1:8000/api/docs/>.

## Pruebas

```bash
cd backend  && pytest                      # 40 pruebas (modelos, auth, permisos, CRUD, archivos, API pública, flujo completo)
cd frontend && npm run typecheck && npm test   # 24 pruebas de componentes/servicios
cd frontend && npx playwright install chromium && npm run test:e2e   # 7 pruebas E2E (usa una BD aparte, plataforma_mecanica_e2e)
```
Para E2E: `createdb -O mecanica plataforma_mecanica_e2e` y exporta `E2E_PYTHON` con la ruta del Python del venv (por defecto `python`).

## Variables de entorno

Todas documentadas en [`backend/.env.example`](backend/.env.example). Los secretos **nunca** se versionan (`.env` está en `.gitignore`). En producción `DJANGO_SECRET_KEY` y `USE_S3=True` son obligatorios (la aplicación se niega a iniciar sin ellos).

## Estructura

```
backend/   config/ (settings base/local/production/test) · apps/{core,accounts,subjects,categories,materials,audit} · tests/
frontend/  src/{components,features,hooks,layouts,pages,routes,services,types,lib} · e2e/
docs/      architecture/ · api/ · deployment/ · DEVLOG.md
render.yaml · frontend/vercel.json · .github/workflows/ci.yml
```

## Documentación

- [Arquitectura y modelo de datos](docs/architecture/README.md)
- [API REST](docs/api/README.md)
- [Despliegue (Vercel, Render, PostgreSQL, R2)](docs/deployment/README.md)
- [Registro de desarrollo, limitaciones y futuro](docs/DEVLOG.md)
