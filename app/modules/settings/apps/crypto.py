"""Symmetric encryption for third-party API credentials.

Uses Fernet (AES-128-CBC + HMAC) with a key derived from the app SECRET_KEY,
so no extra secrets need to be managed. Swap this module for a KMS / vault if
credentials must be stored in a more hardened environment.
Why use Fernet?

Fernet provides several security features automatically:

✅ AES-128 encryption (CBC mode)
✅ HMAC authentication (detects tampering)
✅ Random initialization vector (IV)
✅ Timestamp embedded in the token
✅ URL-safe Base64 encoding

You don't have to implement these details yourself.
"""

import base64
import hashlib
import json

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(key)


def encrypt_credentials(credentials: dict | None) -> str:
    if not credentials:
        return ""
    payload = json.dumps(credentials).encode("utf-8")
    return _fernet().encrypt(payload).decode("utf-8")


def decrypt_credentials(token: str | None) -> dict:
    if not token:
        return {}
    try:
        return json.loads(_fernet().decrypt(token.encode("utf-8")).decode("utf-8"))
    except InvalidToken:
        return {}
