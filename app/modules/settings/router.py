from fastapi import APIRouter
from app.modules.settings.general.router import router as general_router
from app.modules.settings.account.router import router as account_router
from app.modules.settings.users.router import router as users_router
from app.modules.settings.roles.router import router as roles_router
from app.modules.settings.security.router import router as security_router
from app.modules.settings.payment.router import router as payment_router
from app.modules.settings.checkout.router import router as checkout_router
from app.modules.settings.customer_accounts.router import router as customer_accounts_router
from app.modules.settings.shipping_and_delivery.router import router as shipping_router
from app.modules.settings.locations.router import router as locations_router
from app.modules.settings.apps.router import router as apps_router
from app.modules.settings.sales_channels.router import router as sales_channels_router
from app.modules.settings.sales_channels.router import webhook_router as sales_channels_webhook_router
from app.modules.settings.customer_events.router import router as customer_events_router
from app.modules.settings.customer_events.router import public_router as customer_events_public_router
from app.modules.settings.notifications.router import router as notifications_router
from app.modules.settings.languages.router import router as languages_router
from app.modules.settings.metafields_and_metaobjects.router import router as metafields_router
from app.modules.settings.legal_privacy.router import router as legal_privacy_router
from app.modules.settings.legal_privacy.router import public_router as legal_privacy_public_router

router = APIRouter(prefix="/settings")
router.include_router(general_router)
router.include_router(account_router)
router.include_router(users_router)
router.include_router(roles_router)
router.include_router(security_router)
router.include_router(payment_router)
router.include_router(checkout_router)
router.include_router(customer_accounts_router)
router.include_router(shipping_router)
router.include_router(locations_router)
router.include_router(apps_router)
router.include_router(sales_channels_router)
router.include_router(sales_channels_webhook_router)
router.include_router(customer_events_router)
router.include_router(customer_events_public_router)
router.include_router(notifications_router)
router.include_router(languages_router)
router.include_router(metafields_router)
router.include_router(legal_privacy_router)
router.include_router(legal_privacy_public_router)