from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SafetyDecision:
    blocked: bool
    response: str | None = None


class SafetyChecker:
    def evaluate(self, message: str) -> SafetyDecision:
        text = message.lower()
        blocked_patterns = (
            'how do i fake an accident',
            'how do i escape after an accident',
            'how to avoid police after hit and run',
            'how to hurt someone with a car',
            'how to kill',
        )
        if any(pattern in text for pattern in blocked_patterns):
            return SafetyDecision(
                blocked=True,
                response=(
                    'I cannot help with harming people, evading emergency response, or hiding a crash. '
                    'If this involves a real incident, call 112 and follow lawful safety procedures immediately.'
                ),
            )
        return SafetyDecision(blocked=False)
