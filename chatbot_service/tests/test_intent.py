from __future__ import annotations

from agent.intent_detector import IntentDetector


def test_intent_detector_routes_emergency_queries():
    detector = IntentDetector()
    assert detector.detect('Need an ambulance after an accident') == 'emergency'


def test_intent_detector_routes_challan_queries():
    detector = IntentDetector()
    assert detector.detect('What is the fine under section 185 in TN?') == 'challan'
