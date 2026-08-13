import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.customers import service
from app.modules.customers.schema import (
    CustomerCreate, CustomerUpdate, CustomerOut, CustomerListOut,
    CustomerAddressCreate, CustomerAddressUpdate, CustomerAddressOut,
    ExportCustomersRequest, ImportCustomersRequest, ImportCustomersResponse,
)

router = APIRouter(prefix="/customers", tags=["Customers"], dependencies=[Depends(get_current_user)])


# ================================================================
# Customer CRUD
# ================================================================

@router.post("/", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
async def create_customer(data: CustomerCreate, db: AsyncSession = Depends(get_db)):
    existing = await service.get_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    return await service.create_customer(db, data)


@router.get("/", response_model=list[CustomerListOut])
async def list_customers(
    search: str | None = None,
    email_subscription: bool | None = None,
    sms_subscription: bool | None = None,
    whatsapp_subscription: bool | None = None,
    location: str | None = None,
    tax_exempt: bool | None = None,
    tag: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await service.list_customers(
        db, search, email_subscription, sms_subscription, whatsapp_subscription,
        location, tax_exempt, tag, sort_by, sort_order, skip, limit,
    )


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    customer = await service.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/{customer_id}", response_model=CustomerOut)
async def update_customer(customer_id: int, data: CustomerUpdate, db: AsyncSession = Depends(get_db)):
    customer = await service.update_customer(db, customer_id, data)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_customer(db, customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")


# ================================================================
# Customer Address Management
# ================================================================

@router.get("/{customer_id}/addresses", response_model=list[CustomerAddressOut])
async def list_addresses(customer_id: int, db: AsyncSession = Depends(get_db)):
    return await service.list_addresses(db, customer_id)


@router.post("/{customer_id}/addresses", response_model=CustomerAddressOut, status_code=status.HTTP_201_CREATED)
async def create_address(customer_id: int, data: CustomerAddressCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_address(db, customer_id, data)


@router.get("/addresses/{address_id}", response_model=CustomerAddressOut)
async def get_address(address_id: int, db: AsyncSession = Depends(get_db)):
    addr = await service.get_address(db, address_id)
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    return addr


@router.patch("/addresses/{address_id}", response_model=CustomerAddressOut)
async def update_address(address_id: int, data: CustomerAddressUpdate, db: AsyncSession = Depends(get_db)):
    addr = await service.update_address(db, address_id, data)
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    return addr


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(address_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_address(db, address_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Address not found")


# ================================================================
# Export & Import
# ================================================================

@router.post("/export")
async def export_customers(data: ExportCustomersRequest, db: AsyncSession = Depends(get_db)):
    customers = await service.export_customers(db, data.scope, data.customer_ids, data.segment_id)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Email", "First Name", "Last Name", "Phone", "Location",
        "Total Orders", "Amount Spent", "Email Subscribed", "SMS Subscribed",
        "WhatsApp Subscribed", "Tax Exempt", "Tags", "Created At",
    ])

    for c in customers:
        writer.writerow([
            c.id, c.email, c.first_name or "", c.last_name or "",
            c.phone or "", c.location or "", c.total_orders,
            str(c.amount_spent), c.email_subscription, c.sms_subscription,
            c.whatsapp_subscription, c.tax_exempt, c.tags or "",
            c.created_at.isoformat() if c.created_at else "",
        ])

    output.seek(0)
    filename = f"customers_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/import", response_model=ImportCustomersResponse)
async def import_customers(data: ImportCustomersRequest, db: AsyncSession = Depends(get_db)):
    imported, skipped, errors = await service.import_customers(db, data.customers, data.skip_duplicates)
    return ImportCustomersResponse(imported=imported, skipped=skipped, errors=errors)


# ================================================================
# Company Assignment
# ================================================================

@router.post("/{customer_id}/companies", response_model=CustomerOut)
async def assign_companies(customer_id: int, company_ids: list[int], db: AsyncSession = Depends(get_db)):
    customer = await service.assign_companies(db, customer_id, company_ids)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/{customer_id}/companies", response_model=CustomerOut)
async def remove_companies(customer_id: int, company_ids: list[int], db: AsyncSession = Depends(get_db)):
    customer = await service.remove_companies(db, customer_id, company_ids)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# ================================================================
# Segment Assignment
# ================================================================

@router.post("/{customer_id}/segments", response_model=CustomerOut)
async def assign_segments(customer_id: int, segment_ids: list[int], db: AsyncSession = Depends(get_db)):
    customer = await service.assign_segments(db, customer_id, segment_ids)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/{customer_id}/segments", response_model=CustomerOut)
async def remove_segments(customer_id: int, segment_ids: list[int], db: AsyncSession = Depends(get_db)):
    customer = await service.remove_segments(db, customer_id, segment_ids)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
