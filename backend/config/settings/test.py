from .local import *  # noqa: F401,F403
import tempfile
from pathlib import Path

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
PRIVATE_MEDIA_ROOT = Path(tempfile.mkdtemp(prefix="mecanica_test_media_"))
STORAGES["default"] = {  # noqa: F405
    "BACKEND": "django.core.files.storage.FileSystemStorage",
    "OPTIONS": {"location": str(PRIVATE_MEDIA_ROOT), "base_url": None},
}
REST_FRAMEWORK = {**REST_FRAMEWORK, "DEFAULT_THROTTLE_CLASSES": []}  # noqa: F405
MIDDLEWARE = [m for m in MIDDLEWARE if "whitenoise" not in m]  # noqa: F405
