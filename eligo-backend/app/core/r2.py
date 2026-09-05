"""Cloudflare R2 object storage client.

Provides a thin wrapper around boto3 S3 for uploading, deleting, and
generating public URLs for objects in an R2 bucket.  Configured entirely
through the R2_* environment variables loaded by ``app.core.config``.
"""

from __future__ import annotations

import logging
import re
import uuid
from pathlib import Path

import boto3
from botocore.config import Config as BotoConfig

from app.core.config import settings

log = logging.getLogger(__name__)

_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp", ".tiff"}


class CloudflareR2:
    """Lazy-initialized R2 (S3-compatible) client."""

    def __init__(self) -> None:
        self._client = None

    # ------------------------------------------------------------------
    # Configuration helpers
    # ------------------------------------------------------------------

    @property
    def is_configured(self) -> bool:
        """Return True when all required R2 credentials are present."""
        return bool(
            settings.R2_BUCKET
            and settings.R2_ENDPOINT
            and settings.R2_ACCESS_KEY_ID
            and settings.R2_SECRET_ACCESS_KEY
        )

    @property
    def _s3(self):
        """Lazily create the boto3 S3 client on first use."""
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=BotoConfig(
                    signature_version="s3v4",
                    s3={"addressing_style": "path"},
                ),
            )
        return self._client

    @property
    def public_base(self) -> str:
        """Base URL for constructing public object links.

        If ``R2_PUBLIC_URL`` (custom domain / CNAME) is configured it is
        used; otherwise we fall back to the default R2.dev public
        gateway: ``https://<account-hash>.r2.dev``.
        """
        if settings.R2_PUBLIC_URL:
            return settings.R2_PUBLIC_URL.rstrip("/")
        # Fall back to the default R2.dev public access URL derived from the endpoint.
        # Endpoint format: https://<account-id>.r2.cloudflarestorage.com
        endpoint = settings.R2_ENDPOINT.rstrip("/")
        account_id = endpoint.split("//")[-1].split(".")[0] if "//" in endpoint else ""
        return f"https://{account_id}.r2.dev"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def upload(
        self,
        data: bytes,
        key: str,
        content_type: str = "image/webp",
    ) -> str:
        """Upload *data* to the bucket under *key* and return the public URL.

        Objects are stored with a long-lived ``Cache-Control`` header so
        that CDNs and browsers can cache aggressively.
        """
        self._s3.put_object(
            Bucket=settings.R2_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
        )
        url = f"{self.public_base}/{key}"
        log.info("R2 upload: %s (%d bytes)", url, len(data))
        return url

    def delete(self, key: str) -> None:
        """Delete an object from the bucket."""
        self._s3.delete_object(Bucket=settings.R2_BUCKET, Key=key)
        log.info("R2 delete: %s", key)

    def extract_key(self, url: str) -> str | None:
        """Extract the object key from a full R2 URL, or None if it does not
        belong to this bucket."""
        base = self.public_base + "/"
        if url.startswith(base):
            return url[len(base):]
        return None


# ---------------------------------------------------------------------------
# Module-level singleton – import and use directly
# ---------------------------------------------------------------------------

r2 = CloudflareR2()


# ---------------------------------------------------------------------------
# Helpers used by content.service to build object keys
# ---------------------------------------------------------------------------

def _safe_stem(filename: str) -> str:
    """Sanitise a filename stem for use as an R2 object key component."""
    stem = Path(filename).stem
    safe = re.sub(r"[^A-Za-z0-9_-]+", "_", stem)[:60] or "file"
    return safe


def make_upload_key(filename: str, folder: str = "general") -> str:
    """Return a unique object key like ``uploads/products/abc12345_my_photo.webp``."""
    suffix = Path(filename).suffix.lower() if "." in filename else ".webp"
    if suffix not in _ALLOWED_EXTENSIONS:
        suffix = ".webp"
    unique = uuid.uuid4().hex[:12]
    safe = _safe_stem(filename)
    folder = re.sub(r"[^a-z0-9_-]+", "_", folder.strip("/").lower()) or "general"
    return f"uploads/{folder}/{unique}_{safe}{suffix}"
