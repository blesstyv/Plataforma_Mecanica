"""Flujo completo profesor → visitante → despublicación (sección 18)."""
from tests.conftest import pdf_file


def test_full_flow(api, teacher):
    from rest_framework.test import APIClient

    t = APIClient()
    assert t.post("/api/v1/auth/login/", {"username": "profe", "password": "Clave-segura-123"}, format="json").status_code == 200
    s = t.post("/api/v1/admin/subjects/", {"name": "Metrología", "is_published": True}, format="json").data
    c = t.post("/api/v1/admin/categories/", {"subject": s["id"], "name": "Calibres", "is_published": True}, format="json").data
    m = t.post("/api/v1/admin/materials/", {"category": c["id"], "title": "Uso del calibre", "file": pdf_file()}, format="multipart").data
    assert api.get("/api/v1/materials/").data["count"] == 0  # aún borrador
    t.post(f"/api/v1/admin/materials/{m['id']}/publish/")
    found = api.get("/api/v1/materials/?search=calibre").data["results"]
    assert found and found[0]["id"] == m["id"]
    assert api.get(f"/api/v1/materials/{m['id']}/file/").status_code == 200
    assert api.get(f"/api/v1/materials/{m['id']}/file/?download=1").status_code == 200
    t.post(f"/api/v1/admin/materials/{m['id']}/unpublish/")
    assert api.get(f"/api/v1/materials/{m['id']}/file/").status_code == 404
    assert api.post("/api/v1/admin/subjects/", {"name": "Hack"}, format="json").status_code in (401, 403)
