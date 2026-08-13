"""Sales channel provider adapters.

Every connected channel's actions are dispatched here. Each adapter receives:

    auth_tokens  - decrypted dict of the channel's OAuth tokens / credentials
    settings     - channel-specific config stored on the sales_channels row
    payload      - the request payload from the sync / webhook endpoints

The real provider APIs go inside the marked sections below. Until they are
wired up, adapters return a clear "not wired" message so the admin UI can show
the channel as configured-but-not-connected.

=============================================================================
HOW TO ADD THE META (FACEBOOK & INSTAGRAM) API  <-- READ THIS FIRST
=============================================================================
Meta Commerce / Graph API lets you sync your product catalog to Facebook &
Instagram Shops and receive orders. The flow has 4 parts:

  1. META APP
     - Go to https://developers.facebook.com -> My Apps -> Create App
       (type: Business). You get an App ID + App Secret.
     - In App Settings -> Basic, add the OAuth redirect/callback URI:
       https://YOUR_DOMAIN/api/v1/settings/sales-channels/webhooks/facebook_instagram/oauth/callback
     - Add the "Marketing API" + "Pages" products, enable "Advanced Access".

  2. OAUTH (connect button in admin panel)
     - Send the merchant to the authorize URL (already built in
       sales_channels/service.py -> get_oauth_authorize_url()):
         GET https://www.facebook.com/v19.0/dialog/oauth?\
             client_id={APP_ID}\
             &redirect_uri={CALLBACK}\
             &state={random_state}\
             &scope=email,catalog_management,instagram_basic,instagram_manage_insights,\
             pages_manage_ads,pages_show_list,business_management
     - The merchant logs in and authorizes. Meta redirects the browser back to
       the callback URL with ?code=... (this is handled by
       handle_oauth_callback() in the service).

  3. EXCHANGE CODE FOR TOKEN (server side, NEVER expose app secret)
     a. Short-lived access token:
          GET https://graph.facebook.com/v19.0/oauth/access_token?\
              client_id={APP_ID}&client_secret={APP_SECRET}\
              &redirect_uri={CALLBACK}&code={CODE}
     b. Exchange for long-lived (60 day) token:
          GET https://graph.facebook.com/v19.0/oauth/access_token?\
              grant_type=fb_exchange_token&client_id={APP_ID}\
              &client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}
     c. Store the long-lived token in auth_tokens["access_token"] (encrypted).
        Optionally refresh before expiry (no expiry once a business verifies).

  4. RESOURCES YOU NEED (query after connecting):
     - Page token:  GET /me/accounts -> page access token (pages_show_list)
     - Business:    GET /me?fields=id,business  -> business id
     - Product catalog:
         GET /{business_id}?fields=owned_product_catalogs  -> catalog id
         (or create one: POST /{business_id}/owned_product_catalogs)
     Store these ids in auth_tokens: page_id, business_id, product_catalog_id.

  Then the three actions below will actually talk to Graph API.
=============================================================================
"""


class ChannelAdapterError(Exception):
    """Raised when an adapter call fails (bad token, provider error, etc.)."""


# ============================ ONLINE STORE ============================


async def _online_store_sync_products(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """Online Store - native channel, no external API to call."""
    return {"success": True, "message": "Online Store is native; no external sync needed."}


async def _online_store_ingest_order(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """Online Store - orders come from your own storefront API."""
    return {"success": True, "message": "Online Store orders are created natively."}


# ============================ META (FB / IG) ==========================


async def _meta_sync_catalog(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """Facebook & Instagram - push products/variants to the Meta product catalog."""
    # =================================================================
    # ADD META COMMERCE CATALOG SYNC API HERE
    # -----------------------------------------------------------------
    # import httpx
    # access_token = auth_tokens["access_token"]
    # catalog_id   = auth_tokens["product_catalog_id"]
    # api_version  = "v19.0"
    # headers      = {"Authorization": f"Bearer {access_token}"}
    #
    # For each product in payload["products"]:
    #   1. Create/update product (set inventory is in sync step):
    #      POST https://graph.facebook.com/{api_version}/{catalog_id}/products
    #      {"retailer_id": product["sku"], "name": product["title"],
    #       "description": product["description"], "brand": "Eligo Leather",
    #       "category_id": <commerce_category_id>, "image_url": <first image>,
    #       "price": product["price"], "currency": "PKR", "availability": "in stock"}
    #   2. For variants use the product-item endpoint with "inventory" ids.
    # Results are collected in a list; return {"success": True, "results": results}.
    # =================================================================
    return {
        "success": False,
        "message": "Meta Commerce Catalog API not wired yet - add it in "
        "app/modules/settings/sales_channels/adapters/__init__.py",
    }


async def _meta_sync_inventory(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """Facebook & Instagram - push live stock levels to the Meta catalog."""
    # =================================================================
    # ADD META INVENTORY SYNC API HERE
    # -----------------------------------------------------------------
    # import httpx
    # access_token = auth_tokens["access_token"]
    # api_version  = "v19.0"
    # headers      = {"Authorization": f"Bearer {access_token}"}
    #
    # For each variant in payload["variants"]:
    #   POST https://graph.facebook.com/{api_version}/{catalog_id}/product_items
    #   {"retailer_id": variant["sku"], "availability": "in stock" if qty > 0 else "out of stock",
    #    "inventory": {"quantity": variant["inventory_quantity"]}}
    # =================================================================
    return {
        "success": False,
        "message": "Meta Inventory API not wired yet - add it in "
        "app/modules/settings/sales_channels/adapters/__init__.py",
    }


async def _meta_ingest_order(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """Facebook & Instagram - convert a Meta order webhook into a native order.

    The service layer already logged the raw webhook in `channel_webhook_events`
    and extracted `payload["order"]` (see sales_channels/service.py). This
    adapter only enriches / normalizes provider-specific fields.
    """
    # =================================================================
    # ADD META ORDER MAPPING HERE (if your provider payload needs it)
    # -----------------------------------------------------------------
    # Meta Commerce sends order webhooks to the URL you subscribed in the
    # Meta app (App Dashboard -> Webhooks -> Commerce Account Activity).
    # The service layer's ingest_order() already maps the common fields
    # (customer, line items, totals). If you need provider-specific extras:
    #
    #   order_data = payload["order"]
    #   mapped = {
    #       "order_number": order_data.get("merchant_order_id") or uuid4().hex,
    #       "channel": "Facebook & Instagram",
    #       "customer_name": ...,  # flatten buyer / shipping_address fields
    #       "customer_phone": ...,
    #       "shipping_address": json.dumps(order_data.get("shipping_address")),
    #       ...
    #   }
    #   return {"success": True, "mapped_order": mapped}
    #
    # If payload is already fully mapped by the service, just return it:
    # =================================================================
    return {"success": True, "mapped_order": payload.get("order", payload)}


# ============================ TIKTOK SHOP ============================


async def _tiktok_sync_catalog(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """TikTok Shop - push products to TikTok Seller Center."""
    # =================================================================
    # ADD TIKTOK SHOP CATALOG API HERE
    # -----------------------------------------------------------------
    # TikTok Shop has its own OAuth + REST API (open-api.tiktokglobalshop.com).
    # You need: app_key, app_secret, seller_shop_id (stored in auth_tokens).
    # Endpoint (v2): POST /product/upload ...
    # =================================================================
    return {
        "success": False,
        "message": "TikTok Shop API not wired yet - add it in "
        "app/modules/settings/sales_channels/adapters/__init__.py",
    }


async def _tiktok_ingest_order(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """TikTok Shop - order webhook conversion (same shape as Meta)."""
    # =================================================================
    # ADD TIKTOK ORDER WEBHOOK MAPPING HERE
    # =================================================================
    return {"success": True, "mapped_order": payload.get("order", payload)}


# ============================ GOOGLE SHOPPING =========================


async def _google_sync_catalog(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """Google Shopping - push products to Google Merchant Center."""
    # =================================================================
    # ADD GOOGLE MERCHANT CENTER API HERE
    # -----------------------------------------------------------------
    # Google uses OAuth2 (service account or client) + the Content API for
    # Shopping. You need: merchant_id, oauth service account json.
    # POST https://shoppingcontent.googleapis.com/content/v2.1/{merchant_id}/products
    # product payload uses Google's "products" schema with id = sku.
    # =================================================================
    return {
        "success": False,
        "message": "Google Merchant Center API not wired yet - add it in "
        "app/modules/settings/sales_channels/adapters/__init__.py",
    }


async def _google_ingest_order(auth_tokens: dict, settings: dict, payload: dict) -> dict:
    """Google Shopping - order webhook conversion (same shape as Meta)."""
    # =================================================================
    # ADD GOOGLE ORDER WEBHOOK MAPPING HERE
    # =================================================================
    return {"success": True, "mapped_order": payload.get("order", payload)}


# =====================================================================
# CHANNEL ADAPTER REGISTRY
# Maps channel_code -> { action_name: adapter_callable }
# When you add a new channel, register its adapter here as well.
# =====================================================================

ADAPTERS: dict[str, dict[str, callable]] = {
    "online_store": {
        "sync_products": _online_store_sync_products,
        "ingest_order": _online_store_ingest_order,
    },
    "facebook_instagram": {
        "sync_catalog": _meta_sync_catalog,
        "sync_inventory": _meta_sync_inventory,
        "ingest_order": _meta_ingest_order,
    },
    "tiktok_shop": {
        "sync_catalog": _tiktok_sync_catalog,
        "ingest_order": _tiktok_ingest_order,
    },
    "google_shopping": {
        "sync_catalog": _google_sync_catalog,
        "ingest_order": _google_ingest_order,
    },
}


async def run(channel_code: str, action: str, auth_tokens: dict, settings: dict, payload: dict) -> dict:
    adapter = ADAPTERS.get(channel_code, {}).get(action)
    if adapter is None:
        raise ChannelAdapterError(
            f"No adapter registered for channel '{channel_code}' action '{action}'. "
            "Add it in app/modules/settings/sales_channels/adapters/__init__.py"
        )
    return await adapter(auth_tokens, settings, payload)
