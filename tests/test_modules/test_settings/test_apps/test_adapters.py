"""
Tests for app.modules.settings.apps.adapters and app.modules.settings.apps.crypto
"""

import pytest

from app.modules.settings.apps import adapters
from app.modules.settings.apps.adapters import AdapterError
from app.modules.settings.apps.crypto import decrypt_credentials, encrypt_credentials


# ---------------------------------------------------------------------------
# Crypto (Fernet)
# ---------------------------------------------------------------------------

def test_encrypt_decrypt_round_trip():
    credentials = {"api_key": "sk_live_123", "from_email": "a@example.com"}
    token = encrypt_credentials(credentials)
    assert token != credentials["api_key"]
    assert decrypt_credentials(token) == credentials


def test_encrypt_decrypt_empty_credentials():
    assert encrypt_credentials(None) == ""
    assert encrypt_credentials({}) == ""
    assert decrypt_credentials(None) == {}
    assert decrypt_credentials("") == {}


def test_decrypt_tampered_token_returns_empty():
    assert decrypt_credentials("not-a-fernet-token") == {}


def test_encrypt_uses_fresh_iv_per_call():
    first = encrypt_credentials({"k": "v"})
    second = encrypt_credentials({"k": "v"})
    assert first != second
    assert decrypt_credentials(first) == {"k": "v"}
    assert decrypt_credentials(second) == {"k": "v"}


# ---------------------------------------------------------------------------
# Adapter dispatch
# ---------------------------------------------------------------------------

async def test_run_dispatches_to_registered_adapter(monkeypatch):
    async def fake_resend(payload):
        return {"success": True, "id": "evt_1"}

    monkeypatch.setitem(adapters.ADAPTERS["resend_email"], "send_email", fake_resend)
    result = await adapters.run(
        "resend_email", "send_email", {"to": "a@b.com", "subject": "Hi", "html": "<p>Hi</p>"}
    )
    assert result == {"success": True, "id": "evt_1"}


async def test_run_unknown_app_raises_adapter_error():
    with pytest.raises(AdapterError, match="No adapter registered"):
        await adapters.run("no_such_app", "send_email", {})


async def test_run_unsupported_action_raises_adapter_error():
    with pytest.raises(AdapterError, match="No adapter registered"):
        await adapters.run("resend_email", "send_sms", {})


async def test_adapter_missing_env_var_raises_adapter_error(monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.delenv("RESEND_FROM_EMAIL", raising=False)
    with pytest.raises(AdapterError, match="RESEND_API_KEY"):
        await adapters._resend_send_email(
            {"to": "a@b.com", "subject": "Hi", "html": "<p>Hi</p>"}
        )
