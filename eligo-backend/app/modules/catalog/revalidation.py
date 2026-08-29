"""Best-effort on-demand cache purge of the storefront.

The customer-facing UI (a separate Next.js app) caches catalog data via ISR
tagged with `catalog`. When an admin creates, updates, or deletes a product we
notify the storefront so it revalidates immediately instead of waiting up to
`revalidate` seconds (during which a deleted product could still be shown and
even ordered).

This is intentionally best-effort: failures are logged and swallowed so a
storefront being unreachable never breaks the admin operation.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

_DEFAULT_STORE_URL = "http://localhost:3000"
_DEFAULT_SECRET = "change-me-to-a-long-random-string"
_TIMEOUT = httpx.Timeout(5.0)


async def purge_catalog_cache() -> None:
    store_url = os.getenv("STORE_URL", _DEFAULT_STORE_URL).rstrip("/")
    secret = os.getenv("STORE_REVALIDATE_SECRET", _DEFAULT_SECRET)
    if not store_url or not secret:
        return

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                f"{store_url}/api/revalidate",
                json={"secret": secret},
                headers={"x-revalidate-secret": secret},
            )
        if response.status_code >= 400:
            logger.warning(
                "Storefront revalidate failed (%s): %s",
                response.status_code,
                response.text[:200],
            )
    except httpx.HTTPError as exc:
        logger.warning("Storefront revalidate request failed: %s", exc)
