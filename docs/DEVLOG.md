# Registro de desarrollo

## Implementado y verificado
- **Backend**: usuario personalizado; modelos `Subject`, `Category`, `Material`, `AuditLog` con migraciones; API `/api/v1/` pública y administrativa; sesión + CSRF; bloqueo de fuerza bruta; validación real de archivos; reemplazo de archivos; PDF de vista previa para PPTX/DOCX; publicación/despublicación; dashboard; OpenAPI; Django Admin como respaldo; comandos `create_teacher` y `seed_subjects`.
- **Frontend**: portal público (inicio, asignaturas, detalle, biblioteca con búsqueda/filtros/orden/paginación, detalle con visor y descarga) y panel del profesor (login, dashboard, CRUD de asignaturas/categorías/materiales, subida con progreso, publicar, vista previa, confirmaciones). Modo claro/oscuro completo, responsive, skip-link, foco visible, `prefers-reduced-motion`.
- **Infra preparada**: `render.yaml`, `backend/build.sh`, `frontend/vercel.json`, CI en GitHub Actions, `.env.example`.

## Pruebas ejecutadas (resultado real, 2026-11-13)
| Suite | Resultado |
|---|---|
| `pytest` (PostgreSQL 16) | **40 pasan** |
| `vitest` | **24 pasan** |
| Playwright E2E (Chromium, Django+PostgreSQL reales) | **7 pasan**: acceso protegido, login erróneo, crear asignatura→categoría→subir→publicar, rechazo de extensión inválida, visitante busca/visualiza/descarga, despublicar revoca acceso (404), sin desbordamiento horizontal a 375/820/1366 px |
| `tsc -b` / `vite build` | sin errores |
| `npm audit` / `pip-audit` | 0 vulnerabilidades conocidas |
| `manage.py check --deploy` | solo avisos asumidos: `X_FRAME_OPTIONS=SAMEORIGIN` (necesario para el visor), HSTS preload |

## Problemas encontrados y corregidos
- DRF interpretaba un booleano ausente en multipart como `False` (descarga desactivada por defecto) → `default=True` explícito + prueba.
- Respuestas 401/429 del login sin el formato de error uniforme → corregido.
- Health check de Render redirigiría a HTTPS → exento en producción.

## Limitaciones conocidas
- **No se desplegó** en Vercel/Render/R2 (requieren tus cuentas/credenciales y pueden tener costo). La integración R2 está implementada pero **no se probó contra un bucket real** (solo disco local).
- **Estilo de referencia (Refero)**: `styles.refero.design` no era accesible desde el entorno; se aplicó la identidad indicada en el brief (azul profundo, grafito, cian). Pendiente cotejar con esa referencia.
- Orden de asignaturas/categorías mediante campo numérico (no arrastrar y soltar).
- El bloqueo de login usa caché en memoria por proceso: con varios workers el contador no se comparte. Además, un atacante podría bloquear temporalmente la cuenta del profesor (usuario+IP). Para producción seria, usar caché compartida (p. ej. base de datos).
- PDFs/imágenes se muestran con el visor nativo del navegador; sin paginación ni zoom propios. La descarga/visualización no protege contra copia.
- Subir archivos grandes pasa por el servidor Django (límite 50 MB configurable); subida directa a R2 con URL prefirmada sería la mejora.
- No hay pruebas E2E en móvil más allá del chequeo de desbordamiento; no se ejecutó auditoría automática de accesibilidad (axe).
- El repositorio es **público**: no subas material real hasta decidir su visibilidad (los archivos viven en R2, no en Git).

## Futuro
Unidades/lecciones, cuestionarios y progreso del estudiante, videos, simuladores, modelos 3D, reordenamiento por arrastre, subida directa a R2, conversión PPTX→PDF automática, analítica real de visitas.
