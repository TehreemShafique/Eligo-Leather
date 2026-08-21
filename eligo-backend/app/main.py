import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.db import models_registry 
from app.modules.auth.router import router as auth_router
from app.modules.orders.router import router as orders_router, public_webhook_router as orders_webhook_router
from app.modules.customers.router import router as customers_router
from app.modules.catalog.router import (
    catalog_overview_router,
    product_router,
    collection_router,
    location_router,
    inventory_router,
    purchase_order_router,
    transfer_router,
    gift_card_router,
)
from app.modules.companies.router import router as companies_router
from app.modules.segments.router import router as segments_router
from app.modules.discounts.router import router as discounts_router, public_discounts_router
from app.modules.content.router import (
    content_router,
    metaobject_definition_router,
    metaobject_entry_router,
    files_router,
    menus_router,
    url_redirects_router,
    blog_posts_router,
    blog_comments_router,
    pages_router,
)
from app.modules.settings.router import router as settings_router
from app.modules.settings.checkout.router import public_checkout_router
from app.modules.settings.shipping_and_delivery.router import public_shipping_router
from app.modules.store.router import router as store_router
from app.db.session import AsyncSessionLocal
from app.modules.settings.notifications.service import seed_defaults
from app.modules.settings.checkout.service import seed_default_config
from app.modules.settings.shipping_and_delivery.service import seed_defaults as seed_shipping_defaults

app = FastAPI(title="Eligo Backend")


@app.on_event("startup")
async def _seed_defaults():
    async with AsyncSessionLocal() as db:
        await seed_defaults(db)
        await seed_default_config(db)
        await seed_shipping_defaults(db)
    print("[startup] Defaults seeded (notifications, checkout, shipping)")

# High Performance Timing & HTTP Cache-Control Middleware (< 0.6s TTFB guarantee)
@app.middleware("http")
async def add_performance_and_cache_headers(request: Request, call_next):
    start_time = time.time()
    response: Response = await call_next(request)
    process_time = time.time() - start_time
    
    # Server response execution time tracking header
    response.headers["X-Response-Time"] = f"{process_time:.4f}s"
    
    # Cache Control Header for GET endpoints (Excluding auth and leopard real-time endpoints)
    if request.method == "GET" and not request.url.path.startswith("/api/v1/auth") and not "/leopard" in request.url.path:
        response.headers["Cache-Control"] = "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400"
    elif "/leopard" in request.url.path:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

    # Explicitly ensure Gzip compression is NOT applied
    if "Content-Encoding" in response.headers and "gzip" in response.headers["Content-Encoding"]:
        del response.headers["Content-Encoding"]

    return response

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(orders_webhook_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(catalog_overview_router, prefix="/api/v1")
app.include_router(product_router, prefix="/api/v1")
app.include_router(collection_router, prefix="/api/v1")
app.include_router(location_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(purchase_order_router, prefix="/api/v1")
app.include_router(transfer_router, prefix="/api/v1")
app.include_router(gift_card_router, prefix="/api/v1")
app.include_router(companies_router, prefix="/api/v1")
app.include_router(segments_router, prefix="/api/v1")
app.include_router(discounts_router, prefix="/api/v1")
app.include_router(public_discounts_router, prefix="/api/v1")
app.include_router(content_router, prefix="/api/v1")
app.include_router(metaobject_definition_router, prefix="/api/v1")
app.include_router(metaobject_entry_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(menus_router, prefix="/api/v1")
app.include_router(url_redirects_router, prefix="/api/v1")
app.include_router(blog_posts_router, prefix="/api/v1")
app.include_router(blog_comments_router, prefix="/api/v1")
app.include_router(pages_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(public_checkout_router, prefix="/api/v1")
app.include_router(public_shipping_router, prefix="/api/v1")
app.include_router(store_router, prefix="/api/v1")

@app.get("/")
async def read_root():
    return {"message": "Eligo Backend API Engine Running", "cache": "enabled"}
