from datetime import datetime, timezone
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.customers.model import Customer, CustomerAddress
from app.modules.customers.schema import (
    CustomerCreate, CustomerUpdate, CustomerAddressCreate, CustomerAddressUpdate,
    ImportCustomerRow,
)
from app.modules.companies.model import Company
from app.modules.segments.model import Segment


# ================================================================
# Customer CRUD
# ================================================================

async def get_by_email(db: AsyncSession, email: str) -> Customer | None:
    result = await db.execute(select(Customer).where(Customer.email == email))
    return result.scalar_one_or_none()


async def get_customer(db: AsyncSession, customer_id: int) -> Customer | None:
    result = await db.execute(
        select(Customer)
        .options(
            selectinload(Customer.companies),
            selectinload(Customer.segments),
            selectinload(Customer.addresses),
        )
        .where(Customer.id == customer_id)
    )
    return result.scalar_one_or_none()


async def list_customers(
    db: AsyncSession,
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
) -> list[Customer]:
    query = select(Customer)

    if search:
        query = query.where(
            or_(
                Customer.email.ilike(f"%{search}%"),
                Customer.first_name.ilike(f"%{search}%"),
                Customer.last_name.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%"),
                Customer.tags.ilike(f"%{search}%"),
            )
        )
    if email_subscription is not None:
        query = query.where(Customer.email_subscription == email_subscription)
    if sms_subscription is not None:
        query = query.where(Customer.sms_subscription == sms_subscription)
    if whatsapp_subscription is not None:
        query = query.where(Customer.whatsapp_subscription == whatsapp_subscription)
    if location:
        query = query.where(Customer.location.ilike(f"%{location}%"))
    if tax_exempt is not None:
        query = query.where(Customer.tax_exempt == tax_exempt)
    if tag:
        query = query.where(Customer.tags.ilike(f"%{tag}%"))

    # Sorting
    sort_column_map = {
        "amount_spent": Customer.amount_spent,
        "total_orders": Customer.total_orders,
        "created_at": Customer.created_at,
        "updated_at": Customer.updated_at,
        "last_order_date": Customer.last_order_date,
        "first_order_date": Customer.first_order_date,
    }
    sort_col = sort_column_map.get(sort_by, Customer.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_customer(db: AsyncSession, data: CustomerCreate) -> Customer:
    customer = Customer(
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        phone_country_code=data.phone_country_code,
        location=data.location,
        postal_code=data.postal_code,
        customer_language=data.customer_language,
        email_subscription=data.email_subscription,
        sms_subscription=data.sms_subscription,
        whatsapp_subscription=data.whatsapp_subscription,
        tax_exempt=data.tax_exempt,
        tax_settings=data.tax_settings,
        tags=data.tags,
        notes=data.notes,
    )

    # Attach companies if provided
    if data.company_ids:
        result = await db.execute(select(Company).where(Company.id.in_(data.company_ids)))
        customer.companies = list(result.scalars().all())

    # Attach segments if provided
    if data.segment_ids:
        result = await db.execute(select(Segment).where(Segment.id.in_(data.segment_ids)))
        customer.segments = list(result.scalars().all())

    db.add(customer)
    await db.flush()

    # Create initial address if provided
    if data.address:
        addr = CustomerAddress(
            customer_id=customer.id,
            first_name=data.address.first_name or data.first_name,
            last_name=data.address.last_name or data.last_name,
            company=data.address.company,
            address_line1=data.address.address_line1,
            address_line2=data.address.address_line2,
            city=data.address.city,
            province=data.address.province,
            postal_code=data.address.postal_code,
            country=data.address.country,
            country_code=data.address.country_code,
            phone=data.address.phone,
            is_default=True,
            address_type=data.address.address_type,
        )
        db.add(addr)
        await db.flush()
        customer.default_address_id = addr.id
        customer.location = f"{data.address.city}, {data.address.country}"

    await db.commit()
    await db.refresh(customer, attribute_names=["companies", "segments", "addresses"])
    return customer


async def update_customer(db: AsyncSession, customer_id: int, data: CustomerUpdate) -> Customer | None:
    customer = await get_customer(db, customer_id)
    if not customer:
        return None

    update_data = data.model_dump(exclude_unset=True)

    # Handle M2M fields separately
    company_ids = update_data.pop("company_ids", None)
    segment_ids = update_data.pop("segment_ids", None)

    for field, value in update_data.items():
        setattr(customer, field, value)

    if company_ids is not None:
        result = await db.execute(select(Company).where(Company.id.in_(company_ids)))
        customer.companies = list(result.scalars().all())

    if segment_ids is not None:
        result = await db.execute(select(Segment).where(Segment.id.in_(segment_ids)))
        customer.segments = list(result.scalars().all())

    await db.commit()
    await db.refresh(customer, attribute_names=["companies", "segments", "addresses"])
    return customer


async def delete_customer(db: AsyncSession, customer_id: int) -> bool:
    customer = await get_customer(db, customer_id)
    if not customer:
        return False
    await db.delete(customer)
    await db.commit()
    return True


# ================================================================
# Customer Address CRUD
# ================================================================

async def list_addresses(db: AsyncSession, customer_id: int) -> list[CustomerAddress]:
    result = await db.execute(
        select(CustomerAddress)
        .where(CustomerAddress.customer_id == customer_id)
        .order_by(CustomerAddress.is_default.desc(), CustomerAddress.created_at.desc())
    )
    return list(result.scalars().all())


async def get_address(db: AsyncSession, address_id: int) -> CustomerAddress | None:
    return await db.get(CustomerAddress, address_id)


async def create_address(db: AsyncSession, customer_id: int, data: CustomerAddressCreate) -> CustomerAddress:
    # If this is set as default, unset other defaults
    if data.is_default:
        result = await db.execute(
            select(CustomerAddress).where(
                CustomerAddress.customer_id == customer_id,
                CustomerAddress.is_default == True,
            )
        )
        for addr in result.scalars().all():
            addr.is_default = False

    addr = CustomerAddress(customer_id=customer_id, **data.model_dump())
    db.add(addr)
    await db.flush()

    # If first address or set as default, update customer's default_address_id
    cust_result = await db.execute(
        select(CustomerAddress).where(CustomerAddress.customer_id == customer_id)
    )
    all_addrs = list(cust_result.scalars().all())
    if len(all_addrs) == 1 or data.is_default:
        cust = await db.get(Customer, customer_id)
        if cust:
            cust.default_address_id = addr.id
            cust.location = f"{data.city}, {data.country}"

    await db.commit()
    await db.refresh(addr)
    return addr


async def update_address(db: AsyncSession, address_id: int, data: CustomerAddressUpdate) -> CustomerAddress | None:
    addr = await get_address(db, address_id)
    if not addr:
        return None

    update_data = data.model_dump(exclude_unset=True)

    # Handle default toggle
    if update_data.get("is_default"):
        result = await db.execute(
            select(CustomerAddress).where(
                CustomerAddress.customer_id == addr.customer_id,
                CustomerAddress.is_default == True,
                CustomerAddress.id != address_id,
            )
        )
        for other in result.scalars().all():
            other.is_default = False
        # Update customer's default_address_id
        cust = await db.get(Customer, addr.customer_id)
        if cust:
            cust.default_address_id = address_id

    for field, value in update_data.items():
        setattr(addr, field, value)

    await db.commit()
    await db.refresh(addr)
    return addr


async def delete_address(db: AsyncSession, address_id: int) -> bool:
    addr = await get_address(db, address_id)
    if not addr:
        return False

    customer_id = addr.customer_id
    was_default = addr.is_default

    await db.delete(addr)

    # If was default, assign another address as default
    if was_default:
        result = await db.execute(
            select(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .order_by(CustomerAddress.created_at.desc())
            .limit(1)
        )
        new_default = result.scalar_one_or_none()
        cust = await db.get(Customer, customer_id)
        if cust:
            cust.default_address_id = new_default.id if new_default else None
            if new_default:
                new_default.is_default = True

    await db.commit()
    return True


# ================================================================
# Export & Import
# ================================================================

async def export_customers(
    db: AsyncSession,
    scope: str = "all",
    customer_ids: list[int] | None = None,
    segment_id: int | None = None,
) -> list[Customer]:
    query = select(Customer)

    if scope == "selected" and customer_ids:
        query = query.where(Customer.id.in_(customer_ids))
    elif scope == "segment" and segment_id:
        query = query.join(Customer.segments).where(Segment.id == segment_id)

    query = query.order_by(Customer.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def import_customers(
    db: AsyncSession,
    rows: list[ImportCustomerRow],
    skip_duplicates: bool = True,
) -> tuple[int, int, list[str]]:
    imported = 0
    skipped = 0
    errors: list[str] = []

    for row in rows:
        existing = await get_by_email(db, row.email)
        if existing:
            if skip_duplicates:
                skipped += 1
                continue
            else:
                errors.append(f"Duplicate email: {row.email}")
                continue

        try:
            customer = Customer(
                email=row.email,
                first_name=row.first_name,
                last_name=row.last_name,
                phone=row.phone,
                location=row.location,
                tags=row.tags,
            )
            db.add(customer)
            imported += 1
        except Exception as e:
            errors.append(f"Error importing {row.email}: {str(e)}")

    if imported > 0:
        await db.commit()

    return imported, skipped, errors


# ================================================================
# M2M Assign/Remove helpers
# ================================================================

async def assign_companies(db: AsyncSession, customer_id: int, company_ids: list[int]) -> Customer | None:
    customer = await get_customer(db, customer_id)
    if not customer:
        return None
    result = await db.execute(select(Company).where(Company.id.in_(company_ids)))
    new_companies = list(result.scalars().all())
    existing_ids = {c.id for c in customer.companies}
    for c in new_companies:
        if c.id not in existing_ids:
            customer.companies.append(c)
    await db.commit()
    await db.refresh(customer, attribute_names=["companies"])
    return customer


async def remove_companies(db: AsyncSession, customer_id: int, company_ids: list[int]) -> Customer | None:
    customer = await get_customer(db, customer_id)
    if not customer:
        return None
    customer.companies = [c for c in customer.companies if c.id not in company_ids]
    await db.commit()
    await db.refresh(customer, attribute_names=["companies"])
    return customer


async def assign_segments(db: AsyncSession, customer_id: int, segment_ids: list[int]) -> Customer | None:
    customer = await get_customer(db, customer_id)
    if not customer:
        return None
    result = await db.execute(select(Segment).where(Segment.id.in_(segment_ids)))
    new_segments = list(result.scalars().all())
    existing_ids = {s.id for s in customer.segments}
    for s in new_segments:
        if s.id not in existing_ids:
            customer.segments.append(s)
    await db.commit()
    await db.refresh(customer, attribute_names=["segments"])
    return customer


async def remove_segments(db: AsyncSession, customer_id: int, segment_ids: list[int]) -> Customer | None:
    customer = await get_customer(db, customer_id)
    if not customer:
        return None
    customer.segments = [s for s in customer.segments if s.id not in segment_ids]
    await db.commit()
    await db.refresh(customer, attribute_names=["segments"])
    return customer


async def merge_customers(db: AsyncSession, primary_id: int, secondary_id: int) -> Customer | None:
    primary = await get_customer(db, primary_id)
    secondary = await get_customer(db, secondary_id)
    if not primary or not secondary:
        return None

    # Merge totals
    primary.total_orders += secondary.total_orders
    primary.amount_spent += secondary.amount_spent

    # Merge contact details if missing
    if not primary.phone and secondary.phone:
        primary.phone = secondary.phone
    if not primary.email and secondary.email:
        primary.email = secondary.email
    if not primary.location and secondary.location:
        primary.location = secondary.location

    # Merge tags
    p_tags = set(t.strip() for t in (primary.tags or "").split(",") if t.strip())
    s_tags = set(t.strip() for t in (secondary.tags or "").split(",") if t.strip())
    combined_tags = list(p_tags.union(s_tags))
    primary.tags = ", ".join(combined_tags) if combined_tags else None

    # Delete secondary record
    await db.delete(secondary)
    await db.commit()
    await db.refresh(primary)
    return primary
