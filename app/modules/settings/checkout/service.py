from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.checkout.model import CheckoutConfig
from app.modules.settings.checkout.schema import CheckoutConfigCreate, CheckoutConfigUpdate

DEFAULT_CONFIG_NAME = "My Store configuration"


async def ensure_default_config(db: AsyncSession) -> None:
    result = await db.execute(select(CheckoutConfig.id).limit(1))
    if result.scalar_one_or_none() is None:
        db.add(CheckoutConfig(name=DEFAULT_CONFIG_NAME, is_active=True))
        await db.commit()


async def seed_default_config(db: AsyncSession) -> None:
    await ensure_default_config(db)


async def list_configs(db: AsyncSession) -> list[CheckoutConfig]:
    await ensure_default_config(db)
    result = await db.execute(
        select(CheckoutConfig).order_by(CheckoutConfig.created_at.desc())
    )
    return list(result.scalars().all())


async def get_config(config_id: int, db: AsyncSession) -> CheckoutConfig | None:
    return await db.get(CheckoutConfig, config_id)


async def get_active_config(db: AsyncSession) -> CheckoutConfig:
    await ensure_default_config(db)

    result = await db.execute(
        select(CheckoutConfig).where(CheckoutConfig.is_active == True)  # noqa: E712
    )
    config = result.scalar_one_or_none()

    if config is None:
        result = await db.execute(
            select(CheckoutConfig).order_by(CheckoutConfig.created_at.desc())
        )
        config = result.scalars().first()
        if config is not None:
            config.is_active = True
            await db.commit()
            await db.refresh(config)

    return config


async def create_config(data: CheckoutConfigCreate, db: AsyncSession) -> CheckoutConfig:
    await ensure_default_config(db)
    config = CheckoutConfig(name=data.name or DEFAULT_CONFIG_NAME, is_active=False)
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return config


async def update_config(config_id: int, data: CheckoutConfigUpdate, db: AsyncSession) -> CheckoutConfig | None:
    config = await get_config(config_id, db)
    if not config:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(config, field, value)

    await db.commit()
    await db.refresh(config)
    return config


async def rename_config(config_id: int, name: str, db: AsyncSession) -> CheckoutConfig | None:
    config = await get_config(config_id, db)
    if not config:
        return None

    config.name = name
    await db.commit()
    await db.refresh(config)
    return config


async def duplicate_config(config_id: int, db: AsyncSession) -> CheckoutConfig | None:
    source = await get_config(config_id, db)
    if not source:
        return None

    copy = CheckoutConfig(
        name=f"{source.name} (copy)",
        is_active=False,
        contact_method=source.contact_method,
        show_order_tracking_link=source.show_order_tracking_link,
        require_login=source.require_login,
        full_name_field=source.full_name_field,
        company_name_field=source.company_name_field,
        address_line2_field=source.address_line2_field,
        shipping_phone_field=source.shipping_phone_field,
        marketing_email_optin=source.marketing_email_optin,
        marketing_sms_optin=source.marketing_sms_optin,
        show_tipping=source.show_tipping,
        checkout_language=source.checkout_language,
        billing_address_rule=source.billing_address_rule,
        validate_shipping_address=source.validate_shipping_address,
        use_shipping_as_billing_default=source.use_shipping_as_billing_default,
        enable_cart_limit=source.enable_cart_limit,
        cart_item_limit=source.cart_item_limit,
        checkout_rules=source.checkout_rules,
    )
    db.add(copy)
    await db.commit()
    await db.refresh(copy)
    return copy


async def activate_config(config_id: int, db: AsyncSession) -> CheckoutConfig | None:
    config = await get_config(config_id, db)
    if not config:
        return None

    await db.execute(
        update(CheckoutConfig).where(CheckoutConfig.is_active == True).values(is_active=False)  # noqa: E712
    )
    config.is_active = True
    await db.commit()
    await db.refresh(config)
    return config


async def delete_config(config_id: int, db: AsyncSession) -> bool:
    config = await get_config(config_id, db)
    if not config:
        return False

    was_active = config.is_active
    await db.delete(config)
    await db.commit()

    if was_active:
        await ensure_default_config(db)
        result = await db.execute(
            select(CheckoutConfig).where(CheckoutConfig.is_active == True)  # noqa: E712
        )
        if result.scalar_one_or_none() is None:
            result = await db.execute(
                select(CheckoutConfig).order_by(CheckoutConfig.created_at.desc())
            )
            next_config = result.scalars().first()
            if next_config is not None:
                next_config.is_active = True
                await db.commit()

    return True
