from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import SECRET_KEY, USE_S3, env, env_bool

DEBUG = False
if not SECRET_KEY or len(SECRET_KEY) < 40:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY es obligatoria (>= 40 caracteres) en producción.")
if not USE_S3:
    raise ImproperlyConfigured("USE_S3=True es obligatorio en producción (el disco del contenedor es efímero).")

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
SECURE_REDIRECT_EXEMPT = [r"^health/$"]  # el health check interno no sigue redirecciones
_render_host = env("RENDER_EXTERNAL_HOSTNAME")
if _render_host and _render_host not in ALLOWED_HOSTS:  # noqa: F405
    ALLOWED_HOSTS.append(_render_host)  # noqa: F405
SECURE_HSTS_SECONDS = int(env("SECURE_HSTS_SECONDS", "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# Si el frontend y la API están en dominios distintos sin proxy, usar "None" (no recomendado).
SESSION_COOKIE_SAMESITE = env("SESSION_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SAMESITE = SESSION_COOKIE_SAMESITE
