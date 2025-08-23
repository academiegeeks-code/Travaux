# -*- coding: utf-8 -*-
# pytest + DRF test suite covering the Users & Authentication module end-to-end.
# Adjust the URL names or fallback paths below to match your project.

import io
import csv
import uuid
import pytest

from django.conf import settings
from django.urls import reverse, NoReverseMatch
from django.utils import timezone
from django.core import mail
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework import status
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

# ---------- Configurable endpoint names and fallback paths ----------

URLS = {
    # Auth
    "jwt_login":      ("user-login",             "/api/users/jwt/login/"),
    "jwt_refresh":    ("token-refresh",          "/api/users/jwt/refresh/"),
    "login":          ("user-login",             "/api/users/login/"),
    "logout":         ("user-logout",            "/api/users/logout/"),
    # Activation & Password
    "activate":       ("user-activate",          "/api/users/activate/"),
    "pwd_reset_req":  ("password-reset-request", "/api/users/password/reset/request/"),
    "pwd_reset_cfm":  ("password-reset-confirm", "/api/users/password/reset/confirm/"),
    "pwd_change":     ("password-change",        "/api/users/password/change/"),
    # Profiles
    "profile":        ("user-profile",           "/api/users/profile/"),
    "admin_profile":  ("admin-profile",          "/api/users/admin/profile/"),
    # Interns (stagiaires)
    "intern_list":    ("intern-list",            "/api/users/interns/"),
    "intern_detail":  ("intern-detail",          "/api/users/interns/{id}/"),
    "intern_import":  ("intern-import",          "/api/users/interns/import/"),
    "intern_export":  ("intern-export",          "/api/users/interns/export/"),
    # Supervisors (maîtres de suivi)
    "sup_list":       ("supervisor-list",        "/api/users/supervisors/"),
    "sup_detail":     ("supervisor-detail",      "/api/users/supervisors/{id}/"),
    "sup_import":     ("supervisor-import",      "/api/users/supervisors/import/"),
    "sup_export":     ("supervisor-export",      "/api/users/supervisors/export/"),
    # Suggestions & Stats
    "suggestions":    ("suggestion-create",      "/api/users/suggestions/"),
    "stats":          ("user-stats",             "/api/users/stats/"),
}

def reverse_or_path(key, **fmt):
    name, fallback = URLS[key]
    try:
        if fmt:
            return reverse(name, kwargs=fmt)
        return reverse(name)
    except NoReverseMatch:
        if fmt:
            return fallback.format(**fmt)
        return fallback

# ---------- Fixtures ----------

@pytest.fixture(autouse=True)
def _email_backend(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    return settings

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_model():
    return get_user_model()

@pytest.fixture
def make_user(user_model):
    def _mk(
        email,
        password="Passw0rd!123",
        role="intern",
        is_active=True,
        is_staff=False,
        is_superuser=False,
        extra=None,
    ):
        u = user_model.objects.create(
            email=email,
            is_active=is_active,
            is_staff=is_staff,
            is_superuser=is_superuser,
            **(extra or {}),
        )
        if hasattr(u, "role"):
            setattr(u, "role", role)
            u.save(update_fields=["role"])
        u.set_password(password)
        u.save()
        return u
    return _mk

@pytest.fixture
def admin_user(make_user):
    return make_user(
        email="admin@example.com",
        password="AdminPass!123",
        role="admin",
        is_active=True,
        is_staff=True,
        is_superuser=True,
    )

@pytest.fixture
def intern_user(make_user):
    return make_user(
        email="intern@example.com",
        password="InternPass!123",
        role="intern",
        is_active=True,
    )

@pytest.fixture
def supervisor_user(make_user):
    return make_user(
        email="supervisor@example.com",
        password="Supervisor!123",
        role="supervisor",
        is_active=True,
    )

@pytest.fixture
def inactive_user(make_user):
    # user pending activation with token fields if present
    u = make_user(
        email="inactive@example.com",
        password="Temp!12345",
        role="intern",
        is_active=False,
    )
    # populate activation token if model supports it
    if hasattr(u, "activation_token"):
        u.activation_token = uuid.uuid4()
    if hasattr(u, "activation_token_expires_at"):
        u.activation_token_expires_at = timezone.now() + timezone.timedelta(hours=24)
    u.save()
    return u

@pytest.fixture
def auth_client(api_client):
    # force_authenticate for protected endpoints (bypasses JWT in unit tests)
    def _auth(user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client
    return _auth

@pytest.fixture
def grant_perms():
    # Attach a dynamic get_permissions() method to user instance if your permission
    # class relies on it. Adjust as needed to match your Permission enum/strings.
    def _grant(user, perms):
        def _get_permissions():
            return set(perms)
        setattr(user, "get_permissions", _get_permissions)
        return user
    return _grant

# ---------- Helpers ----------

def csv_upload(fieldnames, rows):
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        writer.writerow(r)
    buf.seek(0)
    content = buf.getvalue().encode("utf-8")
    return SimpleUploadedFile("import.csv", content, content_type="text/csv")

# ---------- Authentication ----------

def test_jwt_login_success(api_client, admin_user):
    url = reverse_or_path("jwt_login")
    resp = api_client.post(url, {"email": admin_user.email, "password": "AdminPass!123"}, format="json")
    assert resp.status_code in (200, 201)
    assert "access" in resp.data or "token" in resp.data
    # If SimpleJWT, also expect refresh
    if "access" in resp.data:
        assert "refresh" in resp.data

def test_jwt_login_invalid_credentials(api_client):
    url = reverse_or_path("jwt_login")
    resp = api_client.post(url, {"email": "ghost@example.com", "password": "wrong"}, format="json")
    assert resp.status_code in (400, 401)

def test_jwt_refresh_success(api_client, admin_user):
    login_url = reverse_or_path("jwt_login")
    r = api_client.post(login_url, {"email": admin_user.email, "password": "AdminPass!123"}, format="json")
    assert r.status_code in (200, 201)
    refresh = r.data.get("refresh")
    if not refresh:
        pytest.skip("No refresh token in response; refresh flow not applicable.")
    refresh_url = reverse_or_path("jwt_refresh")
    rr = api_client.post(refresh_url, {"refresh": refresh}, format="json")
    assert rr.status_code == 200
    assert "access" in rr.data

# ---------- Activation ----------

def test_activation_valid(api_client, inactive_user):
    token = None
    if hasattr(inactive_user, "activation_token"):
        token = str(inactive_user.activation_token)
    else:
        # If model has no field, simulate API accepting generic token
        token = str(uuid.uuid4())
        # Your view should validate token; this test assumes success path
    url = reverse_or_path("activate")
    payload = {"email": inactive_user.email, "token": token}
    resp = api_client.post(url, payload, format="json")
    assert resp.status_code in (200, 204)
    inactive_user.refresh_from_db()
    assert inactive_user.is_active is True

def test_activation_invalid_token(api_client, inactive_user):
    url = reverse_or_path("activate")
    resp = api_client.post(url, {"email": inactive_user.email, "token": "invalid-token"}, format="json")
    assert resp.status_code in (400, 403, 404)

# ---------- Password management ----------

def test_password_reset_request_sends_email(api_client, intern_user):
    url = reverse_or_path("pwd_reset_req")
    resp = api_client.post(url, {"email": intern_user.email}, format="json")
    assert resp.status_code in (200, 202)
    assert len(mail.outbox) >= 1

def test_password_reset_confirm_changes_password(api_client, intern_user):
    # Seed a reset token on the user if the model supports it; otherwise, rely on API logic
    reset_token = str(uuid.uuid4())
    if hasattr(intern_user, "reset_token"):
        intern_user.reset_token = reset_token
    if hasattr(intern_user, "reset_token_expires_at"):
        intern_user.reset_token_expires_at = timezone.now() + timezone.timedelta(hours=1)
    intern_user.save()

    url = reverse_or_path("pwd_reset_cfm")
    new_pwd = "NewStrong!456"
    resp = api_client.post(
        url, {"email": intern_user.email, "token": reset_token, "new_password": new_pwd}, format="json"
    )
    assert resp.status_code in (200, 204)
    # Verify login with new password via login endpoint if available
    login_url = reverse_or_path("jwt_login")
    r = api_client.post(login_url, {"email": intern_user.email, "password": new_pwd}, format="json")
    assert r.status_code in (200, 201)

def test_password_change_requires_correct_old(auth_client, intern_user):
    client = auth_client(intern_user)
    url = reverse_or_path("pwd_change")
    # Wrong old password
    r1 = client.post(url, {"old_password": "Wrong!000", "new_password": "BrandNew!999"}, format="json")
    assert r1.status_code in (400, 403)
    # Correct old password
    r2 = client.post(url, {"old_password": "InternPass!123", "new_password": "BrandNew!999"}, format="json")
    assert r2.status_code in (200, 204)

# ---------- Profiles ----------

def test_profile_view_get_and_update(auth_client, intern_user):
    client = auth_client(intern_user)
    url = reverse_or_path("profile")
    r_get = client.get(url)
    assert r_get.status_code == 200
    # Try update (if allowed)
    r_put = client.put(url, {"first_name": "Mariam"}, format="json")
    assert r_put.status_code in (200, 403)
    if r_put.status_code == 200:
        assert r_put.data.get("first_name") == "Mariam"

def test_admin_profile_update_requires_permission(auth_client, admin_user, grant_perms):
    # If your permission class checks custom strings, grant them here
    grant_perms(admin_user, {"MANAGE_USERS", "VIEW_ADMIN_PROFILE"})
    client = auth_client(admin_user)
    url = reverse_or_path("admin_profile")
    r = client.put(url, {"support_contact_email": "support@example.com"}, format="json")
    assert r.status_code in (200, 403)

# ---------- Interns CRUD ----------

def test_admin_can_create_intern(auth_client, admin_user, grant_perms):
    grant_perms(admin_user, {"MANAGE_INTERNS"})
    client = auth_client(admin_user)
    url = reverse_or_path("intern_list")
    payload = {
        "email": "newintern@example.com",
        "first_name": "Awa",
        "last_name": "Sawadogo",
        "phone": "+22670000000",
        "role": "intern",
    }
    r = client.post(url, payload, format="json")
    assert r.status_code in (201, 200)

def test_non_admin_cannot_create_intern(auth_client, intern_user):
    client = auth_client(intern_user)
    url = reverse_or_path("intern_list")
    r = client.post(
        url,
        {"email": "blockme@example.com", "first_name": "Nope", "role": "intern"},
        format="json",
    )
    assert r.status_code in (401, 403)

def test_intern_list_filtering(auth_client, admin_user, grant_perms, make_user):
    grant_perms(admin_user, {"MANAGE_INTERNS"})
    make_user("i1@example.com", role="intern", extra={"first_name": "Alpha"})
    make_user("i2@example.com", role="intern", extra={"first_name": "Beta"})
    client = auth_client(admin_user)
    url = reverse_or_path("intern_list") + "?search=Alpha"
    r = client.get(url)
    assert r.status_code == 200
    assert isinstance(r.data, (list, dict))
    # If paginated, r.data may be dict with results
    items = r.data if isinstance(r.data, list) else r.data.get("results", [])
    assert any("Alpha" in (it.get("first_name") or "") for it in items)

def test_intern_update_and_soft_delete(auth_client, admin_user, grant_perms, make_user):
    grant_perms(admin_user, {"MANAGE_INTERNS"})
    intern = make_user("deleteme@example.com", role="intern")
    client = auth_client(admin_user)

    # Update
    detail_url = reverse_or_path("intern_detail", id=intern.id)
    r_upd = client.patch(detail_url, {"first_name": "Updated"}, format="json")
    assert r_upd.status_code in (200, 204)
    # Soft delete
    r_del = client.delete(detail_url)
    assert r_del.status_code in (200, 204)
    intern.refresh_from_db()
    assert intern.is_active is False
    # Optional audit fields if present
    if hasattr(intern, "deleted_at"):
        assert intern.deleted_at is not None
    if hasattr(intern, "deleted_by"):
        assert intern.deleted_by

# ---------- Bulk import/export (interns) ----------

def test_bulk_import_interns_csv_success(auth_client, admin_user, grant_perms):
    grant_perms(admin_user, {"BULK_IMPORT_USERS", "MANAGE_INTERNS"})
    client = auth_client(admin_user)
    url = reverse_or_path("intern_import")
    file = csv_upload(
        ["first_name", "last_name", "email", "phone", "field_of_study", "university"],
        [
            {
                "first_name": "Jean",
                "last_name": "Traoré",
                "email": "jean@example.com",
                "phone": "+22670112233",
                "field_of_study": "Informatique",
                "university": "UJKZ",
            }
        ],
    )
    r = client.post(url, {"file": file}, format="multipart")
    assert r.status_code in (201, 200)
    assert ("created_count" in r.data and r.data["created_count"] >= 1) or ("detail" in r.data)

def test_bulk_import_interns_csv_missing_columns(auth_client, admin_user, grant_perms):
    grant_perms(admin_user, {"BULK_IMPORT_USERS", "MANAGE_INTERNS"})
    client = auth_client(admin_user)
    url = reverse_or_path("intern_import")
    file = csv_upload(["email"], [{"email": "only@email.com"}])
    r = client.post(url, {"file": file}, format="multipart")
    assert r.status_code in (400, 422)

def test_export_interns_csv_download(auth_client, admin_user, grant_perms, make_user):
    grant_perms(admin_user, {"MANAGE_INTERNS"})
    # seed a couple interns
    make_user("e1@example.com", role="intern")
    make_user("e2@example.com", role="intern")
    client = auth_client(admin_user)
    url = reverse_or_path("intern_export") + "?format=csv"
    r = client.get(url)
    assert r.status_code == 200
    assert "text/csv" in r["Content-Type"]
    assert "attachment; filename=" in r["Content-Disposition"]
    assert len(r.content) > 0

# ---------- Supervisors basic sanity (optional) ----------

def test_supervisor_list_requires_permission(auth_client, admin_user, grant_perms):
    # Without perms
    client = auth_client(admin_user)
    url = reverse_or_path("sup_list")
    r_forbidden = client.get(url)
    assert r_forbidden.status_code in (401, 403)
    # With perms
    grant_perms(admin_user, {"MANAGE_SUPERVISORS"})
    r_ok = client.get(url)
    assert r_ok.status_code in (200, 204)

# ---------- Suggestions ----------

def test_post_suggestion_valid(api_client):
    url = reverse_or_path("suggestions")
    payload = {"subject": "Amélioration", "message": "Ajouter un export Excel des superviseurs."}
    r = api_client.post(url, payload, format="json")
    assert r.status_code in (201, 200)

def test_post_suggestion_invalid_payload(api_client):
    url = reverse_or_path("suggestions")
    r = api_client.post(url, {"message": ""}, format="json")
    assert r.status_code in (400, 422)

# ---------- Stats ----------

def test_stats_requires_permission(auth_client, admin_user):
    client = auth_client(admin_user)
    url = reverse_or_path("stats")
    r_forbidden = client.get(url)
    assert r_forbidden.status_code in (401, 403)

def test_stats_shape_with_permission(auth_client, admin_user, grant_perms, make_user):
    grant_perms(admin_user, {"VIEW_USER_STATS"})
    # seed data
    make_user("s1@example.com", role="supervisor")
    make_user("i100@example.com", role="intern")
    client = auth_client(admin_user)
    url = reverse_or_path("stats")
    r = client.get(url)
    assert r.status_code == 200
    assert isinstance(r.data, dict)
    # Typical keys (adjust to your implementation)
    possible_keys = {"intern_count", "supervisor_count", "active_users", "growth_rate", "by_university"}
    assert any(k in r.data for k in possible_keys)

# ---------- Permissions & rate limiting notes ----------

@pytest.mark.skip(reason="Rate limiting behavior is environment-dependent; enable and adjust to your setup.")
def test_rate_limit_on_sensitive_endpoints(api_client, admin_user):
    url = reverse_or_path("intern_export")
    # Example: hit endpoint multiple times to trigger rate limit
    for _ in range(10):
        r = api_client.get(url)
    # Expect 429 when limit exceeded
    assert r.status_code == 429
