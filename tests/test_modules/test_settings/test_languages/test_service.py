"""Tests for app.modules.settings.languages.service"""

import pytest

from app.modules.settings.languages import service
from app.modules.settings.languages.model import LanguageStatus
from app.modules.settings.languages.schema import LanguageCreate, LanguageUpdate


async def test_get_available_languages_returns_catalog(db_session):
    catalog = service.get_available_languages()
    codes = {lang["code"] for lang in catalog}
    assert "en" in codes
    assert len(catalog) > 10


async def test_get_available_by_code(db_session):
    assert service.get_available_by_code("ur")["name"] == "Urdu"
    assert service.get_available_by_code("xx") is None


async def test_seed_defaults_creates_english(db_session):
    assert await service.seed_defaults(db_session) is None
    languages = await service.list_languages(db_session)
    assert len(languages) == 1
    assert languages[0].language_code == "en"
    assert languages[0].language_name == "English"
    assert languages[0].is_default is True
    assert languages[0].status == LanguageStatus.published


async def test_seed_defaults_is_idempotent(db_session):
    await service.seed_defaults(db_session)
    await service.seed_defaults(db_session)
    assert len(await service.list_languages(db_session)) == 1


async def test_add_language_from_catalog(db_session):
    language = await service.add_language(LanguageCreate(language_code="ur"), db_session)
    assert language.language_code == "ur"
    assert language.language_name == "Urdu"
    assert language.status == LanguageStatus.published
    assert language.is_default is False


async def test_add_language_invalid_code_raises(db_session):
    with pytest.raises(ValueError):
        await service.add_language(LanguageCreate(language_code="xx"), db_session)


async def test_add_language_duplicate_raises(db_session):
    await service.add_language(LanguageCreate(language_code="ur"), db_session)
    with pytest.raises(ValueError):
        await service.add_language(LanguageCreate(language_code="ur"), db_session)


async def test_get_language_missing_returns_none(db_session):
    assert await service.get_language(99999, db_session) is None


async def test_get_by_code(db_session):
    language = await service.add_language(LanguageCreate(language_code="ur"), db_session)
    assert (await service.get_by_code("ur", db_session)).id == language.id
    assert await service.get_by_code("zz", db_session) is None


async def test_update_language(db_session):
    language = await service.add_language(LanguageCreate(language_code="ur"), db_session)
    updated = await service.update_language(
        language.id, LanguageUpdate(language_name="Urdu (Pakistan)"), db_session
    )
    assert updated is not None
    assert updated.language_name == "Urdu (Pakistan)"
    assert await service.update_language(99999, LanguageUpdate(language_name="x"), db_session) is None


async def test_update_language_is_default_clears_others(db_session):
    await service.seed_defaults(db_session)
    urdu = await service.add_language(LanguageCreate(language_code="ur"), db_session)

    await service.update_language(urdu.id, LanguageUpdate(is_default=True), db_session)

    english = await service.get_by_code("en", db_session)
    assert english.is_default is False
    assert (await service.get_language(urdu.id, db_session)).is_default is True


async def test_list_languages_orders_default_first(db_session):
    await service.seed_defaults(db_session)
    urdu = await service.add_language(LanguageCreate(language_code="ur"), db_session)

    ordered = await service.list_languages(db_session)
    assert [lang.language_code for lang in ordered] == ["en", "ur"]

    await service.set_default(urdu.id, db_session)
    reordered = await service.list_languages(db_session)
    assert [lang.language_code for lang in reordered] == ["ur", "en"]


async def test_set_default_makes_exclusive_default(db_session):
    await service.seed_defaults(db_session)
    urdu = await service.add_language(LanguageCreate(language_code="ur"), db_session)
    english = await service.get_by_code("en", db_session)

    defaulted = await service.set_default(urdu.id, db_session)
    assert defaulted.is_default is True
    assert defaulted.status == LanguageStatus.published
    assert (await service.get_language(english.id, db_session)).is_default is False


async def test_set_default_missing_returns_none(db_session):
    assert await service.set_default(99999, db_session) is None


async def test_set_status_unpublish(db_session):
    await service.seed_defaults(db_session)
    urdu = await service.add_language(LanguageCreate(language_code="ur"), db_session)

    updated = await service.set_status(urdu.id, LanguageStatus.unpublished, db_session)
    assert updated.status == LanguageStatus.unpublished


async def test_set_status_unpublish_default_raises(db_session):
    await service.seed_defaults(db_session)
    english = await service.get_by_code("en", db_session)

    with pytest.raises(ValueError):
        await service.set_status(english.id, LanguageStatus.unpublished, db_session)


async def test_set_status_missing_returns_none(db_session):
    assert await service.set_status(99999, LanguageStatus.published, db_session) is None


async def test_delete_language(db_session):
    await service.seed_defaults(db_session)
    urdu = await service.add_language(LanguageCreate(language_code="ur"), db_session)

    assert await service.delete_language(urdu.id, db_session) is True
    assert await service.get_language(urdu.id, db_session) is None
    assert await service.delete_language(urdu.id, db_session) is False


async def test_delete_default_language_raises(db_session):
    await service.seed_defaults(db_session)
    english = await service.get_by_code("en", db_session)

    with pytest.raises(ValueError):
        await service.delete_language(english.id, db_session)
