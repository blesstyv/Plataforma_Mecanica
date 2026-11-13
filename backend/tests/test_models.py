import pytest
from django.db import IntegrityError
from django.db.models import ProtectedError

from apps.categories.models import Category
from apps.subjects.models import Subject


def test_category_slug_unique_per_subject(subject, category):
    other = Subject.objects.create(name="CNC", slug="cnc")
    Category.objects.create(subject=other, name="SMAW", slug="smaw")  # mismo slug, otra asignatura: ok
    with pytest.raises(IntegrityError):
        Category.objects.create(subject=subject, name="Otra", slug="smaw")


def test_subject_with_categories_is_protected(subject, category):
    with pytest.raises(ProtectedError):
        subject.delete()


def test_password_not_plaintext(teacher):
    assert teacher.password != "Clave-segura-123" and teacher.check_password("Clave-segura-123")


def test_public_querysets_hide_unpublished(subject, category, published_material):
    from apps.materials.models import Material

    assert Material.objects.public().count() == 1
    subject.is_published = False
    subject.save()
    assert Material.objects.public().count() == 0
    assert Category.objects.public().count() == 0
