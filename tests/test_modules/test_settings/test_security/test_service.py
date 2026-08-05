"""Tests for app.modules.settings.security.service"""

import pytest

from app.modules.settings.security import service


async def test_log_activity(db_session):
    entry = await service.log_activity(
        db_session, event="User was created.", resource_type="User", actor_user_id=1,
    )
    assert entry.id is not None
    assert entry.event == "User was created."
    assert entry.resource_type == "User"
    assert entry.actor_user_id == 1


async def test_list_activity_logs(db_session):
    await service.log_activity(db_session, event="First", resource_type="User", actor_user_id=None)
    await service.log_activity(db_session, event="Second", resource_type="Role", actor_user_id=2)

    logs = await service.list_activity_logs(db_session)
    assert len(logs) == 2
    assert {log.event for log in logs} == {"First", "Second"}


async def test_generate_collaborator_code(db_session):
    code = await service.generate_collaborator_code(db_session)
    assert code.id is not None
    assert len(code.code) == 4
    assert code.is_active is True


async def test_list_collaborator_codes_active_only(db_session):
    active = await service.generate_collaborator_code(db_session)
    revoked = await service.generate_collaborator_code(db_session)
    await service.revoke_collaborator_code(db_session, revoked.id)

    codes = await service.list_collaborator_codes(db_session)
    assert [c.id for c in codes] == [active.id]


async def test_revoke_collaborator_code(db_session):
    code = await service.generate_collaborator_code(db_session)
    revoked = await service.revoke_collaborator_code(db_session, code.id)
    assert revoked is not None
    assert revoked.id == code.id
    assert revoked.is_active is False


async def test_revoke_collaborator_code_missing_returns_none(db_session):
    assert await service.revoke_collaborator_code(db_session, 99999) is None
