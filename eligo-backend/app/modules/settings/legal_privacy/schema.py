from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.settings.legal_privacy.model import (
    CookieBannerPosition,
    CookieBannerTheme,
    PolicyType,
)


# ============================== Admin payloads ==============================


class StorePolicyUpdate(BaseModel):
    """PUT body for a single policy.

    `policy_type` is validated against the PolicyType enum (all five legal
    disclosures are allowed). Passing `is_automated=True` - or omitting
    `content` - regenerates the body from the system template so a merchant
    never has to write legal text by hand.
    """

    policy_type: PolicyType
    title: str | None = Field(default=None, max_length=100)
    content: str | None = None
    is_automated: bool | None = None


class StorePolicyOut(BaseModel):
    id: int
    policy_type: PolicyType
    title: str
    content: str
    is_automated: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrivacySettingsUpdate(BaseModel):
    cookie_banner_enabled: bool | None = None
    cookie_banner_theme: CookieBannerTheme | None = None
    cookie_banner_position: CookieBannerPosition | None = None
    show_in_checkout: bool | None = None
    network_intelligence_enabled: bool | None = None
    opt_out_link_enabled: bool | None = None
    # Footer menu title (e.g. "Information") that receives the opt-out link.
    opt_out_menu_target: str | None = Field(default=None, max_length=100)


class PrivacySettingsOut(BaseModel):
    id: int
    cookie_banner_enabled: bool
    cookie_banner_theme: CookieBannerTheme
    cookie_banner_position: CookieBannerPosition
    show_in_checkout: bool
    network_intelligence_enabled: bool
    opt_out_link_enabled: bool
    opt_out_menu_target: str | None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OptOutMenuOut(BaseModel):
    """Result of the automated footer-menu injection."""

    menu_id: int
    title: str
    menu_item_id: int
    label: str
    url: str


class PrivacySettingsSaveResponse(BaseModel):
    settings: PrivacySettingsOut
    # Present when an opt-out link was injected; null when the target was
    # cleared (link removed) or opt-out injection is disabled.
    opt_out_menu: OptOutMenuOut | None = None


# ============================== Storefront payloads ==============================


class PublicPolicyOut(BaseModel):
    """Policy page rendered on the storefront footer."""

    policy_type: PolicyType
    title: str
    content: str
    updated_at: datetime


class PublicPrivacySettingsOut(BaseModel):
    """Consent config the storefront JS needs to render the cookie banner
    and decide whether tracking pixels may run (CCPA/GDPR enforcement)."""

    cookie_banner_enabled: bool
    cookie_banner_theme: CookieBannerTheme
    cookie_banner_position: CookieBannerPosition
    show_in_checkout: bool
    network_intelligence_enabled: bool
    opt_out_url: str = "/pages/opt-out"
