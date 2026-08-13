# Import every model module here so SQLAlchemy registers all classes
# before any relationships are resolved. This file has no other purpose.

from app.modules.auth.model import User          # noqa: F401
from app.modules.customers.model import (        # noqa: F401
    Customer, CustomerAddress, customer_company, customer_segment,
)
from app.modules.companies.model import Company, CompanyLocation  # noqa: F401
from app.modules.segments.model import Segment   # noqa: F401
from app.modules.orders.model import (           # noqa: F401
    Order, OrderItem, OrderNote, OrderAuditLog,
    DraftOrder, DraftOrderItem,
    AbandonedCheckout, AbandonedCheckoutItem,
    LeopardShipment, LeopardLoadSheet, LeopardLog,
)
from app.modules.catalog.model import (          # noqa: F401
    Product, ProductVariant, ProductImage, Collection,
    Location, InventoryItem,
    PurchaseOrder, PurchaseOrderItem,
    Transfer, GiftCard,
)
from app.modules.growth.model import (            # noqa: F401
    Attribution, Campaign,
)
from app.modules.discounts.model import (  # noqa: F401
    Discount, WelcomeDiscountSettings, WelcomeDiscountLog,
)
from app.modules.content.model import (           # noqa: F401
    MetaobjectDefinition, MetaobjectEntry, File,
    Menu, MenuItem, UrlRedirect, BlogPost, BlogComment,
)
from app.modules.markets.model import (            # noqa: F401
    Market, Catalog, CatalogProduct, Rollout, RolloutChange,
)
from app.modules.store.model import StoreHeaderScript  # noqa: F401
from app.modules.analytics.model import (          # noqa: F401
    DailySnapshot, Report, Exploration,
    LiveVisitor, LiveActivity, CohortRetention,
)
from app.modules.settings.general.model import (
    StoreSettings, 
    BusinessEntity, 
    StoreBrand
    )  # noqa: F401

from app.modules.settings.roles.model import Roles                          # noqa: F401 

from app.modules.settings.security.model import ActivityLogs, CollaboratorCodes   # noqa: F401

from app.modules.settings.account.model import (  # noqa: F401
    UserLoginService,
    UserSession,
    UserRecoveryCode,
)

from app.modules.settings.payment.model import PaymentMethod, PaymentSettings   # noqa: F401

from app.modules.settings.checkout.model import CheckoutConfig   # noqa: F401

from app.modules.settings.customer_accounts.model import CustomerAccountSettings   # noqa: F401

from app.modules.settings.shipping_and_delivery.model import (  # noqa: F401
    Carrier, ShippingProfile, ShippingZone, ShippingRate,
    Package, ShippingSettings,
)

from app.modules.settings.locations.model import Location  # noqa: F401

from app.modules.settings.apps.model import StoreIntegration  # noqa: F401

from app.modules.settings.sales_channels.model import (  # noqa: F401
    SalesChannel,
    ChannelWebhookEvent,
)

from app.modules.settings.customer_events.model import (  # noqa: F401
    TrackingPixel,
    PixelEventLog,
)

from app.modules.settings.notifications.model import (  # noqa: F401
    SenderConfig,
    EmailTemplate,
    WebhookEndpoint,
    DispatchRule,
    NotificationLog,
)

from app.modules.settings.languages.model import StoreLanguage  # noqa: F401

from app.modules.settings.metafields_and_metaobjects.model import (  # noqa: F401
    MetafieldDefinition, MetafieldValue, MetafieldScope,
)

from app.modules.settings.legal_privacy.model import (  # noqa: F401
    StorePolicy, StorePrivacySettings, PolicyType,
    CookieBannerTheme, CookieBannerPosition,
)

