from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Usuario personalizado desde el inicio. El profesor es `is_staff`."""

    class Meta:
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"
