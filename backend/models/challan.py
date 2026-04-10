from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class ChallanRule:
    violation_code: str
    section: str
    description: str
    base_fines: dict[str, int]
    repeat_fines: dict[str, int] = field(default_factory=dict)
    aliases: tuple[str, ...] = ()

    def matches(self, candidate: str) -> bool:
        normalized = candidate.strip().upper()
        if normalized == self.violation_code:
            return True
        return normalized in self.aliases

    def fine_for_vehicle(self, vehicle_class: str) -> int:
        if vehicle_class in self.base_fines:
            return self.base_fines[vehicle_class]
        return self.base_fines.get('default', 0)

    def repeat_fine_for_vehicle(self, vehicle_class: str) -> int | None:
        if not self.repeat_fines:
            return None
        if vehicle_class in self.repeat_fines:
            return self.repeat_fines[vehicle_class]
        return self.repeat_fines.get('default')


@dataclass(frozen=True, slots=True)
class StateChallanOverride:
    state_code: str
    violation_code: str
    vehicle_class: str | None
    base_fine: int
    repeat_fine: int | None = None
    section: str | None = None
    description: str | None = None
    note: str | None = None

    def matches(self, *, state_code: str, violation_code: str, vehicle_class: str) -> bool:
        if self.state_code != state_code:
            return False
        if self.violation_code != violation_code:
            return False
        if self.vehicle_class in (None, '', 'default'):
            return True
        return self.vehicle_class == vehicle_class
