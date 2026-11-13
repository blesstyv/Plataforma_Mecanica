import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Crea (o actualiza) la cuenta del profesor. Contraseña vía --password o DJANGO_TEACHER_PASSWORD."

    def add_arguments(self, parser):
        parser.add_argument("--username", default=os.environ.get("DJANGO_TEACHER_USERNAME", "profesor"))
        parser.add_argument("--email", default=os.environ.get("DJANGO_TEACHER_EMAIL", ""))
        parser.add_argument("--password", default=os.environ.get("DJANGO_TEACHER_PASSWORD"))

    def handle(self, *args, **o):
        if not o["password"]:
            raise CommandError("Indica la contraseña con --password o DJANGO_TEACHER_PASSWORD.")
        User = get_user_model()
        user, created = User.objects.get_or_create(username=o["username"], defaults={"email": o["email"]})
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(o["password"])
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Profesor '{user.username}' {'creado' if created else 'actualizado'}."))
