"""Tests for the (currently empty) channels service module."""

import importlib

from app.modules import channels


def test_channels_service_importable():
    service = importlib.import_module("app.modules.channels.service")
    assert service is not None
