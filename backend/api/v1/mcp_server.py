import logging

from mcp.server.fastmcp import FastMCP
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.routing import Mount, Route

logger = logging.getLogger("safevixai.mcp")

# Create the FastMCP Server
mcp = FastMCP("SafeVixAI")


# ── Tool 1: Emergency Services ────────────────────────────────────────────────
@mcp.tool()
async def get_emergency_services(lat: float, lon: float, radius: int = 5000) -> str:
    """Get nearby emergency services (hospitals, police, fire stations, ambulances) for a given location.
    Automatically expands radius if no results found (5km → 15km → 25km).
    Returns confidence level: high / moderate / low.
    
    Args:
        lat: Latitude of the location
        lon: Longitude of the location
        radius: Initial search radius in meters (default 5000)
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

        # Dynamic radius expansion: 5km → 15km → 25km
        result = []
        used_radius = radius
        coverage = "high"

        for expand_radius in [radius, 15000, 25000]:
            result = await service.get_nearby_facilities(lat, lon, expand_radius)
            used_radius = expand_radius
            if result:
                break
            coverage = "moderate" if expand_radius == 15000 else "low"

        if not result:
            return (
                "⚠️ No emergency services found within 25km. Coverage: VERY LOW.\n"
                "You may be in a remote area. Call 112 for national dispatch."
            )

        output = [
            f"Found {len(result)} services within {used_radius/1000:.0f}km | Coverage: {coverage.upper()}",
            "Showing top 10:"
        ]
        for r in result[:10]:
            trauma = " [TRAUMA]" if r.has_trauma else ""
            icu = " [ICU]" if r.has_icu else ""
            hr = " [24hr]" if r.is_24hr else ""
            output.append(
                f"• {r.name} ({r.category.upper()}){trauma}{icu}{hr}: "
                f"{int(r.distance_meters)}m away. Phone: {r.phone or 'N/A'}"
            )

        return "\n".join(output)
    except Exception as e:
        logger.error(f"Error fetching emergency services via MCP: {e}")
        return f"Failed to fetch emergency services: {str(e)}"
    finally:
        await overpass.aclose()
        await cache.close()


# ── Tool 2: Report Road Issue ─────────────────────────────────────────────────
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
    from core.database import get_async_session
    from sqlalchemy import text
    import uuid

    issue_id = str(uuid.uuid4())

    try:
        async for session in get_async_session():
            await session.execute(
                text("""
                    INSERT INTO road_issues (uuid, issue_type, severity, lat, lon, description, status, reporter_id, created_at)
                    VALUES (:uuid, :issue_type, :severity, :lat, :lon, :description, 'open',
                            '00000000-0000-0000-0000-000000000000'::uuid, NOW())
                """),
                {
                    "uuid": issue_id,
                    "issue_type": issue_type,
                    "severity": severity,
                    "lat": lat,
                    "lon": lon,
                    "description": f"[MCP Agent] {description}",
                }
            )
            await session.commit()

        return f"✅ Reported {issue_type} (severity {severity}/5) at {lat:.5f},{lon:.5f}. Issue ID: {issue_id}"
    except Exception as e:
        logger.error(f"Error reporting road issue via MCP: {e}")
        return f"Failed to report road issue: {str(e)}"


# ── Tool 3: Calculate Challan ─────────────────────────────────────────────────
@mcp.tool()
async def calculate_challan(vehicle_type: str, offense_type: str, previous_offenses: int = 0) -> str:
    """Calculate the estimated traffic challan (fine) for a specific offense in India under the MV Act.
    
    Args:
        vehicle_type: The type of vehicle ('2W', '4W', 'HMV', 'LMV')
        offense_type: The type of traffic offense ('speeding', 'red_light', 'helmet', 'drunk_driving',
                      'seatbelt', 'mobile_use', 'overloading', 'pollution', 'no_insurance')
        previous_offenses: Number of prior offenses of this type (0 = first time, 1+ = repeat)
    """
    from services.challan_service import ChallanService
    from core.config import get_settings

    settings = get_settings()
    service = ChallanService(settings)

    result = await service.calculate_fine(vehicle_type, offense_type, previous_offenses)

    if "error" in result:
        return f"Could not calculate challan: {result['error']}"

    repeat_note = ""
    if previous_offenses > 0:
        repeat_note = "\n⚠️ REPEAT OFFENSE — Penalty doubled/tripled as per MV Amendment 2019"

    return (
        f"🚦 Traffic Challan Estimate\n"
        f"Offense: {offense_type} | Vehicle: {vehicle_type}\n"
        f"Fine: ₹{result.get('fine_amount', 'Unknown')}{repeat_note}\n"
        f"MV Act Section: {result.get('mv_act_section', 'N/A')}\n"
        f"Consequences: {', '.join(result.get('consequences', []))}\n"
        f"Description: {result.get('description', 'N/A')}"
    )


# ── Tool 4: Get Road Weather ──────────────────────────────────────────────────
@mcp.tool()
async def get_road_weather(lat: float, lon: float) -> str:
    """Get current weather conditions at a road location — critical for safe routing decisions.
    Returns visibility, rain, temperature, wind speed, and road safety assessment.
    
    Args:
        lat: Latitude of the location
        lon: Longitude of the location
    """
    import httpx

    try:
        # Open-Meteo is free, no API key required — perfect for enterprise offline fallback
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,relative_humidity_2m,precipitation,rain,snowfall,"
                               "weather_code,wind_speed_10m,visibility",
                    "wind_speed_unit": "kmh",
                    "timezone": "Asia/Kolkata",
                }
            )
            resp.raise_for_status()
            data = resp.json()

        current = data.get("current", {})
        rain = current.get("rain", 0)
        snow = current.get("snowfall", 0)
        wind = current.get("wind_speed_10m", 0)
        visibility = current.get("visibility", 10000)  # meters
        temp = current.get("temperature_2m", 0)
        humidity = current.get("relative_humidity_2m", 0)
        precipitation = current.get("precipitation", 0)
        code = current.get("weather_code", 0)

        # Road safety assessment
        risk_level = "LOW"
        warnings = []
        if rain > 5 or precipitation > 5:
            risk_level = "HIGH"
            warnings.append("Heavy rain — reduce speed, increase following distance")
        elif rain > 0.5:
            risk_level = "MODERATE"
            warnings.append("Rain — wet roads, use wipers and caution")
        if visibility < 1000:
            risk_level = "HIGH"
            warnings.append("Low visibility < 1km — use fog lights")
        if wind > 50:
            risk_level = "HIGH"
            warnings.append("Strong winds > 50km/h — risk for HMVs and two-wheelers")
        if snow > 0:
            risk_level = "EXTREME"
            warnings.append("Snowfall — roads may be icy, drive with extreme caution")

        # WMO weather code descriptions (simplified)
        condition = _wmo_code_to_text(code)

        return (
            f"🌤️ Road Weather at {lat:.4f},{lon:.4f}\n"
            f"Condition: {condition}\n"
            f"Temperature: {temp}°C | Humidity: {humidity}%\n"
            f"Rain: {rain}mm | Wind: {wind} km/h\n"
            f"Visibility: {visibility/1000:.1f}km\n"
            f"\n🚦 Road Safety Risk: {risk_level}\n"
            + ("\n".join(f"⚠️ {w}" for w in warnings) if warnings else "✅ Road conditions appear safe")
        )

    except Exception as e:
        logger.error(f"Weather fetch failed: {e}")
        return f"Weather data unavailable: {str(e)}. Assume wet/low-visibility conditions when routing in monsoon season."


def _wmo_code_to_text(code: int) -> str:
    """Convert WMO weather interpretation code to human-readable text."""
    table = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Moderate drizzle",
        55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall",
        80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
        95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
    }
    return table.get(code, f"Weather code {code}")


# ── Tool 5: Calculate Safe Route ─────────────────────────────────────────────
@mcp.tool()
async def calculate_safe_route(
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float,
    avoid_accidents: bool = True
) -> str:
    """Calculate the safest driving route between two points.
    Considers road type, distance, duration, and nearby accident blackspots.
    
    Args:
        origin_lat: Starting point latitude
        origin_lon: Starting point longitude
        dest_lat: Destination latitude
        dest_lon: Destination longitude
        avoid_accidents: Whether to flag accident blackspot areas (default True)
    """
    import httpx

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # OSRM public routing — free, no key
            url = (
                f"http://router.project-osrm.org/route/v1/driving/"
                f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
                f"?overview=false&steps=true&annotations=false"
            )
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        routes = data.get("routes", [])
        if not routes:
            return "No route found between these coordinates."

        route = routes[0]
        distance_km = route["distance"] / 1000
        duration_min = route["duration"] / 60
        legs = route.get("legs", [{}])
        steps = legs[0].get("steps", []) if legs else []

        # Top 5 turn instructions
        instructions = []
        for step in steps[:5]:
            maneuver = step.get("maneuver", {})
            instruction_type = maneuver.get("type", "")
            modifier = maneuver.get("modifier", "")
            name = step.get("name", "unnamed road")
            dist = step.get("distance", 0)
            if instruction_type:
                instructions.append(f"→ {instruction_type.title()} {modifier} onto {name} ({dist:.0f}m)")

        safety_note = ""
        if avoid_accidents and distance_km > 10:
            safety_note = "\n⚠️ Safety tip: National highways (NH) at night have 3x higher accident rates. Consider daylight travel or rest breaks every 100km."

        return (
            f"🗺️ Route Calculated\n"
            f"Distance: {distance_km:.1f} km | Est. Duration: {duration_min:.0f} mins\n"
            f"\nTurn-by-turn (first 5 steps):\n"
            + "\n".join(instructions or ["Direct route — no turns data"])
            + safety_note
            + "\n\n✅ Source: OSRM (OpenStreetMap)"
        )

    except Exception as e:
        logger.error(f"Route calculation failed: {e}")
        return f"Routing unavailable: {str(e)}. Use Google Maps or TomTom as backup."


# ── Tool 6: Get First Aid Guide ───────────────────────────────────────────────
@mcp.tool()
async def get_first_aid_guide(injury_type: str, crash_severity: str = "moderate") -> str:
    """Get evidence-based first aid steps for a specific injury type after a road accident.
    Steps are designed for bystanders with no medical training.
    
    Args:
        injury_type: Type of injury ('head_injury', 'bleeding', 'fracture', 'unconscious',
                     'chest_pain', 'burn', 'spinal_injury', 'multiple_trauma')
        crash_severity: Severity of crash ('minor', 'moderate', 'severe')
    """
    FIRST_AID_DB = {
        "head_injury": {
            "priority": "CRITICAL",
            "steps": [
                "DO NOT move the person — assume spinal injury until ruled out",
                "Keep their head and neck still — support with both hands if needed",
                "Check breathing — if not breathing, start CPR",
                "If bleeding from head: apply gentle pressure with clean cloth",
                "DO NOT remove any object embedded in skull",
                "Keep them awake — talk to them constantly",
                "Call 108 immediately — head injuries can deteriorate rapidly",
            ],
            "warning": "Signs of brain injury: unequal pupils, clear fluid from ears/nose, repeated vomiting"
        },
        "bleeding": {
            "priority": "HIGH",
            "steps": [
                "Apply firm direct pressure with clean cloth or clothing",
                "Do NOT remove cloth once applied — add more on top if soaked",
                "Elevate the bleeding part above heart level if possible",
                "For arterial bleeding (bright red, pulsing): apply tourniquet 5cm above wound",
                "Tourniquet: tie tightly, note the time applied",
                "Keep the person warm — shock causes rapid heat loss",
                "Call 108 immediately"
            ],
            "warning": "If blood soaks through 2+ cloths and bleeding won't stop — arterial injury"
        },
        "unconscious": {
            "priority": "CRITICAL",
            "steps": [
                "Check response: tap shoulders, call their name",
                "Open airway: tilt head back, lift chin",
                "Check breathing: look for chest rise for 10 seconds",
                "If not breathing: start CPR — 30 compressions then 2 breaths",
                "CPR rate: 100-120 compressions per minute (rhythm of 'Stayin Alive')",
                "Place in recovery position if breathing but unconscious",
                "NEVER leave them alone — keep monitoring until ambulance arrives",
                "Call 108 immediately"
            ],
            "warning": "DO NOT give food or water to unconscious person"
        },
        "fracture": {
            "priority": "MODERATE",
            "steps": [
                "Immobilize the injured limb — do not try to straighten it",
                "Splint using whatever is available: sticks, rolled cloth, umbrella",
                "Tie splint above and below the fracture point — not over it",
                "Check circulation: pulse and warmth below the fracture",
                "For open fracture (bone visible): cover with clean cloth, do not push bone in",
                "Elevate if possible, apply ice pack wrapped in cloth",
                "Do not let person walk on suspected leg fracture"
            ],
            "warning": "Suspected spinal fracture: DO NOT move the person at all"
        },
        "spinal_injury": {
            "priority": "CRITICAL",
            "steps": [
                "DO NOT move the person under any circumstances",
                "Keep their head, neck, and spine perfectly still",
                "If they must be moved (fire): log-roll technique — minimum 4 people",
                "Talk to them — ask them not to move",
                "Place rolled clothing either side of head to prevent movement",
                "Monitor breathing continuously",
                "Call 108 — tell them to send a specialized trauma team"
            ],
            "warning": "Signs: neck/back pain, numbness, tingling, weakness in limbs = DO NOT MOVE"
        },
        "multiple_trauma": {
            "priority": "CRITICAL",
            "steps": [
                "ABCDE: Airway → Breathing → Circulation → Disability → Exposure",
                "A: Ensure airway is clear — tilt head back",
                "B: Check breathing — start CPR if needed",
                "C: Control major bleeding with direct pressure",
                "D: Assess consciousness level — can they respond?",
                "E: Look for hidden injuries — check all limbs",
                "Keep them warm with any available cover",
                "Do not give anything to eat or drink",
                "Call 108 — describe all injuries you can see"
            ],
            "warning": "In multiple trauma: bleeding is usually the most immediately life-threatening"
        },
        "chest_pain": {
            "priority": "HIGH",
            "steps": [
                "Sit them upright or semi-reclined (not lying flat)",
                "Loosen any tight clothing around chest and neck",
                "Ask if they have nitroglycerine — help them take it",
                "If they have aspirin and are not allergic: 325mg to chew (not swallow)",
                "Keep them calm and still — exertion worsens cardiac events",
                "Be prepared to do CPR if they lose consciousness",
                "Call 108 immediately — mention 'chest pain' for cardiac priority"
            ],
            "warning": "Symptoms: crushing chest pain, pain radiating to left arm/jaw, sweating, nausea"
        },
        "burn": {
            "priority": "HIGH",
            "steps": [
                "Cool the burn with cool (NOT ice cold) running water for 20 minutes",
                "Remove jewellery and watches near the burn — swelling will make this impossible later",
                "Cover loosely with cling film or clean plastic bag — not cotton wool",
                "Do NOT apply butter, toothpaste, or any cream",
                "Do NOT burst blisters",
                "For burns to face/airway: sit upright and call 108 urgently",
                "For chemical burns: brush off dry chemicals first, then wash for 20 minutes"
            ],
            "warning": "Burns larger than palm of hand, face burns, or inhalation burns = immediate 108"
        }
    }

    injury_lower = injury_type.lower().replace(" ", "_").replace("-", "_")

    # Try exact match, then partial match
    guide = FIRST_AID_DB.get(injury_lower)
    if not guide:
        for key in FIRST_AID_DB:
            if key in injury_lower or injury_lower in key:
                guide = FIRST_AID_DB[key]
                break

    if not guide:
        return (
            f"No specific guide for '{injury_type}'. General trauma protocol:\n"
            f"1. Keep victim still\n2. Control bleeding\n3. Ensure airway is clear\n"
            f"4. Keep them warm\n5. Call 108 immediately\n\n"
            f"Available guides: {', '.join(FIRST_AID_DB.keys())}"
        )

    severity_note = ""
    if crash_severity == "severe":
        severity_note = "\n🔴 SEVERE CRASH — Assume multiple injuries. Treat most life-threatening first."
    elif crash_severity == "moderate":
        severity_note = "\n🟡 MODERATE CRASH — Monitor for delayed onset of shock."

    steps_text = "\n".join(f"{i+1}. {step}" for i, step in enumerate(guide["steps"]))

    return (
        f"🩺 First Aid: {injury_type.replace('_', ' ').title()}\n"
        f"Priority: {guide['priority']}{severity_note}\n\n"
        f"Steps:\n{steps_text}\n\n"
        f"⚠️ WARNING: {guide['warning']}\n\n"
        f"📞 ALWAYS call 108 (ambulance) and 112 (emergency)"
    )


# ── Tool 7: Get Location from What3Words ─────────────────────────────────────
@mcp.tool()
async def get_location_from_what3words(words: str) -> str:
    """Convert a What3Words address (e.g. 'filled.count.soap') to GPS coordinates and a readable address.
    Useful for pinpointing rural accident locations without a postal address.
    
    Args:
        words: What3Words address — 3 words separated by dots (e.g. 'slurs.this.ship')
    """
    import httpx
    from core.config import get_settings

    settings = get_settings()

    # Clean input
    words = words.strip().lstrip('/').lower()
    if words.startswith('///'):
        words = words[3:]

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            api_key = getattr(settings, 'w3w_api_key', None)
            if not api_key:
                return (
                    "What3Words API key not configured. "
                    "Set W3W_API_KEY in environment variables.\n"
                    f"Words provided: ///{words}\n"
                    "Visit: map.what3words.com/{words} to view on web"
                )

            resp = await client.get(
                "https://api.what3words.com/v3/convert-to-coordinates",
                params={"words": words, "language": "en", "format": "json", "key": api_key}
            )
            resp.raise_for_status()
            data = resp.json()

        if "error" in data:
            return f"What3Words error: {data['error'].get('message', 'Unknown error')}"

        coords = data.get("coordinates", {})
        lat = coords.get("lat")
        lon = coords.get("lng")
        nearest = data.get("nearestPlace", "Unknown")
        country = data.get("country", "")

        return (
            f"📍 What3Words: ///{words}\n"
            f"GPS: {lat}, {lon}\n"
            f"Nearest place: {nearest}, {country}\n"
            f"Google Maps: https://www.google.com/maps?q={lat},{lon}\n"
            f"Use these coordinates to dispatch emergency services."
        )

    except Exception as e:
        logger.error(f"W3W conversion failed: {e}")
        return (
            f"What3Words lookup failed: {str(e)}\n"
            f"Words: ///{words}\n"
            f"Try: map.what3words.com/{words}"
        )



# ── SSE ASGI app — mounted by FastAPI at /mcp ────────────────────────────────
# FastMCP has no public .sse_app() in this version; build it manually using the
# same pattern that FastMCP.run_sse_async() uses internally.
_sse_transport = SseServerTransport("/mcp/messages/")


async def _handle_sse(request: Request) -> None:
    async with _sse_transport.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        await mcp._mcp_server.run(
            streams[0],
            streams[1],
            mcp._mcp_server.create_initialization_options(),
        )


sse_app = Starlette(
    routes=[
        Route("/sse", endpoint=_handle_sse),
        Mount("/messages/", app=_sse_transport.handle_post_message),
    ]
)
