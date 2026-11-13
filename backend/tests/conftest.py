import io
import zipfile

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.materials.models import Material
from apps.subjects.models import Subject

PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


def make_zip(folder):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("[Content_Types].xml", "<Types/>")
        z.writestr(f"{folder}/document.xml", "<x/>")
    return buf.getvalue()


def pdf_file(name="guia.pdf"):
    return SimpleUploadedFile(name, PDF, content_type="application/pdf")


def docx_file(name="notas.docx"):
    return SimpleUploadedFile(name, make_zip("word"))


def pptx_file(name="clase.pptx"):
    return SimpleUploadedFile(name, make_zip("ppt"))


@pytest.fixture
def teacher(db):
    return get_user_model().objects.create_user("profe", password="Clave-segura-123", is_staff=True)


@pytest.fixture
def student_user(db):
    return get_user_model().objects.create_user("alumno", password="Clave-segura-123")


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def teacher_api(teacher):
    c = APIClient()
    c.force_login(teacher)
    return c


@pytest.fixture
def subject(db):
    return Subject.objects.create(name="Soldadura", slug="soldadura", is_published=True)


@pytest.fixture
def category(subject):
    return Category.objects.create(subject=subject, name="SMAW", slug="smaw", is_published=True)


@pytest.fixture
def published_material(category, teacher):
    from apps.materials.services import create_material

    return create_material(teacher, {"category": category, "title": "Guía SMAW", "file": pdf_file(), "status": "published", "allow_download": True})
