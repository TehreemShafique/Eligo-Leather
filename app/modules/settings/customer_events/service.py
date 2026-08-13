from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.customer_events import adapters
from app.modules.settings.customer_events.adapters import PixelAdapterError
from app.modules.settings.customer_events.model import (
    PixelDataHealth,
    PixelEventLog,
    PixelKind,
    PixelPlacement,
    PixelProvider,
    TrackingPixel,
)
from app.modules.settings.customer_events.schema import (
    PixelCreate,
    PixelDefinition,
    PixelEventIn,
    PixelEventLogOut,
    PixelEventOut,
    PixelScriptOut,
    PixelUpdate,
)

# =====================================================================
# PIXEL INTEGRATION CATALOG
# =====================================================================
# Shown in the 'Explore pixel integrations' modal. Each entry carries the
# ready-to-inject script template (web) and whether it supports server-side
# events. Templates use {PIXEL_ID} / {PIXEL_NAME} placeholders, replaced at
# injection time from the pixel row.
# =====================================================================

PIXEL_DEFINITIONS: list[dict] = [
    {
        "provider": "facebook",
        "name": "Facebook Pixel",
        "description": "Track conversions, optimize ads and build audiences on Facebook.",
        "kind": "web",
        "placement": "head",
        "supports_server": True,
        "supports_custom_events": True,
        "template": (
            "<!-- Meta Pixel Code -->\n"
            "<script>\n"
            "!function(f,b,e,v,n,t,s)\n"
            "{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n"
            "n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n"
            "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\n"
            "n.queue=[];t=b.createElement(e);t.async=!0;\n"
            "t.src=v;s=b.getElementsByTagName(e)[0];\n"
            "s.parentNode.insertBefore(t,s)}(window, document,'script',\n"
            "'https://connect.facebook.net/en_US/fbevents.js');\n"
            "fbq('init', '{PIXEL_ID}');\n"
            "fbq('track', 'PageView');\n"
            "</script>\n"
            "<noscript><img height=\"1\" width=\"1\" style=\"display:none\"\n"
            "src=\"https://www.facebook.com/tr?id={PIXEL_ID}&ev=PageView&noscript=1\"/></noscript>\n"
            "<!-- End Meta Pixel Code -->"
        ),
    },
    {
        "provider": "instagram",
        "name": "Instagram Pixel",
        "description": "Measure and optimize Instagram ads (uses the Meta Pixel).",
        "kind": "web",
        "placement": "head",
        "supports_server": True,
        "supports_custom_events": True,
        # Template copied from the Facebook entry in the loop below.
        "template": None,
    },
    {
        "provider": "google_analytics",
        "name": "Google Analytics 4",
        "description": "Understand customer behavior and marketing performance.",
        "kind": "web",
        "placement": "head",
        "supports_server": True,
        "supports_custom_events": True,
        "template": (
            "<!-- Google tag (gtag.js) -->\n"
            "<script async src=\"https://www.googletagmanager.com/gtag/js?id={PIXEL_ID}\"></script>\n"
            "<script>\n"
            "  window.dataLayer = window.dataLayer || [];\n"
            "  function gtag(){dataLayer.push(arguments);}\n"
            "  gtag('js', new Date());\n"
            "  gtag('config', '{PIXEL_ID}');\n"
            "</script>"
        ),
    },
    {
        "provider": "microsoft_clarity",
        "name": "Microsoft Clarity",
        "description": "Free heatmaps and session recordings of your visitors.",
        "kind": "web",
        "placement": "head",
        "supports_server": False,
        "supports_custom_events": False,
        "template": (
            "<script type=\"text/javascript\">\n"
            "    (function(c,l,a,r,i,t,y){\n"
            "        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\n"
            "        t=l.createElement(r);t.async=1;t.src=\"https://www.clarity.ms/tag/\"+i;\n"
            "        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n"
            "    })(window, document, \"clarity\", \"script\", \"{PIXEL_ID}\");\n"
            "</script>"
        ),
    },
    {
        "provider": "judge_me",
        "name": "Judge.me Reviews",
        "description": "Display and track product reviews on your storefront.",
        "kind": "web",
        "placement": "body_end",
        "supports_server": False,
        "supports_custom_events": False,
        "template": (
            "<!-- Judge.me widget -->\n"
            "<script async src=\"https://cdn.judge.me/widget.js\"></script>\n"
            "<script>window.JudgeMe=window.JudgeMe||[];JudgeMe.push({id:'{PIXEL_ID}'});</script>"
        ),
    },
    {
        "provider": "tiktok",
        "name": "TikTok Pixel",
        "description": "Track conversions and optimize TikTok ads.",
        "kind": "web",
        "placement": "head",
        "supports_server": True,
        "supports_custom_events": True,
        "template": (
            "<script>\n"
            "!function (w, d, t) {\n"
            "  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=[\"page\",\"track\",\"identify\",\"instances\",\"debug\",\"on\",\"off\",\"once\",\"ready\",\"alias\",\"group\",\"enableCookie\",\"disableCookie\"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i=\"https://analytics.tiktok.com/i18n/pixel/events.js\";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement(\"script\");o.type=\"text/javascript\",o.async=!0,o.src=i+\"?sdkid=\"+e+\"&lib=\"+t;var a=document.getElementsByTagName(\"script\")[0];a.parentNode.insertBefore(o,a)}(window,document,\"ttq\");\n"
            "  ttq.load('{PIXEL_ID}');\n"
            "  ttq.page();\n"
            "}(window, document, 'ttq');\n"
            "</script>"
        ),
    },
    {
        "provider": "pinterest",
        "name": "Pinterest Tag",
        "description": "Track conversions and build audiences on Pinterest.",
        "kind": "web",
        "placement": "head",
        "supports_server": True,
        "supports_custom_events": True,
        "template": (
            "<script type=\"text/javascript\">\n"
            "!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version=\"3.0\";var t=document.createElement(\"script\");t.async=!0,t.src=e;var r=document.getElementsByTagName(\"script\")[0];r.parentNode.insertBefore(t,r)}}(\"https://s.pinimg.com/ct/core.js\");\n"
            "pintrk('load', '{PIXEL_ID}');\n"
            "pintrk('page');\n"
            "</script>\n"
            "<noscript><img height=\"1\" width=\"1\" style=\"display:none;\" alt=\"\" src=\"https://ct.pinterest.com/v3/?event=init&tid={PIXEL_ID}&noscript=1\" /></noscript>"
        ),
    },
    {
        "provider": "snapchat",
        "name": "Snapchat Pixel",
        "description": "Track conversions and optimize Snapchat ads.",
        "kind": "web",
        "placement": "head",
        "supports_server": True,
        "supports_custom_events": True,
        "template": (
            "<script>\n"
            "(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');\n"
            "snaptr('init', '{PIXEL_ID}');\n"
            "snaptr('track', 'PAGE_VIEW');\n"
            "</script>"
        ),
    },
    {
        "provider": "custom",
        "name": "Custom Script",
        "description": "Paste your own tracking JavaScript or third-party snippet.",
        "kind": "web",
        "placement": "body_end",
        "supports_server": False,
        "supports_custom_events": False,
        "template": None,
    },
]

# ---------------------------------------------------------------------
# The instagram template must reuse the facebook snippet; set it below to
# avoid referencing PIXEL_DEFINITIONS while it is still being built.
# ---------------------------------------------------------------------
for _def in PIXEL_DEFINITIONS:
    if _def["provider"] == "instagram":
        _def["template"] = PIXEL_DEFINITIONS[0]["template"]

_DEFINITIONS_BY_PROVIDER: dict[str, dict] = {d["provider"]: d for d in PIXEL_DEFINITIONS}

DEFAULT_EVENT_TYPES = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"]


def list_definitions() -> list[PixelDefinition]:
    return [
        PixelDefinition(
            provider=d["provider"],
            name=d["name"],
            description=d["description"],
            kind=d["kind"],
            placement=d["placement"],
            supports_server=d["supports_server"],
            supports_custom_events=d["supports_custom_events"],
        )
        for d in PIXEL_DEFINITIONS
    ]


# =====================================================================
# Pixel CRUD
# =====================================================================

async def list_pixels(db: AsyncSession, include_inactive: bool = False) -> list[TrackingPixel]:
    query = select(TrackingPixel).order_by(TrackingPixel.created_at.desc())
    if not include_inactive:
        query = query.where(TrackingPixel.is_active == True)  # noqa: E712
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_pixel(pixel_id: int, db: AsyncSession) -> TrackingPixel | None:
    return await db.get(TrackingPixel, pixel_id)


async def create_pixel(data: PixelCreate, db: AsyncSession) -> TrackingPixel:
    definition = _DEFINITIONS_BY_PROVIDER.get(data.provider)
    script = data.script_content
    if not script and definition and definition["template"]:
        script = definition["template"].replace(
            "{PIXEL_ID}", data.pixel_id or ""
        ).replace("{PIXEL_NAME}", data.name)

    pixel = TrackingPixel(
        name=data.name,
        provider=data.provider,
        kind=data.kind,
        pixel_id=data.pixel_id,
        script_content=script or data.script_content,
        placement=data.placement,
        data_health=data.data_health,
        event_types=data.event_types,
        is_active=data.is_active,
        app_code=data.app_code,
    )
    db.add(pixel)
    await db.commit()
    await db.refresh(pixel)
    return pixel


async def update_pixel(pixel_id: int, data: PixelUpdate, db: AsyncSession) -> TrackingPixel | None:
    pixel = await get_pixel(pixel_id, db)
    if not pixel:
        return None

    payload = data.model_dump(exclude_unset=True)

    # If pixel_id changed and no custom script was given, regenerate the
    # provider snippet so the injected script stays in sync.
    if "pixel_id" in payload and "script_content" not in payload and pixel.provider != PixelProvider.custom:
        definition = _DEFINITIONS_BY_PROVIDER.get(pixel.provider.value)
        if definition and definition["template"]:
            payload["script_content"] = definition["template"].replace(
                "{PIXEL_ID}", payload["pixel_id"] or ""
            ).replace("{PIXEL_NAME}", pixel.name)

    for field, value in payload.items():
        setattr(pixel, field, value)

    await db.commit()
    await db.refresh(pixel)
    return pixel


async def set_active(pixel_id: int, is_active: bool, db: AsyncSession) -> TrackingPixel | None:
    pixel = await get_pixel(pixel_id, db)
    if not pixel:
        return None
    pixel.is_active = is_active
    await db.commit()
    await db.refresh(pixel)
    return pixel


async def delete_pixel(pixel_id: int, db: AsyncSession) -> bool:
    pixel = await get_pixel(pixel_id, db)
    if not pixel:
        return False
    await db.delete(pixel)
    await db.commit()
    return True


# =====================================================================
# Storefront injection
# =====================================================================

async def get_storefront_scripts(
    db: AsyncSession, placement: PixelPlacement | None = None
) -> list[PixelScriptOut]:
    """Return all active pixels as ready-to-inject script blocks.

    The storefront template engine calls this (or the public endpoint) and
    renders each script at its `placement` slot: <head>, <body> top/bottom,
    or on the checkout page.
    """
    query = select(TrackingPixel).where(TrackingPixel.is_active == True)  # noqa: E712
    if placement is not None:
        query = query.where(TrackingPixel.placement == placement)
    result = await db.execute(query)

    scripts: list[PixelScriptOut] = []
    for pixel in result.scalars().all():
        script = pixel.script_content
        if not script:
            definition = _DEFINITIONS_BY_PROVIDER.get(pixel.provider.value)
            if definition and definition["template"]:
                script = definition["template"].replace(
                    "{PIXEL_ID}", pixel.pixel_id or ""
                ).replace("{PIXEL_NAME}", pixel.name)
        if script:
            scripts.append(
                PixelScriptOut(
                    id=pixel.id,
                    name=pixel.name,
                    provider=pixel.provider,
                    kind=pixel.kind,
                    placement=pixel.placement,
                    pixel_id=pixel.pixel_id,
                    script=script,
                )
            )
    return scripts


# =====================================================================
# Server-side event dispatch
# =====================================================================

async def dispatch_event(data: PixelEventIn, db: AsyncSession) -> PixelEventOut:
    """Send a server-side conversion event to the provider's event API."""
    pixel = None
    if data.pixel_id:
        result = await db.execute(select(TrackingPixel).where(TrackingPixel.pixel_id == data.pixel_id))
        pixel = result.scalar_one_or_none()

    payload = {
        "provider": data.provider.value,
        "event_type": data.event_type,
        "payload": data.payload,
        "pixel_id": data.pixel_id,
    }
    log = PixelEventLog(
        pixel_id=pixel.id if pixel else None,
        provider=data.provider.value,
        event_type=data.event_type,
        payload=data.payload,
    )

    try:
        response = await adapters.dispatch(data.provider.value, pixel.app_code if pixel else None, db, payload)
        log.success = bool(response.get("success"))
        log.response = str(response)
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return PixelEventOut(
            success=log.success,
            provider=data.provider,
            event_type=data.event_type,
            response=response,
        )
    except PixelAdapterError as exc:
        log.success = False
        log.response = str(exc)
        db.add(log)
        await db.commit()
        return PixelEventOut(
            success=False,
            provider=data.provider,
            event_type=data.event_type,
            response={"error": str(exc)},
        )


async def list_event_logs(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[PixelEventLog]:
    result = await db.execute(
        select(PixelEventLog)
        .order_by(PixelEventLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())
