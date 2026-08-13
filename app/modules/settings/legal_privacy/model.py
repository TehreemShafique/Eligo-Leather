import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PolicyType(str, enum.Enum):
    """The five legal disclosures a merchant can manage. All five are API
    addressable so every policy row (including Legal Notice) is editable
    from the unified compliance dashboard.
    """

    privacy_policy = "privacy_policy"
    refund_policy = "refund_policy"
    terms_of_service = "terms_of_service"
    shipping_policy = "shipping_policy"
    legal_notice = "legal_notice"


class CookieBannerTheme(str, enum.Enum):
    light = "light"
    dark = "dark"
    custom = "custom"


class CookieBannerPosition(str, enum.Enum):
    center = "center"
    bottom_center = "bottom_center"
    bottom_left = "bottom_left"
    bottom_right = "bottom_right"
    bottom_full = "bottom_full"


class StorePolicy(Base):
    """One legal/policy page. `policy_type` is unique so each disclosure has
    exactly one row; `is_automated` marks content generated from the system
    templates in service.DEFAULT_POLICIES vs. a merchant's custom HTML.

    This platform is single-tenant (see the `store_settings` singleton), so
    there is no `store_id` FK - the singleton store row is implied.
    """

    __tablename__ = "store_policies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    policy_type: Mapped[PolicyType] = mapped_column(
        SAEnum(PolicyType, name="policy_type"),
        unique=True,
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_automated: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class StorePrivacySettings(Base):
    """Singleton row (id == 1): the store-wide cookie + consent configuration.

    `opt_out_menu_target` names the footer menu (by title) that receives the
    auto-injected "Do Not Sell My Info" data-sharing opt-out link. `network_
    intelligence_enabled` is the master switch the storefront uses to decide
    whether consent-gated tracking/ad pixels may run.
    """

    __tablename__ = "store_privacy_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    cookie_banner_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    cookie_banner_theme: Mapped[CookieBannerTheme] = mapped_column(
        SAEnum(CookieBannerTheme, name="cookie_banner_theme"),
        default=CookieBannerTheme.light,
        nullable=False,
    )
    cookie_banner_position: Mapped[CookieBannerPosition] = mapped_column(
        SAEnum(CookieBannerPosition, name="cookie_banner_position"),
        default=CookieBannerPosition.bottom_center,
        nullable=False,
    )
    show_in_checkout: Mapped[bool] = mapped_column(Boolean, default=False)
    network_intelligence_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    # When False the "Do Not Sell My Info" link is never injected.
    opt_out_link_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    opt_out_menu_target: Mapped[str | None] = mapped_column(String, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
