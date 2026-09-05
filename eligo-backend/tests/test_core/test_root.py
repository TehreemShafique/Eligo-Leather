import pytest


@pytest.mark.asyncio 
# tells pytest that: This test is asynchronous. Run it inside an asyncio event loop.
async def test_root(client):

    response = await client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Eligo Backend API Engine Running",
        "cache": "enabled",
    }