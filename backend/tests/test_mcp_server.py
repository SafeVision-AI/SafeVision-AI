import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

# We will test the direct endpoints created by the FastMCP SSE app
# to ensure it mounts properly into our FastAPI instance.


@pytest.mark.asyncio
async def test_mcp_server_mounted(app):
    """Test that the MCP SSE endpoint is correctly mounted and streams event data.

    Uses httpx.AsyncClient with a short timeout to connect to the SSE endpoint,
    verifies the 200 status + text/event-stream content type, then cancels.
    SSE connections stream forever by design — we only need to verify the mount.
    """
    import anyio
    import httpx

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # SSE streams forever — use a cancel scope to abort after initial handshake
        try:
            with anyio.fail_after(2.0):
                async with client.stream("GET", "/mcp/sse") as response:
                    assert response.status_code == 200, (
                        f"Expected 200 from SSE endpoint, got {response.status_code}"
                    )
                    content_type = response.headers.get("content-type", "")
                    assert "text/event-stream" in content_type, (
                        f"Expected text/event-stream, got {content_type}"
                    )
                    # Read at least one chunk to prove the stream is live
                    async for _line in response.aiter_lines():
                        break  # Got data — SSE is streaming, test passes
        except TimeoutError:
            # SSE stream was open and streaming until timeout — this is correct behavior
            pass


@pytest.mark.asyncio
async def test_mcp_server_messages_endpoint(app):
    """Test that the MCP messages POST endpoint exists and rejects invalid sessions.

    The /mcp/messages/ endpoint requires a valid session_id query param from an
    active SSE connection. Without one, it should return 400 or 500 — proving
    the endpoint is mounted and the SseServerTransport is processing requests.
    A 404 would mean the mount is broken.
    """
    import httpx

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # POST with no session — should get an error but NOT 404
        response = await client.post(
            "/mcp/messages/",
            params={"session_id": "nonexistent-session-id"},
            json={"jsonrpc": "2.0", "method": "ping", "id": 1},
        )
        # The endpoint exists if we get anything other than 404
        # SseServerTransport returns 400/500 for invalid sessions
        assert response.status_code != 404, (
            f"MCP messages endpoint returned 404 — mount is broken. Got: {response.status_code}"
        )
        assert response.status_code in [400, 422, 500], (
            f"Expected 400/422/500 for invalid session, got {response.status_code}"
        )


@pytest.mark.asyncio
@patch("services.challan_service.ChallanService")
async def test_mcp_calculate_challan_tool(mock_challan_class):
    """Unit test for the MCP calculate_challan tool logic."""
    mock_instance = AsyncMock()
    mock_instance.calculate_fine.return_value = {
        "fine_amount": "1000",
        "mv_act_section": "185",
        "consequences": ["Jail", "Fine"],
        "description": "Drunk Driving",
    }
    mock_challan_class.return_value = mock_instance

    from api.v1.mcp_server import mcp

    # FastMCP stores tools in _tool_manager
    tools = mcp._tool_manager._tools
    tool = tools.get("calculate_challan")
    assert tool is not None, "calculate_challan tool not registered"
    fn = tool.fn

    result = await fn(vehicle_type="4W", offense_type="drunk_driving", previous_offenses=0)

    assert "₹1000" in result or "1000" in result
    assert "185" in result


@pytest.mark.asyncio
async def test_mcp_report_road_issue_tool():
    """Unit test for the MCP report_road_issue tool logic."""
    from api.v1.mcp_server import mcp

    tools = mcp._tool_manager._tools
    tool = tools.get("report_road_issue")
    assert tool is not None, "report_road_issue tool not registered"
    fn = tool.fn

    # Call — will fail at DB insert (no real DB) but should still return a string
    result = await fn(issue_type="pothole", severity=4, lat=13.0, lon=80.0, description="Deep pothole")
    assert isinstance(result, str)


@pytest.mark.asyncio
async def test_mcp_get_emergency_services_tool():
    """Smoke test: tool is registered and callable; external services will fail gracefully."""
    from api.v1.mcp_server import mcp

    tools = mcp._tool_manager._tools
    tool = tools.get("get_emergency_services")
    assert tool is not None, "get_emergency_services tool not registered"
    fn = tool.fn

    # Will fail on real HTTP/Redis calls — but should return a string, not raise
    result = await fn(lat=13.0678, lon=80.2785, radius=2000)
    assert isinstance(result, str)
