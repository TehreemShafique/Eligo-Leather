from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.modules.settings.languages import service
from app.modules.settings.languages.model import LanguageStatus
from app.modules.settings.languages.schema import (
    AvailableLanguage,
    LanguageCreate,
    LanguageOut,
    LanguageUpdate,
)

router = APIRouter(
    prefix="/languages",
    tags=["Settings - Languages"],
    dependencies=[Depends(require_admin)],
)


@router.post("/seed", status_code=status.HTTP_204_NO_CONTENT)
async def seed_language_defaults(db: AsyncSession = Depends(get_db)):
    return await service.seed_defaults(db)


@router.get("/available", response_model=list[AvailableLanguage])
async def list_available_languages():
    """Master catalog of selectable world languages (Add language dropdown)."""
    return service.get_available_languages()


@router.get("", response_model=list[LanguageOut])
async def list_languages(db: AsyncSession = Depends(get_db)):
    """All active store languages, default first."""
    return await service.list_languages(db)


@router.post("/add", response_model=LanguageOut, status_code=status.HTTP_201_CREATED)
async def add_language(data: LanguageCreate, db: AsyncSession = Depends(get_db)):
    """Validate the code against the catalog and add it as `published`."""
    try:
        return await service.add_language(data, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{language_id}", response_model=LanguageOut)
async def get_language(language_id: int, db: AsyncSession = Depends(get_db)):
    language = await service.get_language(language_id, db)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language


@router.patch("/{language_id}", response_model=LanguageOut)
async def update_language(language_id: int, data: LanguageUpdate, db: AsyncSession = Depends(get_db)):
    try:
        language = await service.update_language(language_id, data, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language


@router.post("/{language_id}/set-default", response_model=LanguageOut)
async def set_default_language(language_id: int, db: AsyncSession = Depends(get_db)):
    language = await service.set_default(language_id, db)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language


@router.post("/{language_id}/publish", response_model=LanguageOut)
async def publish_language(language_id: int, db: AsyncSession = Depends(get_db)):
    try:
        language = await service.set_status(language_id, LanguageStatus.published, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language


@router.post("/{language_id}/unpublish", response_model=LanguageOut)
async def unpublish_language(language_id: int, db: AsyncSession = Depends(get_db)):
    try:
        language = await service.set_status(language_id, LanguageStatus.unpublished, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language


@router.delete("/{language_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_language(language_id: int, db: AsyncSession = Depends(get_db)):
    try:
        deleted = await service.delete_language(language_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not deleted:
        raise HTTPException(status_code=404, detail="Language not found")
