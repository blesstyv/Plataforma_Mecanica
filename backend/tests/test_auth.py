import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

LOGIN = "/api/v1/auth/login/"


@pytest.fixture(autouse=True)
def _clear():
    cache.clear()


def test_login_ok_and_me(api, teacher):
    r = api.post(LOGIN, {"username": "profe", "password": "Clave-segura-123"}, format="json")
    assert r.status_code == 200 and r.data["username"] == "profe"
    assert api.get("/api/v1/auth/me/").status_code == 200


def test_login_bad_password(api, teacher):
    r = api.post(LOGIN, {"username": "profe", "password": "mal"}, format="json")
    assert r.status_code == 401
    assert r.json()["error"]["message"]


def test_non_staff_cannot_login(api, student_user):
    assert api.post(LOGIN, {"username": "alumno", "password": "Clave-segura-123"}, format="json").status_code == 401


def test_bruteforce_lockout(api, teacher, settings):
    for _ in range(settings.LOGIN_MAX_FAILURES):
        api.post(LOGIN, {"username": "profe", "password": "mal"}, format="json")
    r = api.post(LOGIN, {"username": "profe", "password": "Clave-segura-123"}, format="json")
    assert r.status_code == 429


def test_me_requires_auth(api):
    assert api.get("/api/v1/auth/me/").status_code in (401, 403)


def test_logout(teacher_api):
    assert teacher_api.post("/api/v1/auth/logout/").status_code == 204
    assert teacher_api.get("/api/v1/auth/me/").status_code in (401, 403)


def test_login_enforces_csrf(db):
    c = APIClient(enforce_csrf_checks=True)
    r = c.post(LOGIN, {"username": "x", "password": "y"}, format="json")
    assert r.status_code == 403
    c.get("/api/v1/auth/csrf/")
    token = c.cookies["csrftoken"].value
    r = c.post(LOGIN, {"username": "x", "password": "y"}, format="json", HTTP_X_CSRFTOKEN=token)
    assert r.status_code == 401
