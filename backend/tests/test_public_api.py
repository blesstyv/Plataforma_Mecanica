def test_public_lists_only_published(api, subject, category, published_material, teacher):
    from apps.categories.models import Category
    from apps.materials.services import create_material
    from apps.subjects.models import Subject
    from tests.conftest import pdf_file

    draft = create_material(teacher, {"category": category, "title": "Borrador secreto", "file": pdf_file()})
    hidden_subject = Subject.objects.create(name="Oculta", slug="oculta", is_published=False)
    hidden_cat = Category.objects.create(subject=hidden_subject, name="X", slug="x", is_published=True)
    create_material(teacher, {"category": hidden_cat, "title": "En asignatura oculta", "file": pdf_file(), "status": "published"})

    r = api.get("/api/v1/materials/")
    titles = [m["title"] for m in r.data["results"]]
    assert titles == ["Guía SMAW"]
    assert api.get(f"/api/v1/materials/{draft.pk}/").status_code == 404
    assert api.get(f"/api/v1/materials/{draft.pk}/file/").status_code == 404
    assert [s["slug"] for s in api.get("/api/v1/subjects/").data["results"]] == ["soldadura"]
    assert api.get("/api/v1/subjects/oculta/").status_code == 404


def test_subject_detail_has_categories(api, subject, category, published_material):
    d = api.get("/api/v1/subjects/soldadura/").data
    assert d["categories"][0]["slug"] == "smaw" and d["categories"][0]["material_count"] == 1
    assert d["material_count"] == 1


def test_search_filter_ordering_pagination(api, category, teacher):
    from apps.materials.services import create_material
    from tests.conftest import docx_file, pdf_file

    create_material(teacher, {"category": category, "title": "Electrodos", "file": pdf_file(), "status": "published"})
    create_material(teacher, {"category": category, "title": "Seguridad", "file": docx_file(), "status": "published", "description": "casco"})
    assert api.get("/api/v1/materials/?search=electro").data["count"] == 1
    assert api.get("/api/v1/materials/?search=casco").data["count"] == 1
    assert api.get("/api/v1/materials/?file_type=docx").data["count"] == 1
    assert api.get("/api/v1/materials/?subject=soldadura&category=smaw").data["count"] == 2
    assert [m["title"] for m in api.get("/api/v1/materials/?ordering=title").data["results"]] == ["Electrodos", "Seguridad"]
    p = api.get("/api/v1/materials/?page_size=1").data
    assert len(p["results"]) == 1 and p["next"]


def test_download_permission(api, published_material):
    url = f"/api/v1/materials/{published_material.pk}/file/"
    r = api.get(url)
    assert r.status_code == 200 and r["Content-Disposition"].startswith("inline")
    assert api.get(url + "?download=1")["Content-Disposition"].startswith("attachment")
    published_material.allow_download = False
    published_material.save()
    assert api.get(url + "?download=1").status_code == 403
    assert api.get(url).status_code == 200  # ver sigue permitido


def test_no_private_keys_in_public_payload(api, published_material):
    d = api.get(f"/api/v1/materials/{published_material.pk}/").data
    assert not {"file_key", "preview_key", "uploaded_by", "status"} & set(d)


def test_unpublish_revokes_access(api, teacher_api, published_material):
    url = f"/api/v1/materials/{published_material.pk}/file/"
    assert api.get(url).status_code == 200
    teacher_api.post(f"/api/v1/admin/materials/{published_material.pk}/unpublish/")
    assert api.get(url).status_code == 404


def test_unpublished_category_hides_materials(api, category, published_material):
    category.is_published = False
    category.save()
    assert api.get("/api/v1/materials/").data["count"] == 0


def test_error_format_404(api, db):
    r = api.get("/api/v1/materials/999999/")
    assert r.status_code == 404 and set(r.json()["error"]) == {"code", "message", "details"}


def test_openapi_schema_and_health(api):
    assert api.get("/api/schema/").status_code == 200
    assert api.get("/health/").status_code == 200
