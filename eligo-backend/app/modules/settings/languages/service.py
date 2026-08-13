from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.languages.model import LanguageStatus, StoreLanguage
from app.modules.settings.languages.schema import LanguageCreate, LanguageUpdate

# =====================================================================
# MASTER ISO LANGUAGE CATALOG
# =====================================================================
# Populates the "Add language" dropdown (GET /settings/languages/available).
# Codes follow ISO 639-1. Keep this as the single source of truth for
# validating `language_code` on add.
# =====================================================================

AVAILABLE_LANGUAGES: list[dict] = [
    {"code": "en", "name": "English", "native_name": "English"},
    {"code": "ur", "name": "Urdu", "native_name": "اردو"},
    {"code": "ar", "name": "Arabic", "native_name": "العربية"},
    {"code": "es", "name": "Spanish", "native_name": "Español"},
    {"code": "fr", "name": "French", "native_name": "Français"},
    {"code": "de", "name": "German", "native_name": "Deutsch"},
    {"code": "it", "name": "Italian", "native_name": "Italiano"},
    {"code": "pt", "name": "Portuguese", "native_name": "Português"},
    {"code": "nl", "name": "Dutch", "native_name": "Nederlands"},
    {"code": "ru", "name": "Russian", "native_name": "Русский"},
    {"code": "tr", "name": "Turkish", "native_name": "Türkçe"},
    {"code": "fa", "name": "Persian", "native_name": "فارسی"},
    {"code": "hi", "name": "Hindi", "native_name": "हिन्दी"},
    {"code": "bn", "name": "Bengali", "native_name": "বাংলা"},
    {"code": "pa", "name": "Punjabi", "native_name": "ਪੰਜਾਬੀ"},
    {"code": "sd", "name": "Sindhi", "native_name": "سنڌي"},
    {"code": "ps", "name": "Pashto", "native_name": "پښتو"},
    {"code": "zh", "name": "Chinese (Simplified)", "native_name": "简体中文"},
    {"code": "zh-tw", "name": "Chinese (Traditional)", "native_name": "繁體中文"},
    {"code": "ja", "name": "Japanese", "native_name": "日本語"},
    {"code": "ko", "name": "Korean", "native_name": "한국어"},
    {"code": "id", "name": "Indonesian", "native_name": "Bahasa Indonesia"},
    {"code": "ms", "name": "Malay", "native_name": "Bahasa Melayu"},
    {"code": "th", "name": "Thai", "native_name": "ไทย"},
    {"code": "vi", "name": "Vietnamese", "native_name": "Tiếng Việt"},
    {"code": "pl", "name": "Polish", "native_name": "Polski"},
    {"code": "uk", "name": "Ukrainian", "native_name": "Українська"},
    {"code": "el", "name": "Greek", "native_name": "Ελληνικά"},
    {"code": "sv", "name": "Swedish", "native_name": "Svenska"},
    {"code": "da", "name": "Danish", "native_name": "Dansk"},
    {"code": "no", "name": "Norwegian", "native_name": "Norsk"},
    {"code": "fi", "name": "Finnish", "native_name": "Suomi"},
    {"code": "cs", "name": "Czech", "native_name": "Čeština"},
    {"code": "ro", "name": "Romanian", "native_name": "Română"},
    {"code": "hu", "name": "Hungarian", "native_name": "Magyar"},
    {"code": "he", "name": "Hebrew", "native_name": "עברית"},
    {"code": "sw", "name": "Swahili", "native_name": "Kiswahili"},
    {"code": "af", "name": "Afrikaans", "native_name": "Afrikaans"},
    {"code": "ur-in", "name": "Urdu (India)", "native_name": "اردو (بھارت)"},
]

_LANGUAGES_BY_CODE: dict[str, dict] = {lang["code"]: lang for lang in AVAILABLE_LANGUAGES}


def get_available_languages() -> list[dict]:
    return AVAILABLE_LANGUAGES


def get_available_by_code(language_code: str) -> dict | None:
    return _LANGUAGES_BY_CODE.get(language_code)


# =====================================================================
# CRUD
# =====================================================================


async def list_languages(db: AsyncSession) -> list[StoreLanguage]:
    result = await db.execute(
        select(StoreLanguage).order_by(
            StoreLanguage.is_default.desc(),
            StoreLanguage.language_name,
        )
    )
    return list(result.scalars().all())


async def get_language(language_id: int, db: AsyncSession) -> StoreLanguage | None:
    return await db.get(StoreLanguage, language_id)


async def get_by_code(language_code: str, db: AsyncSession) -> StoreLanguage | None:
    result = await db.execute(
        select(StoreLanguage).where(StoreLanguage.language_code == language_code)
    )
    return result.scalar_one_or_none()


async def add_language(data: LanguageCreate, db: AsyncSession) -> StoreLanguage:
    """Validate against the master catalog and save as `published`."""
    catalog = get_available_by_code(data.language_code)
    if catalog is None:
        raise ValueError(
            f"'{data.language_code}' is not a supported language code. "
            "Pick one from GET /settings/languages/available."
        )
    if await get_by_code(data.language_code, db):
        raise ValueError(f"Language '{data.language_code}' is already added")

    language = StoreLanguage(
        language_code=catalog["code"],
        language_name=catalog["name"],
        native_name=catalog.get("native_name"),
        domain=data.domain,
        status=LanguageStatus.published,
    )
    db.add(language)
    await db.commit()
    await db.refresh(language)
    return language


async def update_language(
    language_id: int, data: LanguageUpdate, db: AsyncSession
) -> StoreLanguage | None:
    language = await get_language(language_id, db)
    if not language:
        return None

    if data.is_default is True:
        await _clear_default(db)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(language, field, value)

    await db.commit()
    await db.refresh(language)
    return language


async def set_default(language_id: int, db: AsyncSession) -> StoreLanguage | None:
    """Make one language the exclusive default."""
    language = await get_language(language_id, db)
    if not language:
        return None
    await _clear_default(db)
    language.is_default = True
    language.status = LanguageStatus.published
    await db.commit()
    await db.refresh(language)
    return language


async def set_status(
    language_id: int, status: LanguageStatus, db: AsyncSession
) -> StoreLanguage | None:
    language = await get_language(language_id, db)
    if not language:
        return None
    if status == LanguageStatus.unpublished and language.is_default:
        raise ValueError("The default language cannot be unpublished")
    language.status = status
    await db.commit()
    await db.refresh(language)
    return language


async def delete_language(language_id: int, db: AsyncSession) -> bool:
    language = await get_language(language_id, db)
    if not language:
        return False
    if language.is_default:
        raise ValueError("The default language cannot be deleted")
    await db.delete(language)
    await db.commit()
    return True


async def _clear_default(db: AsyncSession) -> None:
    await db.execute(
        update(StoreLanguage).where(StoreLanguage.is_default == True).values(is_default=False)  # noqa: E712
    )


# =====================================================================
# SEED
# =====================================================================


async def seed_defaults(db: AsyncSession) -> None:
    """Ensure English exists as the single published default language."""
    result = await db.execute(select(StoreLanguage.id).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    db.add(
        StoreLanguage(
            language_code="en",
            language_name="English",
            native_name="English",
            is_default=True,
            status=LanguageStatus.published,
        )
    )
    await db.commit()
