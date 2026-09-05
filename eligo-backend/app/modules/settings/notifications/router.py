from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

from app.modules.settings.notifications import service
from app.modules.settings.notifications.model import (
    NotificationEventType,
    NotificationLog,
)
from app.modules.settings.notifications.schema import (
    CustomerSearchResult,
    DispatchRequest,
    DispatchResponse,
    DispatchRuleCreate,
    DispatchRuleOut,
    DispatchRuleUpdate,
    EmailTemplateCreate,
    EmailTemplateOut,
    EmailTemplateUpdate,
    ManualEmailRequest,
    ManualEmailResponse,
    NotificationLogOut,
    NotificationSettingOut,
    NotificationSettingUpdate,
    SenderConfigOut,
    SenderConfigUpdate,
    TestEmailRequest,
    TestEmailResponse,
    TestEmailWithTemplateRequest,
    WebhookEndpointCreate,
    WebhookEndpointOut,
    WebhookEndpointUpdate,
    WebhookTestResponse,
)

router = APIRouter(
    prefix="/notifications",
    tags=["Settings - Notifications"],
)


@router.post("/seed", status_code=status.HTTP_204_NO_CONTENT)
async def seed_notification_defaults(db: AsyncSession = Depends(get_db)):
    return await service.seed_defaults(db)


# ============================== Sender (SMTP) ==============================


@router.get("/sender", response_model=SenderConfigOut)
async def get_sender(db: AsyncSession = Depends(get_db)):
    """SMTP sender configuration used for every outbound email."""
    return await service.get_sender_config(db)


@router.patch("/sender", response_model=SenderConfigOut)
async def update_sender(data: SenderConfigUpdate, db: AsyncSession = Depends(get_db)):
    return await service.update_sender_config(data, db)


@router.post("/sender/test", response_model=TestEmailResponse)
async def test_sender(data: TestEmailRequest, db: AsyncSession = Depends(get_db)):
    """Send a test email to verify the SMTP configuration."""
    return await service.send_test_email(db, data.to)


# ============================== Notification Settings ==============================


@router.get("/settings", response_model=list[NotificationSettingOut])
async def list_notification_settings(db: AsyncSession = Depends(get_db)):
    """Get enable/disable status for each automatic notification type."""
    return await service.get_notification_settings(db)


@router.patch("/settings/{notification_type}", response_model=NotificationSettingOut)
async def update_notification_setting(
    notification_type: str,
    data: NotificationSettingUpdate,
    db: AsyncSession = Depends(get_db),
):
    return await service.update_notification_setting(db, notification_type, data.enabled)


# ============================== Email templates ==============================


@router.get("/templates", response_model=list[EmailTemplateOut])
async def list_templates(db: AsyncSession = Depends(get_db)):
    return await service.list_templates(db)


@router.post("/templates", response_model=EmailTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(data: EmailTemplateCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await service.create_template(data, db)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.get("/templates/{template_id}", response_model=EmailTemplateOut)
async def get_template(template_id: int, db: AsyncSession = Depends(get_db)):
    template = await service.get_template(template_id, db)
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    return template


@router.patch("/templates/{template_id}", response_model=EmailTemplateOut)
async def update_template(template_id: int, data: EmailTemplateUpdate, db: AsyncSession = Depends(get_db)):
    template = await service.update_template(template_id, data, db)
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    return template


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_template(template_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Email template not found")


# ============================== Webhook endpoints ==============================


@router.get("/webhooks", response_model=list[WebhookEndpointOut])
async def list_webhooks(db: AsyncSession = Depends(get_db)):
    """Outbound webhook destinations for real-time event triggers."""
    return await service.list_webhooks(db)


@router.post("/webhooks", response_model=WebhookEndpointOut, status_code=status.HTTP_201_CREATED)
async def create_webhook(data: WebhookEndpointCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_webhook(data, db)


@router.get("/webhooks/{webhook_id}", response_model=WebhookEndpointOut)
async def get_webhook(webhook_id: int, db: AsyncSession = Depends(get_db)):
    webhook = await service.get_webhook(webhook_id, db)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found")
    return webhook


@router.patch("/webhooks/{webhook_id}", response_model=WebhookEndpointOut)
async def update_webhook(webhook_id: int, data: WebhookEndpointUpdate, db: AsyncSession = Depends(get_db)):
    webhook = await service.update_webhook(webhook_id, data, db)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found")
    return webhook


@router.post("/webhooks/{webhook_id}/test", response_model=WebhookTestResponse)
async def test_webhook(webhook_id: int, db: AsyncSession = Depends(get_db)):
    """Send a ping to the endpoint to verify reachability."""
    return await service.test_webhook(webhook_id, db)


@router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(webhook_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_webhook(webhook_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found")


# ============================== Dispatch rules ==============================


@router.get("/rules", response_model=list[DispatchRuleOut])
async def list_rules(db: AsyncSession = Depends(get_db)):
    """Automated dispatch rules: event -> channel -> recipient."""
    return await service.list_rules(db)


@router.post("/rules", response_model=DispatchRuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(data: DispatchRuleCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_rule(data, db)


@router.patch("/rules/{rule_id}", response_model=DispatchRuleOut)
async def update_rule(rule_id: int, data: DispatchRuleUpdate, db: AsyncSession = Depends(get_db)):
    rule = await service.update_rule(rule_id, data, db)
    if not rule:
        raise HTTPException(status_code=404, detail="Dispatch rule not found")
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_rule(rule_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Dispatch rule not found")


# ============================== Logs & manual dispatch ==============================


@router.get("/logs", response_model=list[NotificationLogOut])
async def list_logs(
    skip: int = 0,
    limit: int = 50,
    event_type: str | None = None,
    status_filter: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Audit trail of every email / webhook dispatch attempt."""
    return await service.list_logs(db, skip, limit)


@router.post("/dispatch", response_model=DispatchResponse)
async def dispatch_event(data: DispatchRequest, db: AsyncSession = Depends(get_db)):
    """Manually fire an event through the dispatch engine (testing / admin alerts).

    e.g. POST {"event_type": "admin_notification", "payload": {"message": "..."}}
    """
    return await service.dispatch_event(data.event_type, data.payload, db)


# ============================== Customer search for manual email ==============================


@router.get("/customers/search", response_model=list[CustomerSearchResult])
async def search_customers(
    q: str = Query("", description="Search by name or email"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    return await service.search_customers_for_email(db, q, limit)


# ============================== Manual email ==============================


@router.post("/send", response_model=ManualEmailResponse)
async def send_manual_email(data: ManualEmailRequest, db: AsyncSession = Depends(get_db)):
    """Send a manual email to a customer using a template."""
    return await service.send_manual_email(db, data)


# ============================== Test email with template ==============================


@router.post("/test", response_model=TestEmailResponse)
async def test_email_with_template(data: TestEmailWithTemplateRequest, db: AsyncSession = Depends(get_db)):
    """Send a test email using a specific template with mock data."""
    return await service.send_test_with_template(db, data)
