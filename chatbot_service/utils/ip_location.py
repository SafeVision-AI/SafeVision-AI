"""ip-api.com State Detection — FREE, no key, 45 req/min.

Auto-detects the user's Indian state from their IP address.
Used by DriveLegal to default state-specific fine calculations.

IMPORTANT: Use HTTP (not HTTPS) — HTTPS requires paid plan.
"""

from __future__ import annotations

import httpx


async def detect_state_from_ip(
    ip: str | None = None,
    *,
    timeout: float = 5.0,
    default_state: str = "Tamil Nadu",
) -> dict:
    """Detect user's state and city from IP address.

    Args:
        ip: Client IP address. If None, uses the caller's IP.
        timeout: Request timeout in seconds.
        default_state: Fallback state if detection fails.

    Returns:
        Dict with keys: state, city, country, lat, lon
    """
    try:
        # ip-api.com supports HTTPS on /json endpoint (free plan)
        url = f"https://ip-api.com/json/{ip}" if ip else "https://ip-api.com/json"
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

        if data.get("status") != "success":
            return _default_result(default_state)

        return {
            "state": data.get("regionName", default_state),
            "city": data.get("city", ""),
            "country": data.get("country", "India"),
            "lat": data.get("lat"),
            "lon": data.get("lon"),
            "isp": data.get("isp", ""),
            "timezone": data.get("timezone", "Asia/Kolkata"),
        }
    except Exception:
        return _default_result(default_state)


def _default_result(state: str) -> dict:
    return {
        "state": state,
        "city": "",
        "country": "India",
        "lat": None,
        "lon": None,
        "isp": "",
        "timezone": "Asia/Kolkata",
    }
