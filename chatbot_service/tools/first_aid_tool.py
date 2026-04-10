from __future__ import annotations

import json
from pathlib import Path

from config import Settings


FALLBACK_GUIDES = {
    'bleeding': {
        'title': 'Severe bleeding',
        'steps': [
            'Apply firm direct pressure using a clean cloth or bandage.',
            'Keep the injured area elevated if it does not worsen pain.',
            'Do not remove soaked cloth; add more layers over it.',
            'Call 112 or get emergency transport immediately for heavy bleeding.',
        ],
    },
    'burn': {
        'title': 'Burns',
        'steps': [
            'Cool the burn under cool running water for at least 20 minutes.',
            'Remove tight jewelry or clothing near the area if not stuck to the skin.',
            'Cover with a clean, non-fluffy dressing.',
            'Do not apply ice, toothpaste, or oily home remedies.',
        ],
    },
    'fracture': {
        'title': 'Suspected fracture',
        'steps': [
            'Keep the injured limb still and supported.',
            'Do not force the bone back into place.',
            'Apply a cold pack wrapped in cloth to reduce swelling.',
            'Seek urgent medical care, especially for severe pain or deformity.',
        ],
    },
    'cpr': {
        'title': 'CPR',
        'steps': [
            'Call 112 and ask for an ambulance immediately.',
            'Begin hard, fast chest compressions in the center of the chest.',
            'If trained, use cycles of 30 compressions and 2 rescue breaths.',
            'Continue until help arrives or the person starts breathing normally.',
        ],
    },
}


class FirstAidTool:
    def __init__(self, settings: Settings) -> None:
        self._data_path = settings.rag_data_dir / 'first_aid.json'
        self._guides = self._load_guides()

    def lookup(self, query: str) -> dict | None:
        text = query.lower()
        for key, guide in self._guides.items():
            keywords = guide.get('keywords') or [key]
            if any(keyword.lower() in text for keyword in keywords):
                return guide
        return None

    def _load_guides(self) -> dict[str, dict]:
        if not self._data_path.exists():
            return FALLBACK_GUIDES
        try:
            payload = json.loads(self._data_path.read_text(encoding='utf-8'))
        except Exception:
            return FALLBACK_GUIDES
        if not isinstance(payload, dict) or not payload:
            return FALLBACK_GUIDES
        return payload
