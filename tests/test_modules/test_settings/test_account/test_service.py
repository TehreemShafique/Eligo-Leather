"""Tests for app.modules.settings.account.service"""

import time
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import select

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.modules.auth.model import User
from app.modules.settings.account import service
from app.modules.settings.account.model import (
    LoginProvider,
    UserSession,
)
from app.modules.settings.account.schema import (
    AccountProfileUpdate,
    SecondaryEmailUpdateIn,
    TotpVerifyIn,
)


def _totp_code_for(secret):
    return service._totp_code(
        service._b32decode(secret), int(time.time()) // service.TOTP_PERIOD
    )


async def _add_user(db_session, email, **kwargs):
    user = User(email=email, hashed_password=hash_password("password123"), **kwargs)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def _add_session(db_session, user, token_id, **kwargs):
    session = UserSession(user_id=user.id, token_id=token_id, **kwargs)
    db_session.add(session)
    await db_session.commit()
    return session


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

async def test_profile_update_updates_fields_and_syncs_full_name(db_session, user):
    result = await service.update_profile(
        db_session,
        user,
        AccountProfileUpdate(
            first_name="Ali",
            last_name="Khan",
            phone="+92 300 1234567",
            preferred_language="ur",
            regional_format="ur-PK",
            timezone="Asia/Karachi",
        ),
    )
    assert result.first_name == "Ali"
    assert result.last_name == "Khan"
    assert result.full_name == "Ali Khan"
    assert result.phone == "+92 300 1234567"
    assert result.preferred_language == "ur"
    assert result.regional_format == "ur-PK"
    assert result.timezone == "Asia/Karachi"


async def test_profile_update_email_resets_verification(db_session, user):
    user.email_verified = True
    await db_session.commit()

    result = await service.update_profile(
        db_session, user, AccountProfileUpdate(email="new@example.com")
    )
    assert result.email == "new@example.com"
    assert result.email_verified is False


async def test_profile_update_duplicate_email_raises(db_session, user):
    await _add_user(db_session, "taken@example.com")

    with pytest.raises(ValueError):
        await service.update_profile(
            db_session, user, AccountProfileUpdate(email="taken@example.com")
        )


async def test_profile_out_generates_avatar_url(db_session, user):
    result = service._profile_out(user)
    assert result.id == user.id
    assert result.email == user.email
    assert result.avatar_url.startswith("data:image/svg+xml")


# ---------------------------------------------------------------------------
# Password
# ---------------------------------------------------------------------------

async def test_password_status_before_first_change(db_session, user):
    status = await service.password_status(db_session, user)
    assert status.last_changed_at is None
    assert status.days_ago is None
    assert "not changed" in status.message


async def test_password_status_after_change(db_session, user):
    user.password_changed_at = datetime.now(timezone.utc)
    await db_session.commit()

    status = await service.password_status(db_session, user)
    assert status.days_ago == 0
    assert "today" in status.message


async def test_change_password_updates_hash_and_marks_changed(db_session, user):
    await service.change_password(
        db_session, user, "password123", "newpass12345", "jti-current"
    )
    await db_session.refresh(user)

    assert verify_password("newpass12345", user.hashed_password)
    assert not verify_password("password123", user.hashed_password)
    assert user.password_changed_at is not None


async def test_change_password_wrong_current_raises(db_session, user):
    with pytest.raises(ValueError):
        await service.change_password(db_session, user, "wrongpass", "newpass12345", None)


async def test_change_password_same_as_current_raises(db_session, user):
    with pytest.raises(ValueError):
        await service.change_password(db_session, user, "password123", "password123", None)


async def test_change_password_too_short_raises(db_session, user):
    with pytest.raises(ValueError):
        await service.change_password(db_session, user, "password123", "short", None)


async def test_change_password_revokes_other_sessions_only(db_session, user):
    await _add_session(db_session, user, "jti-current")
    await _add_session(db_session, user, "jti-other")

    await service.change_password(
        db_session, user, "password123", "newpass12345", "jti-current"
    )

    sessions = (
        await db_session.execute(select(UserSession).where(UserSession.user_id == user.id))
    ).scalars().all()
    by_jti = {s.token_id: s for s in sessions}
    assert by_jti["jti-current"].revoked_at is None
    assert by_jti["jti-other"].revoked_at is not None


# ---------------------------------------------------------------------------
# Login services (SSO)
# ---------------------------------------------------------------------------

async def test_connect_and_list_login_services(db_session, user):
    google = await service.connect_login_service(
        db_session, user, LoginProvider.google, "g-123"
    )
    apple = await service.connect_login_service(
        db_session, user, LoginProvider.apple, "a-456"
    )
    assert google.provider == LoginProvider.google
    assert apple.provider == LoginProvider.apple

    services = await service.list_login_services(db_session, user)
    assert len(services) == 2
    assert [s.provider for s in services] == [LoginProvider.apple, LoginProvider.google]


async def test_connect_duplicate_provider_raises(db_session, user):
    await service.connect_login_service(db_session, user, LoginProvider.google, "g-123")
    with pytest.raises(ValueError):
        await service.connect_login_service(db_session, user, LoginProvider.google, "g-999")


async def test_disconnect_login_service(db_session, user):
    google = await service.connect_login_service(
        db_session, user, LoginProvider.google, "g-123"
    )
    assert await service.disconnect_login_service(db_session, user, google.id) is True
    assert await service.list_login_services(db_session, user) == []


async def test_disconnect_other_users_service_returns_false(db_session, user):
    other = await _add_user(db_session, "other@example.com")
    google = await service.connect_login_service(
        db_session, other, LoginProvider.google, "g-123"
    )
    assert await service.disconnect_login_service(db_session, user, google.id) is False
    assert len(await service.list_login_services(db_session, other)) == 1


# ---------------------------------------------------------------------------
# Secondary email
# ---------------------------------------------------------------------------

async def test_set_secondary_email_marks_unverified(db_session, user):
    result = await service.set_secondary_email(
        db_session, user, SecondaryEmailUpdateIn(email="sec@example.com")
    )
    assert result.email == "sec@example.com"
    assert result.verified is False


async def test_remove_secondary_email(db_session, user):
    await service.set_secondary_email(
        db_session, user, SecondaryEmailUpdateIn(email="sec@example.com")
    )
    result = await service.remove_secondary_email(db_session, user)
    assert result.email is None
    assert result.verified is False


# ---------------------------------------------------------------------------
# Two-factor (TOTP)
# ---------------------------------------------------------------------------

async def test_two_factor_status_disabled(db_session, user):
    status = await service.two_factor_status(db_session, user)
    assert status.enabled is False
    assert status.primary_method is None
    assert status.recovery_codes_count == 0
    assert status.recovery_codes_last_generated_at is None


async def test_start_totp_setup_returns_secret_and_url(db_session, user):
    setup = await service.start_totp_setup(db_session, user)
    assert len(setup.secret) == 32
    assert setup.secret in setup.otpauth_url
    assert "Eligo" in setup.otpauth_url
    assert setup.otpauth_url.startswith("otpauth://totp/")


async def test_start_totp_setup_when_enabled_raises(db_session, user):
    setup = await service.start_totp_setup(db_session, user)
    await service.verify_totp_setup(db_session, user, TotpVerifyIn(code=_totp_code_for(setup.secret)))

    with pytest.raises(ValueError):
        await service.start_totp_setup(db_session, user)


async def test_verify_totp_setup_enables_two_factor(db_session, user):
    setup = await service.start_totp_setup(db_session, user)
    status = await service.verify_totp_setup(
        db_session, user, TotpVerifyIn(code=_totp_code_for(setup.secret))
    )
    assert status.enabled is True
    assert status.primary_method == "authenticator_app"


async def test_verify_totp_setup_wrong_code_raises(db_session, user):
    await service.start_totp_setup(db_session, user)
    with pytest.raises(ValueError):
        await service.verify_totp_setup(db_session, user, TotpVerifyIn(code="000000"))


async def test_verify_totp_setup_without_secret_raises(db_session, user):
    with pytest.raises(ValueError):
        await service.verify_totp_setup(db_session, user, TotpVerifyIn(code="123456"))


async def test_disable_two_factor_with_code(db_session, user):
    setup = await service.start_totp_setup(db_session, user)
    await service.verify_totp_setup(db_session, user, TotpVerifyIn(code=_totp_code_for(setup.secret)))

    status = await service.disable_two_factor(
        db_session, user, TotpVerifyIn(code=_totp_code_for(setup.secret))
    )
    assert status.enabled is False
    await db_session.refresh(user)
    assert user.totp_secret is None


async def test_disable_two_factor_when_not_enabled_raises(db_session, user):
    with pytest.raises(ValueError):
        await service.disable_two_factor(db_session, user, TotpVerifyIn(code="123456"))


async def test_disable_two_factor_wrong_code_raises(db_session, user):
    setup = await service.start_totp_setup(db_session, user)
    await service.verify_totp_setup(db_session, user, TotpVerifyIn(code=_totp_code_for(setup.secret)))

    with pytest.raises(ValueError):
        await service.disable_two_factor(db_session, user, TotpVerifyIn(code="000000"))


async def test_disable_two_factor_with_recovery_code(db_session, user):
    setup = await service.start_totp_setup(db_session, user)
    await service.verify_totp_setup(db_session, user, TotpVerifyIn(code=_totp_code_for(setup.secret)))
    codes = (await service.generate_recovery_codes(db_session, user)).codes

    status = await service.disable_two_factor(db_session, user, TotpVerifyIn(code=codes[0]))
    assert status.enabled is False
    assert await service._consume_recovery_code(db_session, user, codes[0]) is False


# ---------------------------------------------------------------------------
# Recovery codes
# ---------------------------------------------------------------------------

async def test_generate_recovery_codes_returns_codes(db_session, user):
    result = await service.generate_recovery_codes(db_session, user)
    assert len(result.codes) == 10
    assert result.last_generated_at is not None
    assert all("-" in code for code in result.codes)


async def test_regenerating_recovery_codes_invalidates_old(db_session, user):
    first = (await service.generate_recovery_codes(db_session, user)).codes
    second = (await service.generate_recovery_codes(db_session, user)).codes

    assert set(first) != set(second)
    assert await service._consume_recovery_code(db_session, user, first[0]) is False
    assert await service._consume_recovery_code(db_session, user, second[0]) is True


async def test_recovery_code_is_one_time_use(db_session, user):
    codes = (await service.generate_recovery_codes(db_session, user)).codes
    assert await service._consume_recovery_code(db_session, user, codes[0]) is True
    assert await service._consume_recovery_code(db_session, user, codes[0]) is False


# ---------------------------------------------------------------------------
# Active sessions ledger
# ---------------------------------------------------------------------------

async def test_record_login_session_creates_ledger_entry(db_session, user):
    token = create_access_token({"sub": user.email})
    jti = decode_access_token(token)["jti"]
    request = SimpleNamespace(
        headers={
            "user-agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
            )
        },
        client=SimpleNamespace(host="127.0.0.1"),
    )

    session = await service.record_login_session(db_session, user, token, request)
    assert session.user_id == user.id
    assert session.token_id == jti
    assert session.browser == "Chrome"
    assert session.os == "Windows"
    assert session.ip_address == "127.0.0.1"
    assert session.location_name is None


async def test_list_sessions_marks_current_and_orders(db_session, user):
    now = datetime.now(timezone.utc)
    older = await _add_session(db_session, user, "jti-old", last_seen_at=now)
    newer = await _add_session(db_session, user, "jti-new", last_seen_at=now + timedelta(minutes=5))

    sessions = await service.list_sessions(db_session, user, "jti-new")
    assert [s.id for s in sessions] == [newer.id, older.id]
    assert sessions[0].is_current is True
    assert sessions[1].is_current is False


async def test_list_sessions_excludes_revoked(db_session, user):
    active = await _add_session(db_session, user, "jti-active")
    await _add_session(db_session, user, "jti-revoked", revoked_at=datetime.now(timezone.utc))

    sessions = await service.list_sessions(db_session, user, None)
    assert [s.id for s in sessions] == [active.id]


async def test_revoke_session_revokes_and_returns_out(db_session, user):
    session = await _add_session(db_session, user, "jti-current")

    result = await service.revoke_session(db_session, user, session.id, "jti-current")
    assert result is not None
    assert result.session_id == session.id
    assert result.revoked is True
    assert result.was_current is True

    await db_session.refresh(session)
    assert session.revoked_at is not None


async def test_revoke_session_missing_returns_none(db_session, user):
    assert await service.revoke_session(db_session, user, 99999, None) is None


async def test_revoke_session_other_users_returns_none(db_session, user):
    other = await _add_user(db_session, "other@example.com")
    session = await _add_session(db_session, other, "jti-other")
    assert await service.revoke_session(db_session, user, session.id, None) is None


# ---------------------------------------------------------------------------
# Seed / catalogs
# ---------------------------------------------------------------------------

async def test_seed_defaults_fills_profile_defaults(db_session):
    admin = await _add_user(
        db_session,
        "admin@example.com",
        is_admin=True,
        preferred_language=None,
        regional_format=None,
        timezone=None,
    )
    await service.seed_defaults(db_session)
    await db_session.refresh(admin)

    assert admin.preferred_language == "en"
    assert admin.regional_format == "en-PK"
    assert admin.timezone == "Asia/Karachi"


async def test_list_regional_formats_contains_en_pk(db_session):
    formats = service.list_regional_formats()
    assert len(formats) >= 5
    assert any(f["code"] == "en-PK" for f in formats)


async def test_list_timezones_sorted_and_contains_karachi(db_session):
    zones = service.list_timezones()
    assert len(zones) > 100
    offsets = [z["utc_offset_minutes"] for z in zones]
    assert offsets == sorted(offsets)
    assert any(z["code"] == "Asia/Karachi" for z in zones)
