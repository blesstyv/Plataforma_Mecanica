from django.core.management.base import BaseCommand

from apps.core.slugs import unique_slug
from apps.subjects.models import Subject

DEFAULTS = [
    ("Soldadura SMAW y MIG", "Procesos de soldadura por arco manual y MIG: equipos, parámetros y técnica."),
    ("Máquinas y herramientas CNC", "Programación, operación y puesta a punto de máquinas de control numérico."),
    ("Medición y Verificación", "Instrumentos de medición y verificación dimensional en taller."),
    ("Metrología Industrial", "Fundamentos de metrología, tolerancias, calibración e incertidumbre."),
    ("Lectura e Interpretación de Planos", "Normas de dibujo técnico y lectura de planos de fabricación."),
    ("Mecanizado y Fresado", "Torneado, fresado y parámetros de corte."),
    ("Mantenimiento Industrial", "Mantenimiento preventivo, predictivo y correctivo de equipos."),
    ("Oleohidráulica y Neumática", "Circuitos, componentes y simbología de potencia fluida."),
    ("Tribología", "Fricción, desgaste y lubricación de elementos de máquinas."),
    ("Seguridad en Taller Mecánico", "Prevención de riesgos, EPP y normas de seguridad en taller."),
]


class Command(BaseCommand):
    help = "Crea las asignaturas iniciales sugeridas (sin contenido). Se crean como NO publicadas salvo --publish."

    def add_arguments(self, parser):
        parser.add_argument("--publish", action="store_true")

    def handle(self, *args, **o):
        n = 0
        for i, (name, desc) in enumerate(DEFAULTS):
            if Subject.objects.filter(name=name).exists():
                continue
            Subject.objects.create(name=name, slug=unique_slug(Subject, name), description=desc, display_order=i, is_published=o["publish"])
            n += 1
        self.stdout.write(self.style.SUCCESS(f"{n} asignaturas creadas."))
