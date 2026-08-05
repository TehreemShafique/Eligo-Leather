import re

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.legal_privacy.model import (
    PolicyType,
    StorePolicy,
    StorePrivacySettings,
)
from app.modules.settings.legal_privacy.schema import (
    PrivacySettingsOut,
    PrivacySettingsSaveResponse,
    PrivacySettingsUpdate,
    PublicPolicyOut,
    PublicPrivacySettingsOut,
    StorePolicyOut,
    StorePolicyUpdate,
)

# =====================================================================
# CONSTANTS / CATALOGS
# =====================================================================

OPT_OUT_LABEL = "Do Not Sell My Info"
OPT_OUT_URL = "/pages/opt-out"

# System templates - the "automated" content merchants get for free. The
# {store_name} placeholder is kept simple; a real store can interpolate
# StoreSettings at render time.
DEFAULT_POLICIES: list[dict] = [
    {
        "policy_type": PolicyType.privacy_policy,
        "title": "Privacy Policy",
        "content": (
            "<p>This Privacy Policy explains how {store_name} collects, uses, "
            "and protects your personal information when you visit our store or "
            "make a purchase.</p>"
            "<h3>Information we collect</h3>"
            "<p>We collect order details, contact information, and payment "
            "information needed to fulfil your purchase. We may also collect "
            "limited analytics data to improve your experience.</p>"
            "<h3>How we use your information</h3>"
            "<p>We use your information to process orders, provide support, and - "
            "with your consent - send marketing communications.</p>"
            "<h3>Your rights</h3>"
            "<p>Depending on your region (for example under GDPR or CCPA), you may "
            "request access to, correction of, or deletion of your personal data. "
            "To do so, contact us or use our data opt-out page.</p>"
        ),
    },
    {
        "policy_type": PolicyType.refund_policy,
        "title": "Refund Policy",
        "content": (
            "<p>We want you to be completely satisfied with your purchase. This "
            "Refund Policy describes how {store_name} handles returns and refunds.</p>"
            "<h3>Return window</h3>"
            "<p>You may return unused items within 14 days of delivery for a refund "
            "or exchange, subject to the item being in its original condition and "
            "packaging.</p>"
            "<h3>How refunds work</h3>"
            "<p>Once we receive and inspect your return, we will process your refund "
            "to the original payment method within 5-7 business days.</p>"
        ),
    },
    {
        "policy_type": PolicyType.terms_of_service,
        "title": "Terms of Service",
        "content": (
            "<p>Welcome to {store_name}. By accessing or purchasing from our store, "
            "you agree to the following terms and conditions.</p>"
            "<h3>Products and pricing</h3>"
            "<p>We make every effort to display product information and pricing "
            "accurately. We reserve the right to correct errors and to refuse or "
            "cancel orders where necessary.</p>"
            "<h3>Limitation of liability</h3>"
            "<p>To the fullest extent permitted by law, {store_name} shall not be "
            "liable for any indirect, incidental, or consequential damages arising "
            "from your use of the store.</p>"
        ),
    },
    {
        "policy_type": PolicyType.shipping_policy,
        "title": "Shipping Policy",
        "content": (
            "<p>This Shipping Policy explains how {store_name} prepares and "
            "delivers your orders.</p>"
            "<h3>Processing time</h3>"
            "<p>Orders are typically processed and dispatched within 1-2 business "
            "days after payment is confirmed.</p>"
            "<h3>Delivery</h3>"
            "<p>Delivery times vary by destination. You will receive tracking "
            "details once your order ships. Please allow additional time during "
            "peak periods.</p>"
        ),
    },
    {
        "policy_type": PolicyType.legal_notice,
        "title": "Legal Notice",
        "content": (
            "<p>This is the legal notice for {store_name}.</p>"
            "<h3>Site content</h3>"
            "<p>All content, designs, and materials on this site are the property of "
            "{store_name} unless otherwise stated and may not be reproduced without "
            "written permission.</p>"
            "<h3>Contact</h3>"
            "<p>For legal enquiries, please contact us through the store's support "
            "channel.</p>"
        ),
    },
]

_POLICY_BY_TYPE: dict[PolicyType, dict] = {p["policy_type"]: p for p in DEFAULT_POLICIES}


def list_default_policies() -> list[dict]:
    return DEFAULT_POLICIES


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    return slug or "menu"


def _template_for(policy_type: PolicyType) -> dict | None:
    return _POLICY_BY_TYPE.get(policy_type)


# =====================================================================
# STORE POLICIES
# =====================================================================


async def list_policies(db: AsyncSession) -> list[StorePolicyOut]:
    result = await db.execute(
        select(StorePolicy).order_by(StorePolicy.policy_type)
    )
    return [_policy_out(p) for p in result.scalars().all()]


async def get_policy(db: AsyncSession, policy_type: PolicyType) -> StorePolicyOut | None:
    result = await db.execute(
        select(StorePolicy).where(StorePolicy.policy_type == policy_type)
    )
    policy = result.scalar_one_or_none()
    return _policy_out(policy) if policy else None


async def upsert_policy(data: StorePolicyUpdate, db: AsyncSession) -> StorePolicyOut:
    """PUT semantics: validate the type, then insert-or-update the row.

    A unique constraint on `policy_type` guarantees one row per disclosure,
    so repeated saves never create duplicate policies.

    Content-vs-automation resolution (in priority order):
      1. Explicit ``is_automated=True``  -> regenerate from the template.
      2. Custom ``content`` supplied     -> store it, flip to manual edit.
      3. Explicit ``is_automated=False`` -> keep existing content, manual mode.
      4. Neither supplied                -> keep current state (template if new).
    This way the flag and the body can never drift apart and a merchant's
    custom text is never silently overwritten.
    """
    template = _template_for(data.policy_type)
    if template is None:
        raise ValueError(f"Unsupported policy type '{data.policy_type}'")

    result = await db.execute(
        select(StorePolicy).where(StorePolicy.policy_type == data.policy_type)
    )
    policy = result.scalar_one_or_none()

    if data.is_automated is True:
        content, automated = template["content"], True
    elif data.content is not None:
        content, automated = data.content, False
    elif data.is_automated is False:
        content = policy.content if policy is not None else template["content"]
        automated = False
    else:
        content = policy.content if policy is not None else template["content"]
        automated = policy.is_automated if policy is not None else True

    title = data.title or (policy.title if policy is not None else template["title"])

    if policy is None:
        policy = StorePolicy(
            policy_type=data.policy_type,
            title=title,
            content=content,
            is_automated=automated,
        )
        db.add(policy)
    else:
        policy.title = title
        policy.content = content
        policy.is_automated = automated

    await db.commit()
    await db.refresh(policy)
    return _policy_out(policy)


async def regenerate_policy(policy_type: PolicyType, db: AsyncSession) -> StorePolicyOut:
    """Reset a policy to its system template (automated mode)."""
    template = _template_for(policy_type)
    if template is None:
        raise ValueError(f"Unsupported policy type '{policy_type}'")

    result = await db.execute(
        select(StorePolicy).where(StorePolicy.policy_type == policy_type)
    )
    policy = result.scalar_one_or_none()
    if policy is None:
        policy = StorePolicy(
            policy_type=policy_type,
            title=template["title"],
            content=template["content"],
            is_automated=True,
        )
        db.add(policy)
    else:
        policy.title = template["title"]
        policy.content = template["content"]
        policy.is_automated = True

    await db.commit()
    await db.refresh(policy)
    return _policy_out(policy)


def _policy_out(policy: StorePolicy) -> StorePolicyOut:
    return StorePolicyOut(
        id=policy.id,
        policy_type=policy.policy_type,
        title=policy.title,
        content=policy.content,
        is_automated=policy.is_automated,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


# =====================================================================
# PRIVACY SETTINGS (singleton)
# =====================================================================


async def get_privacy_settings(db: AsyncSession) -> StorePrivacySettings:
    result = await db.execute(select(StorePrivacySettings).where(StorePrivacySettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = StorePrivacySettings(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


async def update_privacy_settings(
    data: PrivacySettingsUpdate, db: AsyncSession
) -> PrivacySettingsSaveResponse:
    settings = await get_privacy_settings(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    await db.commit()
    await db.refresh(settings)

    opt_out_menu = None
    if settings.opt_out_link_enabled:
        opt_out_menu = await _sync_opt_out_menu_item(db, settings.opt_out_menu_target)
    else:
        await _sync_opt_out_menu_item(db, None)

    await db.commit()
    await db.refresh(settings)
    return PrivacySettingsSaveResponse(settings=settings, opt_out_menu=opt_out_menu)


# =====================================================================
# AUTOMATED FOOTER-MENU INJECTION ("Do Not Sell My Info")
# =====================================================================


async def _sync_opt_out_menu_item(db: AsyncSession, target: str | None) -> dict | None:
    """Idempotently place the data opt-out link in the target footer menu.

    Exactly one opt-out item (matched by label + url) may exist at any time.
    Re-saving with the same target reuses the existing item (stable id);
    changing the target moves it; clearing the target removes it.
    """
    from app.modules.content.model import Menu, MenuItem

    result = await db.execute(
        select(MenuItem).where(
            MenuItem.label == OPT_OUT_LABEL,
            MenuItem.url == OPT_OUT_URL,
        )
    )
    items = list(result.scalars().all())

    if not target or not target.strip():
        for item in items:
            await db.delete(item)
        await db.flush()
        return None

    menu = await _find_or_create_menu(db, target.strip())

    if items:
        item = items[0]
        item.menu_id = menu.id
        for extra in items[1:]:
            await db.delete(extra)
    else:
        item = MenuItem(menu_id=menu.id, label=OPT_OUT_LABEL, url=OPT_OUT_URL)
        db.add(item)

    await db.flush()
    return {
        "menu_id": menu.id,
        "title": menu.title,
        "menu_item_id": item.id,
        "label": item.label,
        "url": item.url,
    }


async def _find_or_create_menu(db: AsyncSession, target: str) -> "Menu":
    from app.modules.content.model import Menu

    result = await db.execute(
        select(Menu).where(
            or_(
                Menu.title.ilike(target),
                Menu.handle == _slugify(target),
            )
        )
    )
    menu = result.scalars().first()
    if menu is not None:
        return menu
    menu = Menu(title=target, handle=_slugify(target))
    db.add(menu)
    await db.flush()
    return menu


# =====================================================================
# STOREFRONT (public) reads
# =====================================================================


async def get_public_settings(db: AsyncSession) -> PublicPrivacySettingsOut:
    settings = await get_privacy_settings(db)
    return PublicPrivacySettingsOut(
        cookie_banner_enabled=settings.cookie_banner_enabled,
        cookie_banner_theme=settings.cookie_banner_theme,
        cookie_banner_position=settings.cookie_banner_position,
        show_in_checkout=settings.show_in_checkout,
        network_intelligence_enabled=settings.network_intelligence_enabled,
        opt_out_url=OPT_OUT_URL,
    )


async def get_public_policies(db: AsyncSession) -> list[PublicPolicyOut]:
    result = await db.execute(select(StorePolicy).order_by(StorePolicy.policy_type))
    return [
        PublicPolicyOut(
            policy_type=p.policy_type,
            title=p.title,
            content=p.content,
            updated_at=p.updated_at,
        )
        for p in result.scalars().all()
    ]


# =====================================================================
# SEED
# =====================================================================


async def seed_defaults(db: AsyncSession) -> None:
    """Create the five automated policy rows + the singleton settings row.

    The opt-out menu link is intentionally NOT injected here - a target menu
    is only chosen once the merchant saves the privacy settings.
    """
    result = await db.execute(select(StorePolicy.policy_type))
    existing = {row[0] for row in result.all()}
    for template in DEFAULT_POLICIES:
        if template["policy_type"] not in existing:
            db.add(
                StorePolicy(
                    policy_type=template["policy_type"],
                    title=template["title"],
                    content=template["content"],
                    is_automated=True,
                )
            )

    # get_or_create the singleton settings row (also commits the policies).
    await get_privacy_settings(db)
