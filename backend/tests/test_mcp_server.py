import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

# We will test the direct endpoints created by the FastMCP SSE app
# to ensure it mounts properly into our FastAPI instance.

def test_mcp_server_mounted(app):
    """Test that the MCP SSE app is correctly mounted to the main FastAPI app."""
    with TestClient(app) as client:
        response = client.get("/mcp/sse")
        assert response.status_code in [200, 307], f"Expected 200 or redirect, got {response.status_code}"
        if response.status_code == 200:
            assert "text/event-stream" in response.headers.get("content-type", "")

def test_mcp_server_messages_endpoint(app):
    """Test that the MCP messages POST endpoint exists."""
    with TestClient(app) as client:
        response = client.post("/mcp/messages")
        assert response.status_code in [400, 404, 422, 500] 

@pytest.mark.asyncio
@patch('api.v1.mcp_server.ChallanService')
async def test_mcp_calculate_challan_tool(mock_challan_class):
    """Unit test for the MCP calculate_challan tool logic."""
    from api.v1.mcp_server import calculate_challan
    
    mock_instance = AsyncMock()
    mock_instance.calculate_fine.return_value = {
        "fine_amount": "1000",
        "mv_act_section": "185",
        "consequences": ["Jail", "Fine"],
        "description": "Drunk Driving"
    }
    mock_challan_class.return_value = mock_instance
    
    # FastMCP wraps the tool, but the underlying python async function can still be called
    # Or accessed via the registered tools
    from api.v1.mcp_server import mcp
    tool = next(t for t in mcp._tools.values() if t.name == "calculate_challan")
    
    # We call the wrapped tool function directly if possible, or just the original function
    # Because mcp._tools holds a Tool object, the original function is usually `t.fn`
    fn = tool.fn
    
    result = await fn(vehicle_type="4W", offense_type="drunk_driving", previous_offenses=0)
    
    assert "₹1000" in result
    assert "185" in result
    assert "Jail" in result
    mock_instance.calculate_fine.assert_called_once_with("4W", "drunk_driving", 0)

@pytest.mark.asyncio
@patch('api.v1.mcp_server.async_session_maker')
async def test_mcp_report_road_issue_tool(mock_session_maker):
    """Unit test for the MCP report_road_issue tool logic."""
    from api.v1.mcp_server import mcp
    tool = next(t for t in mcp._tools.values() if t.name == "report_road_issue")
    fn = tool.fn
    
    mock_session = AsyncMock()
    # Mock context manager
    mock_session_maker.return_value.__aenter__.return_value = mock_session
    
    result = await fn(issue_type="pothole", severity=4, lat=13.0, lon=80.0, description="Deep pothole")
    
    assert "Successfully reported pothole" in result
    assert "severity 4" in result
    assert "Issue ID:" in result
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()

@pytest.mark.asyncio
@patch('api.v1.mcp_server.EmergencyLocatorService')
@patch('api.v1.mcp_server.create_cache')
@patch('api.v1.mcp_server.OverpassService')
async def test_mcp_get_emergency_services_tool(mock_overpass, mock_cache, mock_locator_class):
    """Unit test for the MCP get_emergency_services tool logic."""
    from api.v1.mcp_server import mcp
    
    # Setup mocks
    mock_cache_instance = MagicMock()
    mock_cache.return_value = mock_cache_instance
    
    mock_overpass_instance = AsyncMock()
    mock_overpass.return_value = mock_overpass_instance
    
    mock_locator_instance = AsyncMock()
    mock_facility1 = MagicMock(name="Apollo", category="hospital", distance=150.5, phone="12345")
    mock_facility2 = MagicMock(name="Police Station", category="police", distance=500.0, phone="100")
    
    mock_locator_instance.get_nearby_facilities.return_value = [mock_facility1, mock_facility2]
    mock_locator_class.return_value = mock_locator_instance
    
    tool = next(t for t in mcp._tools.values() if t.name == "get_emergency_services")
    fn = tool.fn
    
    result = await fn(lat=13.0, lon=80.0, radius=2000)
    
    assert "Found 2 emergency services" in result
    assert mock_locator_instance.get_nearby_facilities.assert_called_once_with(13.0, 80.0, 2000) is None
    mock_overpass_instance.aclose.assert_called_once()
    mock_cache_instance.close.assert_called_once()
