import pytest

from app.main import app


@pytest.mark.asyncio
async def test_gzip_compression_enabled(client):
    payload = "x" * 5000

    @app.get("/__test_compression_large")
    async def _large_payload():
        return {"payload": payload}

    response = await client.get(
        "/__test_compression_large",
        headers={"Accept-Encoding": "gzip"},
    )

    assert response.status_code == 200
    assert response.headers.get("content-encoding") == "gzip"
    assert response.json() == {"payload": payload}
