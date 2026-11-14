#!/usr/bin/env bash
# Comando de build en Render: dependencias, estáticos y migraciones.
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
# Render gratis no ofrece Shell: el profesor se crea/actualiza aquí desde variables de entorno.
if [ -n "${DJANGO_TEACHER_USERNAME:-}" ] && [ -n "${DJANGO_TEACHER_PASSWORD:-}" ]; then
  python manage.py create_teacher
fi
