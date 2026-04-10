from __future__ import annotations

import re


CHALLAN_CODE_PATTERN = re.compile(r'\b(?:179|181|183|185|194B|194D)\b', re.IGNORECASE)


class IntentDetector:
    def detect(self, message: str) -> str:
        text = message.lower()
        if any(term in text for term in ('accident', 'ambulance', 'hospital', 'police', 'emergency', 'sos')):
            return 'emergency'
        if any(term in text for term in ('bleeding', 'burn', 'fracture', 'cpr', 'choking', 'first aid')):
            return 'first_aid'
        if CHALLAN_CODE_PATTERN.search(message) or any(
            term in text for term in ('challan', 'fine', 'helmet', 'seatbelt', 'drunk driving', 'licence')
        ):
            return 'challan'
        if any(term in text for term in ('motor vehicles act', 'mv act', 'section', 'legal', 'rights', 'inspection')):
            return 'legal'
        if any(term in text for term in ('pothole', 'road issue', 'authority', 'road maintenance', 'report road')):
            return 'road_issue'
        return 'general'
