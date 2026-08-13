from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.companies.model import Company, CompanyLocation
from app.modules.companies.schema import CompanyCreate, CompanyUpdate, CompanyLocationCreate, CompanyLocationUpdate


# ================================================================
# Company CRUD
# ================================================================

async def create_company(db: AsyncSession, data: CompanyCreate) -> Company:
    company = Company(
        company_name=data.company_name,
        company_id_ref=data.company_id_ref,
        main_contact_id=data.main_contact_id,
        billing_address_same_as_shipping=data.billing_address_same_as_shipping,
        billing_address=data.billing_address,
        tax_id=data.tax_id,
        tax_settings=data.tax_settings,
        note=data.note,
        custom_pricing_tier=data.custom_pricing_tier,
        net_payment_terms=data.net_payment_terms,
    )

    # Create locations if provided
    for loc_data in data.locations:
        location = CompanyLocation(**loc_data.model_dump())
        company.locations.append(location)

    db.add(company)
    await db.commit()
    await db.refresh(company, attribute_names=["locations", "customers"])
    return company


async def get_company(db: AsyncSession, company_id: int) -> Company | None:
    result = await db.execute(
        select(Company)
        .options(selectinload(Company.customers), selectinload(Company.locations))
        .where(Company.id == company_id)
    )
    return result.scalar_one_or_none()


async def list_companies(
    db: AsyncSession,
    search: str | None = None,
    payment_terms: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Company]:
    query = select(Company).options(selectinload(Company.locations))

    if search:
        query = query.where(
            or_(
                Company.company_name.ilike(f"%{search}%"),
                Company.company_id_ref.ilike(f"%{search}%"),
                Company.tax_id.ilike(f"%{search}%"),
            )
        )

    if payment_terms:
        query = query.where(Company.net_payment_terms == payment_terms)

    query = query.order_by(Company.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_company(db: AsyncSession, company_id: int, data: CompanyUpdate) -> Company | None:
    company = await get_company(db, company_id)
    if not company:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    await db.commit()
    await db.refresh(company, attribute_names=["locations", "customers"])
    return company


async def delete_company(db: AsyncSession, company_id: int) -> bool:
    company = await get_company(db, company_id)
    if not company:
        return False
    await db.delete(company)
    await db.commit()
    return True


# ================================================================
# Company Location CRUD
# ================================================================

async def list_locations(db: AsyncSession, company_id: int) -> list[CompanyLocation]:
    result = await db.execute(
        select(CompanyLocation)
        .where(CompanyLocation.company_id == company_id)
        .order_by(CompanyLocation.created_at.desc())
    )
    return list(result.scalars().all())


async def get_location(db: AsyncSession, location_id: int) -> CompanyLocation | None:
    return await db.get(CompanyLocation, location_id)


async def create_location(db: AsyncSession, company_id: int, data: CompanyLocationCreate) -> CompanyLocation:
    location = CompanyLocation(company_id=company_id, **data.model_dump())
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


async def update_location(db: AsyncSession, location_id: int, data: CompanyLocationUpdate) -> CompanyLocation | None:
    location = await get_location(db, location_id)
    if not location:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(location, field, value)
    await db.commit()
    await db.refresh(location)
    return location


async def delete_location(db: AsyncSession, location_id: int) -> bool:
    location = await get_location(db, location_id)
    if not location:
        return False
    await db.delete(location)
    await db.commit()
    return True
