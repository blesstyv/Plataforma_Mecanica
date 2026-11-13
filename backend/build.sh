#!/usr/bin/env bash
# Comando de build en Render: dependencias, estáticos y migraciones.
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
