from __future__ import annotations


class SubmitReportTool:
    def build_guidance(self, *, issue_type: str, lat: float | None, lon: float | None) -> dict:
        coords = 'unknown coordinates'
        if lat is not None and lon is not None:
            coords = f'{lat:.5f}, {lon:.5f}'
        return {
            'summary': (
                f'Prepare a road issue report for "{issue_type}" at {coords}. '
                'Use the main app report flow to attach a photo and severity.'
            )
        }
