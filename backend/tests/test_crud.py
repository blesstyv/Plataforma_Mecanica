from apps.audit.models import AuditLog
from tests.conftest import pdf_file


def test_subject_crud_and_slug(teacher_api):
    r = teacher_api.post("/api/v1/admin/subjects/", {"name": "Máquinas CNC", "description": "d"}, format="json")
    assert r.status_code == 201 and r.data["slug"] == "maquinas-cnc"
    pk = r.data["id"]
    r2 = teacher_api.post("/api/v1/admin/subjects/", {"name": "Maquinas  CNC!"}, format="json")
    assert r2.status_code == 201 and r2.data["slug"].startswith("maquinas-cnc")
    assert teacher_api.patch(f"/api/v1/admin/subjects/{pk}/", {"is_published": True}, format="json").data["is_published"] is True
    assert teacher_api.delete(f"/api/v1/admin/subjects/{pk}/").status_code == 204
    assert AuditLog.objects.filter(entity_type="subject", action="create").exists()


def test_subject_duplicate_name_error_format(teacher_api, subject):
    r = teacher_api.post("/api/v1/admin/subjects/", {"name": "Soldadura"}, format="json")
    assert r.status_code == 400 and r.json()["error"]["code"] == "validation_error"


def test_category_crud_and_protected_delete(teacher_api, subject):
    r = teacher_api.post("/api/v1/admin/categories/", {"subject": subject.pk, "name": "MIG"}, format="json")
    assert r.status_code == 201 and r.data["slug"] == "mig"
    dup = teacher_api.post("/api/v1/admin/categories/", {"subject": subject.pk, "name": "mig"}, format="json")
    assert dup.status_code == 400
    assert teacher_api.delete(f"/api/v1/admin/subjects/{subject.pk}/").status_code == 409
    assert teacher_api.delete(f"/api/v1/admin/categories/{r.data['id']}/").status_code == 204


def test_material_full_lifecycle(teacher_api, category):
    r = teacher_api.post("/api/v1/admin/materials/", {"category": category.pk, "title": "Apunte 1", "file": pdf_file()}, format="multipart")
    assert r.status_code == 201, r.content
    mid = r.data["id"]
    assert r.data["status"] == "draft" and r.data["file_type"] == "pdf"
    assert "file_key" not in r.data
    assert teacher_api.patch(f"/api/v1/admin/materials/{mid}/", {"title": "Apunte 1b", "allow_download": False}, format="json").data["title"] == "Apunte 1b"
    assert teacher_api.post(f"/api/v1/admin/materials/{mid}/publish/").data["status"] == "published"
    assert teacher_api.post(f"/api/v1/admin/materials/{mid}/unpublish/").data["status"] == "draft"
    rep = teacher_api.post(f"/api/v1/admin/materials/{mid}/replace-file/", {"file": pdf_file("nuevo.pdf")}, format="multipart")
    assert rep.status_code == 200 and rep.data["original_filename"] == "nuevo.pdf"
    assert teacher_api.get(f"/api/v1/admin/materials/{mid}/file/").status_code == 200  # el profesor ve borradores
    assert teacher_api.delete(f"/api/v1/admin/materials/{mid}/").status_code == 204
    assert teacher_api.delete(f"/api/v1/admin/categories/{category.pk}/").status_code == 204


def test_dashboard_counts(teacher_api, published_material):
    d = teacher_api.get("/api/v1/admin/dashboard/").data
    assert (d["subjects"], d["categories"], d["materials"], d["published"], d["drafts"]) == (1, 1, 1, 1, 0)
    assert len(d["recent_materials"]) == 1
