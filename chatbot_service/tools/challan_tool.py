from __future__ import annotations

import re

from tools import BackendToolClient


VIOLATION_CODE_PATTERN = re.compile(r'\b(?:179|181|183|185|194B|194D)\b', re.IGNORECASE)
STATE_PATTERN = re.compile(r'\b(?:TN|DL|MH|KA|UP|WB|KL|AP|TS|RJ|GJ)\b', re.IGNORECASE)


class ChallanTool:
    def __init__(self, backend_client: BackendToolClient) -> None:
        self.backend_client = backend_client

    async def calculate(
        self,
        *,
        violation_code: str,
        vehicle_class: str,
        state_code: str,
        is_repeat: bool,
    ) -> dict | None:
        return await self.backend_client.post(
            '/api/v1/challan/calculate',
            payload={
                'violation_code': violation_code,
                'vehicle_class': vehicle_class,
                'state_code': state_code,
                'is_repeat': is_repeat,
            },
        )

    async def infer_and_calculate(self, message: str) -> dict | None:
        violation_match = VIOLATION_CODE_PATTERN.search(message)
        if violation_match is None:
            return None
        state_match = STATE_PATTERN.search(message)
        vehicle_class = self._infer_vehicle_class(message)
        is_repeat = any(term in message.lower() for term in ('repeat', 'second time', 'again'))
        return await self.calculate(
            violation_code=violation_match.group(0).upper(),
            vehicle_class=vehicle_class,
            state_code=state_match.group(0).upper() if state_match else 'TN',
            is_repeat=is_repeat,
        )

    @staticmethod
    def _infer_vehicle_class(message: str) -> str:
        text = message.lower()
        if any(term in text for term in ('bike', 'motorcycle', 'scooter', '2w')):
            return 'two_wheeler'
        if any(term in text for term in ('truck', 'lorry', 'htv')):
            return 'heavy_vehicle'
        if any(term in text for term in ('bus', 'comm', 'commercial bus')):
            return 'bus'
        return 'light_motor_vehicle'
