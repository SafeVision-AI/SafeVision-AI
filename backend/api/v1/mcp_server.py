import logging
from mcp.server.fastmcp import FastMCP

logger = logging.getLogger("safevixai.mcp")

# Create the FastMCP Server
mcp = FastMCP("SafeVixAI")

@mcp.tool()
async def get_emergency_services(lat: float, lon: float, radius: int = 5000) -> str:
    """Get nearby emergency services (hospitals, police, fire stations, ambulances) for a given location.
    
    Args:
        lat: Latitude of the location
        lon: Longitude of the location
        radius: Search radius in meters (default 5000)
    """
    from core.config import get_settings
    from core.redis_client import create_cache
    from services.overpass_service import OverpassService
    from services.emergency_locator import EmergencyLocatorService

    settings = get_settings()
    cache = create_cache(settings.redis_url)
    overpass = OverpassService(settings)
    
    try:
        service = EmergencyLocatorService(settings, cache, overpass)
        result = await service.get_nearby_facilities(lat, lon, radius)
        
        if not result:
            return f"No emergency services found within {radius} meters."
            
        output = [f"Found {len(result)} emergency services within {radius}m (showing top 10):"]
        for r in result[:10]:
            output.append(f"- {r.name} ({r.category.upper()}): {int(r.distance)}m away. Phone: {r.phone or 'N/A'}")
            
        return "\n".join(output)
    except Exception as e:
        logger.error(f"Error fetching emergency services via MCP: {e}")
        return f"Failed to fetch emergency services: {str(e)}"
    finally:
        await overpass.aclose()
        await cache.close()


@mcp.tool()
async def report_road_issue(issue_type: str, severity: int, lat: float, lon: float, description: str = "") -> str:
    """Report a road issue (pothole, accident, roadblock) to the SafeVixAI platform.
    
    Args:
        issue_type: Type of issue (e.g., 'pothole', 'accident', 'waterlogging', 'roadblock')
        severity: Severity level (1-5, where 5 is most severe)
        lat: Latitude of the issue
        lon: Longitude of the issue
        description: Optional description of the issue
    """
    from core.database import async_session_maker
    from models.database_models import RoadIssue
    import uuid

    issue = RoadIssue(
        uuid=str(uuid.uuid4()),
        user_id="00000000-0000-0000-0000-000000000000", # System/Agent reported
        issue_type=issue_type,
        severity=severity,
        lat=lat,
        lon=lon,
        description=f"[MCP Agent Report] {description}",
        status="open"
    )
    
    try:
        async with async_session_maker() as session:
            session.add(issue)
            await session.commit()
        return f"Successfully reported {issue_type} (severity {severity}) at {lat},{lon}. Issue ID: {issue.uuid}"
    except Exception as e:
        logger.error(f"Error reporting road issue via MCP: {e}")
        return f"Failed to report road issue: {str(e)}"

@mcp.tool()
async def calculate_challan(vehicle_type: str, offense_type: str, previous_offenses: int = 0) -> str:
    """Calculate the estimated traffic challan (fine) for a specific offense in India.
    
    Args:
        vehicle_type: The type of vehicle (e.g., '2W', '4W', 'HMV')
        offense_type: The type of traffic offense (e.g., 'speeding', 'red_light', 'helmet', 'drunk_driving')
        previous_offenses: Number of times this offense was committed before (default 0)
    """
    from services.challan_service import ChallanService
    from core.config import get_settings
    
    settings = get_settings()
    service = ChallanService(settings)
    
    result = await service.calculate_fine(vehicle_type, offense_type, previous_offenses)
    
    if "error" in result:
        return f"Could not calculate challan: {result['error']}"
        
    return (
        f"Estimated Challan for {offense_type} ({vehicle_type}): ₹{result.get('fine_amount', 'Unknown')}\n"
        f"Section: {result.get('mv_act_section', 'N/A')}\n"
        f"Consequences: {', '.join(result.get('consequences', []))}\n"
        f"Description: {result.get('description', 'N/A')}"
    )

# Export the SSE app directly so it can be mounted by FastAPI
sse_app = mcp.sse_app()
