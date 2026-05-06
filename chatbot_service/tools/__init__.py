from __future__ import annotations

import logging

import httpx

from config import Settings

logger = logging.getLogger("safevixai.chatbot.tools")


class BackendToolClient:
    def __init__(self, settings: Settings) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.main_backend_base_url,
            timeout=settings.main_backend_timeout_seconds,
            headers={
                'Accept': 'application/json',
                'User-Agent': settings.http_user_agent,
            },
        )

    async def get(self, path: str, *, params: dict | None = None) -> dict | None:
        try:
            response = await self._client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning("Backend GET %s failed with HTTP %s", path, exc.response.status_code)
            return None
        except httpx.RequestError:
            logger.exception("Backend GET %s request failed", path)
            return None
        except ValueError:
            logger.exception("Backend GET %s returned invalid JSON", path)
            return None

    async def post(self, path: str, *, payload: dict | None = None) -> dict | None:
        try:
            response = await self._client.post(path, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning("Backend POST %s failed with HTTP %s", path, exc.response.status_code)
            return None
        except httpx.RequestError:
            logger.exception("Backend POST %s request failed", path)
            return None
        except ValueError:
            logger.exception("Backend POST %s returned invalid JSON", path)
            return None

    async def aclose(self) -> None:
        await self._client.aclose()


from tools.challan_tool import ChallanTool
from tools.drug_info import DrugInfoTool
from tools.emergency_tool import EmergencyTool
from tools.first_aid_tool import FirstAidTool
from tools.geocoding import GeocodingClient
from tools.legal_search_tool import LegalSearchTool
from tools.open_meteo import OpenMeteoClient
from tools.road_infra_tool import RoadInfrastructureTool
from tools.road_issues_tool import RoadIssuesTool
from tools.sos_tool import SosTool
from tools.submit_report_tool import SubmitReportTool
from tools.weather_tool import WeatherTool
from tools.what3words import What3WordsTool

__all__ = [
    'BackendToolClient',
    'ChallanTool',
    'DrugInfoTool',
    'EmergencyTool',
    'FirstAidTool',
    'GeocodingClient',
    'LegalSearchTool',
    'OpenMeteoClient',
    'RoadInfrastructureTool',
    'RoadIssuesTool',
    'SosTool',
    'SubmitReportTool',
    'WeatherTool',
    'What3WordsTool',
]
