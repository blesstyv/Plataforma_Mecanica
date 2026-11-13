import pytest

ADMIN_ENDPOINTS = ["subjects", "categories", "materials"]


@pytest.mark.parametrize("name", ADMIN_ENDPOINTS)
def test_anonymous_cannot_access_admin_api(api, name):
    assert api.get(f"/api/v1/admin/{name}/").status_code in (401, 403)
    assert api.post(f"/api/v1/admin/{name}/", {}, format="json").status_code in (401, 403)


def test_dashboard_protected(api, teacher_api):
    assert api.get("/api/v1/admin/dashboard/").status_code in (401, 403)
    assert teacher_api.get("/api/v1/admin/dashboard/").status_code == 200


def test_non_staff_forbidden(student_user):
    from rest_framework.test import APIClient

    c = APIClient()
    c.force_login(student_user)
    assert c.get("/api/v1/admin/subjects/").status_code == 403
