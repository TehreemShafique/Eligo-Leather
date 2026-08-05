from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.companies import service
from app.modules.companies.schema import (
    CompanyCreate, CompanyUpdate, CompanyOut, CompanyListOut,
    CompanyLocationCreate, CompanyLocationUpdate, CompanyLocationOut,
)

router = APIRouter(prefix="/companies", tags=["Companies"], dependencies=[Depends(get_current_user)])


# ================================================================
# Company CRUD
# ================================================================

@router.post("/", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(data: CompanyCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_company(db, data)


@router.get("/", response_model=list[CompanyListOut])
async def list_companies(
    search: str | None = None,
    payment_terms: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await service.list_companies(db, search, payment_terms, skip, limit)


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(company_id: int, db: AsyncSession = Depends(get_db)):
    company = await service.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.patch("/{company_id}", response_model=CompanyOut)
async def update_company(company_id: int, data: CompanyUpdate, db: AsyncSession = Depends(get_db)):
    company = await service.update_company(db, company_id, data)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(company_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_company(db, company_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Company not found")


# ================================================================
# Company Location CRUD
# ================================================================

@router.get("/{company_id}/locations", response_model=list[CompanyLocationOut])
async def list_locations(company_id: int, db: AsyncSession = Depends(get_db)):
    return await service.list_locations(db, company_id)


@router.post("/{company_id}/locations", response_model=CompanyLocationOut, status_code=status.HTTP_201_CREATED)
async def create_location(company_id: int, data: CompanyLocationCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_location(db, company_id, data)


@router.get("/locations/{location_id}", response_model=CompanyLocationOut)
async def get_location(location_id: int, db: AsyncSession = Depends(get_db)):
    location = await service.get_location(db, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Company location not found")
    return location


@router.patch("/locations/{location_id}", response_model=CompanyLocationOut)
async def update_location(location_id: int, data: CompanyLocationUpdate, db: AsyncSession = Depends(get_db)):
    location = await service.update_location(db, location_id, data)
    if not location:
        raise HTTPException(status_code=404, detail="Company location not found")
    return location


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await service.delete_location(db, location_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Company location not found")
