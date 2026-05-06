from __future__ import annotations

import re


CHALLAN_CODE_PATTERN = re.compile(r'\b(?:179|181|183|185|194B|194D)\b', re.IGNORECASE)
INTENT_CLASSES = (
    'emergency',
    'first_aid',
    'challan',
    'legal',
    'road_issue',
    'road_weather',
    'safe_route',
    'road_infrastructure',
    'general',
)


def _has_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


class IntentDetector:
    def detect(self, message: str) -> str:
        text = message.lower()
        if _has_any(text, ('accident', 'ambulance', 'hospital', 'police', 'emergency', 'sos', 'crash', 'injured')):
            return 'emergency'
        if _has_any(text, ('bleeding', 'burn', 'fracture', 'cpr', 'choking', 'first aid', 'wound', 'unconscious')):
            return 'first_aid'
        if CHALLAN_CODE_PATTERN.search(message) or any(
            term in text for term in ('challan', 'fine', 'helmet', 'seatbelt', 'drunk driving', 'licence', 'license')
        ):
            return 'challan'
        if _has_any(text, ('motor vehicles act', 'mv act', 'section', 'legal', 'rights', 'inspection', 'mva')):
            return 'legal'
        if _has_any(text, ('weather', 'rain', 'flood', 'fog', 'visibility', 'heatwave', 'storm', 'monsoon')):
            return 'road_weather'
        if _has_any(text, ('route', 'routing', 'navigate', 'navigation', 'directions', 'safest way', 'safe route')):
            return 'safe_route'
        if _has_any(text, ('road authority', 'pwd', 'nhai', 'pmgsy', 'contractor', 'maintenance owner', 'who maintains')):
            return 'road_infrastructure'
        if _has_any(text, ('pothole', 'road issue', 'road hazard', 'debris', 'bad road', 'report road', 'damaged road')):
            return 'road_issue'
        return 'general'
