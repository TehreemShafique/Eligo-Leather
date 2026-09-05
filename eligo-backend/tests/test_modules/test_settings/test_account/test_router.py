"""Tests for app.modules.settings.account.router"""

import time
from sqlalchemy import func, select

from app.core.security import decode_access_token, verify_password
from app.modules.auth.model import User
from app.modules.settings.account import service
from app.modules.settings.account.model import (
    LoginProvider,
    UserLoginService,
    UserRecoveryCode,
    UserSession,
)
from app.modules.settings.account.schema import SecondaryEmailUpdateIn, TotpVerifyIn

BASE = "/api/v1/settings/account"


def _totp_code_for(secret):
    return service._totp_code(
        service._b32decode(secret), int(time.time()) // service.TOTP_PERIOD
    )


def _admin_jti(admin_headers):
    token = admin_headers["Authorization"].split(" ")[1]
    return decode_access_token(token)["jti"]


async def _enable_two_factor_via_service(db_session, admin):
    setup = await service.start_totp_setup(db_session, admin)
    await service.verify_totp_setup(
        db_session, admin, TotpVerifyIn(code=_totp_code_for(setup.secret))
    )
    return setup.secret


async def _current_session_id(db_session, admin_headers):
    result = await db_session.execute(
        select(UserSession).where(UserSession.token_id == _admin_jti(admin_headers))
    )
    return result.scalar_one().id


# ---------------------------------------------------------------------------
# Auth / authorization
# ---------------------------------------------------------------------------

async def test_account_requires_auth(client):
    resp = await client.get(f"{BASE}/profile")
    assert resp.status_code == 401


async def test_account_requires_admin(client, auth_headers):
    resp = await client.get(f"{BASE}/profile", headers=auth_headers)
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

async def test_get_profile(client, admin_headers, admin):
    resp = await client.get(f"{BASE}/profile", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == admin.email
    assert body["initials"]
    assert body["preferred_language"] == "en"


async def test_update_profile(client, admin_headers):
    resp = await client.patch(
        f"{BASE}/profile",
        json={
            "first_name": "Admin",
            "last_name": "User",
            "phone": "+92 300 1234567",
            "preferred_language": "ur",
            "regional_format": "ur-PK",
            "timezone": "Asia/Karachi",
        },
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["first_name"] == "Admin"
    assert body["last_name"] == "User"
    assert body["full_name"] == "Admin User"
    assert body["preferred_language"] == "ur"


async def test_update_profile_email_marks_unverified(client, admin_headers):
    resp = await client.patch(
        f"{BASE}/profile", json={"email": "new@example.com"}, headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "new@example.com"
    assert resp.json()["email_verified"] is False


async def test_update_profile_duplicate_email_422(client, admin_headers, db_session):
    other = User(email="taken@example.com", hashed_password="x", is_active=True)
    db_session.add(other)
    await db_session.commit()

    resp = await client.patch(
        f"{BASE}/profile", json={"email": "taken@example.com"}, headers=admin_headers
    )
    assert resp.status_code == 422
    assert "already in use" in resp.json()["detail"]


async def test_update_profile_invalid_email_422(client, admin_headers):
    resp = await client.patch(
        f"{BASE}/profile", json={"email": "not-an-email"}, headers=admin_headers
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# General: catalogs / resources
# ---------------------------------------------------------------------------

async def test_list_languages(client, admin_headers):
    resp = await client.get(f"{BASE}/languages", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["code"] == "en-US"
    assert body[0]["name"] == "English"


async def test_list_regional_formats(client, admin_headers):
    resp = await client.get(f"{BASE}/regional-formats", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 5


async def test_list_timezones(client, admin_headers):
    resp = await client.get(f"{BASE}/timezones", headers=admin_headers)
    assert resp.status_code == 200
    assert any(z["code"] == "Asia/Karachi" for z in resp.json())


async def test_get_resources(client, admin_headers):
    resp = await client.get(f"{BASE}/resources", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["stores_url"] == "/settings/stores"


# ---------------------------------------------------------------------------
# Login services (SSO)
# ---------------------------------------------------------------------------

async def test_connect_login_service(client, admin_headers):
    resp = await client.post(
        f"{BASE}/login-services",
        json={"provider": "google", "external_id": "g-123"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["provider"] == "google"
    assert resp.json()["external_id"] == "g-123"


async def test_list_login_services(client, admin_headers, admin, db_session):
    await service.connect_login_service(
        db_session, admin, LoginProvider.google, "g-123"
    )
    resp = await client.get(f"{BASE}/login-services", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["provider"] == "google"


async def test_connect_duplicate_login_service_422(client, admin_headers, admin, db_session):
    await service.connect_login_service(
        db_session, admin, LoginProvider.google, "g-123"
    )
    resp = await client.post(
        f"{BASE}/login-services",
        json={"provider": "google", "external_id": "g-999"},
        headers=admin_headers,
    )
    assert resp.status_code == 422
    assert "already connected" in resp.json()["detail"]


async def test_connect_invalid_provider_422(client, admin_headers):
    resp = await client.post(
        f"{BASE}/login-services",
        json={"provider": "github", "external_id": "g-1"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_disconnect_login_service(client, admin_headers, admin, db_session):
    google = await service.connect_login_service(
        db_session, admin, LoginProvider.google, "g-123"
    )
    resp = await client.delete(
        f"{BASE}/login-services/{google.id}", headers=admin_headers
    )
    assert resp.status_code == 204

    remaining = (
        await db_session.execute(
            select(UserLoginService).where(UserLoginService.user_id == admin.id)
        )
    ).scalars().all()
    assert len(remaining) == 0


async def test_disconnect_missing_login_service_404(client, admin_headers):
    resp = await client.delete(f"{BASE}/login-services/99999", headers=admin_headers)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Security: password
# ---------------------------------------------------------------------------

async def test_password_status_before_first_change(client, admin_headers):
    resp = await client.get(f"{BASE}/security/password-status", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["last_changed_at"] is None
    assert "not changed" in body["message"]


async def test_change_password(client, admin_headers, admin, db_session):
    resp = await client.post(
        f"{BASE}/security/change-password",
        json={"current_password": "password123", "new_password": "newpass12345"},
        headers=admin_headers,
    )
    assert resp.status_code == 204

    await db_session.refresh(admin)
    assert verify_password("newpass12345", admin.hashed_password)
    assert admin.password_changed_at is not None


async def test_change_password_wrong_current_422(client, admin_headers):
    resp = await client.post(
        f"{BASE}/security/change-password",
        json={"current_password": "wrongpass", "new_password": "newpass12345"},
        headers=admin_headers,
    )
    assert resp.status_code == 422
    assert "Current password" in resp.json()["detail"]


async def test_change_password_too_short_422(client, admin_headers):
    resp = await client.post(
        f"{BASE}/security/change-password",
        json={"current_password": "password123", "new_password": "short"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_change_password_same_as_current_422(client, admin_headers):
    resp = await client.post(
        f"{BASE}/security/change-password",
        json={"current_password": "password123", "new_password": "password123"},
        headers=admin_headers,
    )
    assert resp.status_code == 422
    assert "different" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Security: secondary email
# ---------------------------------------------------------------------------

async def test_get_secondary_email_empty(client, admin_headers):
    resp = await client.get(f"{BASE}/security/secondary-email", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] is None


async def test_set_secondary_email(client, admin_headers):
    resp = await client.put(
        f"{BASE}/security/secondary-email",
        json={"email": "sec@example.com"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "sec@example.com"
    assert resp.json()["verified"] is False


async def test_remove_secondary_email(client, admin_headers, admin, db_session):
    await service.set_secondary_email(
        db_session, admin, SecondaryEmailUpdateIn(email="sec@example.com")
    )
    resp = await client.delete(f"{BASE}/security/secondary-email", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] is None
    assert resp.json()["verified"] is False


async def test_set_secondary_email_invalid_422(client, admin_headers):
    resp = await client.put(
        f"{BASE}/security/secondary-email",
        json={"email": "not-an-email"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Security: two-factor
# ---------------------------------------------------------------------------

async def test_two_factor_status_disabled(client, admin_headers):
    resp = await client.get(f"{BASE}/security/two-factor", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["enabled"] is False
    assert resp.json()["recovery_codes_count"] == 0


async def test_two_factor_setup(client, admin_headers):
    resp = await client.post(f"{BASE}/security/two-factor/setup", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["secret"]) == 32
    assert resp.json()["otpauth_url"].startswith("otpauth://totp/")


async def test_two_factor_verify_without_setup_422(client, admin_headers):
    resp = await client.post(
        f"{BASE}/security/two-factor/verify",
        json={"code": "123456"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_two_factor_verify_wrong_code_422(client, admin_headers, admin, db_session):
    await service.start_totp_setup(db_session, admin)
    resp = await client.post(
        f"{BASE}/security/two-factor/verify",
        json={"code": "000000"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_two_factor_verify_enables(client, admin_headers, admin, db_session):
    setup = await service.start_totp_setup(db_session, admin)
    resp = await client.post(
        f"{BASE}/security/two-factor/verify",
        json={"code": _totp_code_for(setup.secret)},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["enabled"] is True
    assert resp.json()["primary_method"] == "authenticator_app"


async def test_two_factor_setup_when_already_enabled_422(client, admin_headers, admin, db_session):
    await _enable_two_factor_via_service(db_session, admin)
    resp = await client.post(f"{BASE}/security/two-factor/setup", headers=admin_headers)
    assert resp.status_code == 422


async def test_disable_two_factor_wrong_code_422(client, admin_headers, admin, db_session):
    await _enable_two_factor_via_service(db_session, admin)
    resp = await client.post(
        f"{BASE}/security/two-factor/disable",
        json={"code": "000000"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


async def test_disable_two_factor(client, admin_headers, admin, db_session):
    secret = await _enable_two_factor_via_service(db_session, admin)
    resp = await client.post(
        f"{BASE}/security/two-factor/disable",
        json={"code": _totp_code_for(secret)},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["enabled"] is False


# ---------------------------------------------------------------------------
# Security: recovery codes
# ---------------------------------------------------------------------------

async def test_generate_recovery_codes(client, admin_headers, admin, db_session):
    resp = await client.post(f"{BASE}/security/two-factor/recovery-codes", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["codes"]) == 10
    assert body["last_generated_at"] is not None

    count = (
        await db_session.execute(
            select(func.count())
            .select_from(UserRecoveryCode)
            .where(
                UserRecoveryCode.user_id == admin.id,
                UserRecoveryCode.is_active == True,  # noqa: E712
            )
        )
    ).scalar()
    assert count == 10


async def test_disable_two_factor_with_recovery_code(client, admin_headers, admin, db_session):
    await _enable_two_factor_via_service(db_session, admin)
    codes = (await service.generate_recovery_codes(db_session, admin)).codes

    resp = await client.post(
        f"{BASE}/security/two-factor/disable",
        json={"code": codes[0]},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["enabled"] is False


# ---------------------------------------------------------------------------
# Security: active sessions ledger
# ---------------------------------------------------------------------------

async def test_list_sessions_marks_current(client, admin_headers):
    resp = await client.get(f"{BASE}/security/sessions", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) >= 1
    assert any(s["is_current"] for s in body)


async def test_revoke_other_session(client, admin_headers, admin, db_session):
    db_session.add(UserSession(user_id=admin.id, token_id="jti-other"))
    await db_session.commit()
    other = (
        await db_session.execute(
            select(UserSession).where(UserSession.token_id == "jti-other")
        )
    ).scalar_one()

    resp = await client.post(
        f"{BASE}/security/sessions/{other.id}/revoke", headers=admin_headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["session_id"] == other.id
    assert body["revoked"] is True
    assert body["was_current"] is False

    await db_session.refresh(other)
    assert other.revoked_at is not None


async def test_revoke_missing_session_404(client, admin_headers):
    resp = await client.post(f"{BASE}/security/sessions/99999/revoke", headers=admin_headers)
    assert resp.status_code == 404


async def test_revoke_current_session_invalidates_token(client, admin_headers, db_session):
    session_id = await _current_session_id(db_session, admin_headers)

    resp = await client.post(
        f"{BASE}/security/sessions/{session_id}/revoke", headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["was_current"] is True

    resp = await client.get(f"{BASE}/profile", headers=admin_headers)
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

async def test_seed(client, admin_headers):
    resp = await client.post(f"{BASE}/seed", headers=admin_headers)
    assert resp.status_code == 201
    assert resp.json() == {"status": "ok"}
