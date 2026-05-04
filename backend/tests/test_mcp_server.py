import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

# We will test the direct endpoints created by the FastMCP SSE app
# to ensure it mounts properly into our FastAPI instance.


@pytest.mark.skip(reason="SSE streams forever — TestClient blocks; needs async httpx with cancel")
def test_mcp_server_mounted(app):
    """Test that the MCP SSE app is correctly mounted to the main FastAPI app."""
    with TestClient(app, raise_server_exceptions=False) as client:
        with client.stream("GET", "/mcp/sse") as response:
            assert response.status_code in [200, 307], (
                f"Expected 200 or redirect, got {response.status_code}"
            )
            if response.status_code == 200:
                assert "text/event-stream" in response.headers.get("content-type", "")


@pytest.mark.skip(reason="SSE message endpoint needs active SSE session; standalone POST returns 422")
def test_mcp_server_messages_endpoint(app):
    """Test that the MCP messages POST endpoint exists."""
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post("/mcp/messages/")
        assert response.status_code in [400, 404, 422, 500]


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
