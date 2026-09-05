"""
scaffold_tests.py

Run this once from your project root to automatically generate a
professional pytest folder structure that mirrors your FastAPI modules.

Usage:
    python scaffold_tests.py

or

    uv run python scaffold_tests.py
"""

from pathlib import Path

# ==========================================================
# Configuration
# ==========================================================

ROOT = Path("tests")

# Modules containing router.py, service.py, model.py
MODEL_MODULES = [
    "auth",
    "catalog",
    "companies",
    "content",
    "customers",
    "discounts",
    "orders",
    "segments",
    "store",
]

# Modules containing router.py + service.py only
SERVICE_ONLY_MODULES = [
    "channels",
]

# app/modules/settings/*
SETTINGS_SUBMODULES = [
    "account",
    "apps",
    "checkout",
    "customer_accounts",
    "customer_events",
    "general",
    "languages",
    "legal_privacy",
    "locations",
    "metafields_and_metaobjects",
    "notifications",
    "payment",
    "roles",
    "sales_channels",
    "security",
    "shipping_and_delivery",
    "users",
]

TEST_TEMPLATE = '''"""
Tests for app.modules.{module_path}.{layer}
"""

import pytest


def test_placeholder():
    """
    Replace with real tests.
    """
    assert True
'''

CONFTST_TEMPLATE = '''"""
Shared pytest fixtures.
"""

import pytest


@pytest.fixture
def sample_fixture():
    return True
'''

PYTEST_INI = """[pytest]
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
testpaths = tests
"""

FACTORY_TEMPLATE = '''"""
Factories for test data.
"""

# Example:
#
# from faker import Faker
#
# fake = Faker()
#
# def create_user():
#     return {
#         "name": fake.name(),
#         "email": fake.email(),
#     }
'''

README = """# Tests

This folder was generated automatically.

Structure:

tests/
│
├── conftest.py
├── factories/
├── test_core/
├── test_db/
└── test_modules/

Replace placeholder tests with real pytest test cases.
"""


# ==========================================================
# Helpers
# ==========================================================


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def ensure_init(path: Path):
    init = path / "__init__.py"
    if not init.exists():
        init.touch()


def write_if_missing(path: Path, content: str):
    if not path.exists():
        path.write_text(content, encoding="utf-8")


def create_test(folder: Path, module_path: str, layer: str):
    filename = folder / f"test_{layer}.py"
    write_if_missing(
        filename,
        TEST_TEMPLATE.format(
            module_path=module_path,
            layer=layer,
        ),
    )


def scaffold_module(base: Path, module: str, layers: list[str], module_path: str):
    folder = base / f"test_{module}"

    ensure_dir(folder)
    ensure_init(folder)

    for layer in layers:
        create_test(folder, module_path, layer)


# ==========================================================
# Main
# ==========================================================


def main():

    print("=" * 60)
    print("Creating pytest scaffold...")
    print("=" * 60)

    ensure_dir(ROOT)
    ensure_init(ROOT)

    write_if_missing(ROOT / "README.md", README)
    write_if_missing(ROOT / "conftest.py", CONFTST_TEMPLATE)
    write_if_missing(Path("pytest.ini"), PYTEST_INI)

    # factories
    factories = ROOT / "factories"
    ensure_dir(factories)
    ensure_init(factories)
    write_if_missing(factories / "factory.py", FACTORY_TEMPLATE)

    # test_core
    test_core = ROOT / "test_core"
    ensure_dir(test_core)
    ensure_init(test_core)

    write_if_missing(
        test_core / "test_security.py",
        TEST_TEMPLATE.format(
            module_path="core.security",
            layer="security",
        ),
    )

    write_if_missing(
        test_core / "test_utils.py",
        TEST_TEMPLATE.format(
            module_path="core.utils",
            layer="utils",
        ),
    )

    # test_db
    test_db = ROOT / "test_db"
    ensure_dir(test_db)
    ensure_init(test_db)

    write_if_missing(
        test_db / "test_database.py",
        TEST_TEMPLATE.format(
            module_path="db.database",
            layer="database",
        ),
    )

    # modules
    modules = ROOT / "test_modules"
    ensure_dir(modules)
    ensure_init(modules)

    for module in MODEL_MODULES:
        scaffold_module(
            modules,
            module,
            ["router", "service", "model"],
            module,
        )

    for module in SERVICE_ONLY_MODULES:
        scaffold_module(
            modules,
            module,
            ["router", "service"],
            module,
        )

    # settings
    settings = modules / "test_settings"
    ensure_dir(settings)
    ensure_init(settings)

    for submodule in SETTINGS_SUBMODULES:

        scaffold_module(
            settings,
            submodule,
            ["router", "service"],
            f"settings.{submodule}",
        )

        if submodule == "apps":
            folder = settings / "test_apps"

            write_if_missing(
                folder / "test_adapters.py",
                TEST_TEMPLATE.format(
                    module_path="settings.apps.adapters",
                    layer="adapters",
                ),
            )

    print()
    print("✅ Done!")
    print()
    print(f"Created structure inside: {ROOT.resolve()}")
    print("You can now start writing pytest test cases.")


if __name__ == "__main__":
    main()