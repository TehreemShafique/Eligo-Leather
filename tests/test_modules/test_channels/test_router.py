"""Tests for the (currently empty) channels module.

The channels package is a placeholder — the real sales-channel
implementation lives in ``app.modules.settings.sales_channels``. These
tests only verify the module is importable and defines no router.
"""

import importlib

from app.modules import channels


def test_channels_module_importable():
    assert channels is not None


def test_channels_router_has_no_routes():
    router_module = importlib.import_module("app.modules.channels.router")
    assert not hasattr(router_module, "router")
