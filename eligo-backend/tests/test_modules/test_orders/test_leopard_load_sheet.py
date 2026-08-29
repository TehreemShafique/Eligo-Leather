"""Tests for the Leopards load-sheet / challan flow.

The challan number only ever comes from the ``generateLoadSheet`` response
(``load_sheet_id``). Every other endpoint — tracking, CN list, booked slips —
returns no challan info. These tests pin the *live-verified* API contract:

- ``generate_load_sheet`` must POST a **JSON** body with ``cn_numbers`` as a
  **list** plus ``courier_name`` / ``courier_code``. The old form-encoded
  ``cn_number`` (comma-joined) is rejected with "CN Number is required", which
  silently broke challan registration in every booking path.
"""

from sqlalchemy import select

from app.modules.orders import leopard_client, leopard_service
from app.modules.orders.model import LeopardLoadSheet


class _FakeJSONResponse:
    def __init__(self, payload):
        self._payload = payload
        self.text = ""
        self.content = b""
        self.status_code = 200
        self.headers = {"content-type": "application/json"}

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None


class _FakeClient:
    last_call = None

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def post(self, url, json=None, data=None, **kwargs):
        _FakeClient.last_call = {"url": url, "json": json, "data": data}
        return _FakeJSONResponse({"status": 1, "error": "", "load_sheet_id": 7752241})


async def test_generate_load_sheet_sends_json_with_cn_numbers_list(monkeypatch):
    monkeypatch.setattr(leopard_client.httpx, "AsyncClient", _FakeClient)
    _FakeClient.last_call = None

    result = await leopard_client.generate_load_sheet(
        ["ID7553167438"], courier_name="Leopards Courier Service", courier_code="LCS"
    )

    assert result["load_sheet_id"] == 7752241
    call = _FakeClient.last_call
    assert call is not None
    # JSON body with a list is the live-verified contract.
    assert call["json"]["cn_numbers"] == ["ID7553167438"]
    assert call["json"]["courier_name"] == "Leopards Courier Service"
    assert call["json"]["courier_code"] == "LCS"
    # The old broken form-encoded `cn_number` field must not be sent back.
    assert call["data"] is None


async def test_ensure_load_sheet_for_cn_registers_challan(db_session, monkeypatch):
    async def _fake_generate(cn_numbers, **kwargs):
        return {"status": 1, "error": "", "load_sheet_id": 7752241}

    async def _fake_verify_challan(challan_no):
        return challan_no == "7752241"

    monkeypatch.setattr(leopard_client, "generate_load_sheet", _fake_generate)
    monkeypatch.setattr(leopard_client, "verify_challan", _fake_verify_challan)

    challan = await leopard_service.ensure_load_sheet_for_cn(db_session, "ID7553167438")

    assert challan == "7752241"
    result = await db_session.execute(
        select(LeopardLoadSheet).where(LeopardLoadSheet.challan_no == "7752241")
    )
    sheet = result.scalar_one_or_none()
    assert sheet is not None
    assert sheet.challan_no == "7752241"


async def test_ensure_load_sheet_for_cn_is_idempotent(db_session, monkeypatch):
    async def _fake_generate(cn_numbers, **kwargs):
        return {"status": 1, "error": "", "load_sheet_id": 7752241}

    async def _fake_verify_challan(challan_no):
        return True

    monkeypatch.setattr(leopard_client, "generate_load_sheet", _fake_generate)
    monkeypatch.setattr(leopard_client, "verify_challan", _fake_verify_challan)

    first = await leopard_service.ensure_load_sheet_for_cn(db_session, "ID7553167438")
    second = await leopard_service.ensure_load_sheet_for_cn(db_session, "ID7553167438")

    assert first == second == "7752241"
    result = await db_session.execute(select(LeopardLoadSheet))
    assert len(list(result.scalars().all())) == 1


async def test_ensure_load_sheet_for_cn_handles_already_generated(db_session, monkeypatch):
    async def _fake_generate(cn_numbers, **kwargs):
        return {"status": 0, "error": {"ID7553167438": "Already Generate Loadsheet"}}

    monkeypatch.setattr(leopard_client, "generate_load_sheet", _fake_generate)

    challan = await leopard_service.ensure_load_sheet_for_cn(db_session, "ID7553167438")

    assert challan is None
    result = await db_session.execute(select(LeopardLoadSheet))
    assert len(list(result.scalars().all())) == 0


async def test_ensure_load_sheet_for_cn_never_raises(db_session, monkeypatch):
    async def _fake_generate(cn_numbers, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(leopard_client, "generate_load_sheet", _fake_generate)

    challan = await leopard_service.ensure_load_sheet_for_cn(db_session, "ID7553167438")

    assert challan is None