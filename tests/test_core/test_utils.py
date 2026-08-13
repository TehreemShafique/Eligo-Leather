"""Tests for the application configuration object in ``app.core.config``."""

from app.core.config import BASE_DIR, settings


def test_settings_has_expected_defaults():
    assert settings.PROJECT_NAME == "Eligo Backend"
    assert settings.SECRET_KEY
    assert settings.ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0


def test_test_database_url_configured():
    assert settings.TEST_DATABASE_URL.startswith("sqlite")


def test_base_dir_points_to_project_root():
    assert (BASE_DIR / "app").is_dir()
    assert (BASE_DIR / "pyproject.toml").exists()
