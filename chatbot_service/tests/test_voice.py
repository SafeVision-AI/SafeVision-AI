from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from config import get_settings
from services.speech_translation import IndicSeamlessService


def test_indic_seamless_service_reports_local_model_directory_status(tmp_path: Path):
    model_dir = tmp_path / 'indic-seamless'
    model_dir.mkdir()
    settings = replace(
        get_settings(),
        speech_model_dir=model_dir,
        speech_device='cpu',
        speech_default_target_lang='hin',
    )

    service = IndicSeamlessService(settings)
    status = service.status()

    assert status['model_dir_exists'] is True
    assert status['device'] == 'cpu'
    assert status['default_target_language'] == 'hin'
    assert str(model_dir) == status['model_source']
