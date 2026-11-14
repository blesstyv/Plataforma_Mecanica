import os

from django.core.files.uploadedfile import SimpleUploadedFile

from tests.conftest import docx_file, pdf_file, pptx_file


def up(client, category, f, **extra):
    return client.post("/api/v1/admin/materials/", {"category": category.pk, "title": "T", "file": f, **extra}, format="multipart")


def test_rejects_bad_extension(teacher_api, category):
    r = up(teacher_api, category, SimpleUploadedFile("virus.exe", b"MZ..."))
    assert r.status_code == 400 and "no permitido" in r.json()["error"]["message"]


def test_rejects_fake_pdf(teacher_api, category):
    r = up(teacher_api, category, SimpleUploadedFile("falso.pdf", b"esto no es un pdf"))
    assert r.status_code == 400 and "no corresponde" in r.json()["error"]["message"]


def test_rejects_fake_docx(teacher_api, category):
    assert up(teacher_api, category, SimpleUploadedFile("x.docx", b"PK\x03\x04basura")).status_code == 400


def test_rejects_empty_and_oversized(teacher_api, category, settings):
    assert up(teacher_api, category, SimpleUploadedFile("a.pdf", b"")).status_code == 400
    settings.MAX_UPLOAD_MB = 0
    assert up(teacher_api, category, pdf_file()).status_code == 400


def test_accepts_office_and_images(teacher_api, category):
    assert up(teacher_api, category, docx_file()).status_code == 201
    assert up(teacher_api, category, pptx_file()).status_code == 201
    png = SimpleUploadedFile("i.png", b"\x89PNG\r\n\x1a\n" + b"0" * 20)
    assert up(teacher_api, category, png).status_code == 201


def test_path_traversal_filename_sanitized(teacher_api, category):
    r = up(teacher_api, category, SimpleUploadedFile("../../etc/passwd.pdf", pdf_file().read()))
    assert r.status_code == 201 and "/" not in r.data["original_filename"] and ".." not in r.data["original_filename"]


def test_pptx_preview_pdf(teacher_api, category, api):
    r = up(teacher_api, category, pptx_file(), preview_file=pdf_file("p.pdf"), status="published")
    assert r.status_code == 201 and r.data["has_preview"] and r.data["viewable"]
    resp = api.get(f"/api/v1/materials/{r.data['id']}/preview/")
    assert resp.status_code == 200 and resp["Content-Type"] == "application/pdf"
    assert api.get(f"/api/v1/materials/{r.data['id']}/file/").status_code == 200  # pptx se entrega como adjunto


def test_storage_key_is_unique_and_not_exposed(teacher_api, category):
    a = up(teacher_api, category, pdf_file()).data
    b = up(teacher_api, category, pdf_file()).data
    from apps.materials.models import Material

    assert Material.objects.get(pk=a["id"]).file_key != Material.objects.get(pk=b["id"]).file_key
    assert "file_key" not in a


def test_physical_file_removed_on_delete(teacher_api, category):
    from django.core.files.storage import default_storage

    from apps.materials.models import Material

    mid = up(teacher_api, category, pdf_file()).data["id"]
    key = Material.objects.get(pk=mid).file_key
    assert default_storage.exists(key)
    teacher_api.delete(f"/api/v1/admin/materials/{mid}/")
    assert not default_storage.exists(key)


def test_s3_stream_mode_serves_through_django(published_material, settings, api):
    """Con S3_SERVE_MODE=stream la entrega pasa por Django (sin redirigir al bucket)."""
    settings.USE_S3 = True
    settings.S3_SERVE_MODE = "stream"
    r = api.get(f"/api/v1/materials/{published_material.pk}/file/")
    assert r.status_code == 200 and b"%PDF-" in b"".join(r.streaming_content)
