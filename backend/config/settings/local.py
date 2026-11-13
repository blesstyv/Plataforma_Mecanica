from .base import *  # noqa: F401,F403
from .base import env

DEBUG = True
SECRET_KEY = SECRET_KEY or "insecure-local-only-key-do-not-use-in-production"  # noqa: F405
CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS or ["http://localhost:5173", "http://127.0.0.1:5173"]  # noqa: F405
CSRF_TRUSTED_ORIGINS = CSRF_TRUSTED_ORIGINS or ["http://localhost:5173", "http://127.0.0.1:5173"]  # noqa: F405
STORAGES["staticfiles"] = {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"}  # noqa: F405
