from __future__ import annotations

from dataclasses import asdict, dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

from config import Settings

try:
    import torch
    import torchaudio
    from transformers import (
        SeamlessM4TFeatureExtractor,
        SeamlessM4TTokenizer,
        SeamlessM4Tv2ForSpeechToText,
    )
except Exception:  # pragma: no cover - optional runtime dependency
    torch = None
    torchaudio = None
    SeamlessM4TFeatureExtractor = None
    SeamlessM4TTokenizer = None
    SeamlessM4Tv2ForSpeechToText = None


@dataclass(slots=True)
class SpeechTranslationResult:
    text: str
    target_language: str
    device: str
    model_source: str
    sample_rate: int


class IndicSeamlessService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._model = None
        self._processor = None
        self._tokenizer = None
        self._device = self._resolve_device()

    @property
    def model_source(self) -> str:
        model_dir = self.settings.speech_model_dir
        if model_dir and model_dir.exists():
            return str(model_dir)
        return self.settings.speech_model_id

    def status(self) -> dict[str, Any]:
        model_dir = self.settings.speech_model_dir
        return {
            'configured': bool(self.settings.speech_model_id or model_dir),
            'dependencies_available': self._dependencies_available(),
            'device': self._device,
            'model_source': self.model_source,
            'model_dir_exists': bool(model_dir and model_dir.exists()),
            'default_target_language': self.settings.speech_default_target_lang,
            'model_loaded': self._model is not None,
        }

    def translate_audio_bytes(
        self,
        audio_bytes: bytes,
        *,
        target_language: str | None = None,
    ) -> SpeechTranslationResult:
        if not audio_bytes:
            raise ValueError('Audio payload is empty')
        if not self._dependencies_available():
            raise RuntimeError(
                'IndicSeamless dependencies are not installed. '
                'Install torch, torchaudio, transformers, and datasets in the chatbot_service environment.'
            )

        self._ensure_model_loaded()
        waveform, sample_rate = torchaudio.load(BytesIO(audio_bytes))
        if waveform.ndim == 2 and waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)
        if sample_rate != 16_000:
            waveform = torchaudio.functional.resample(
                waveform,
                orig_freq=sample_rate,
                new_freq=16_000,
            )
            sample_rate = 16_000

        audio_array = waveform.squeeze(0)
        inputs = self._processor(audio_array, sampling_rate=sample_rate, return_tensors='pt')
        inputs = {key: value.to(self._device) for key, value in inputs.items()}

        generated = self._model.generate(
            **inputs,
            tgt_lang=(target_language or self.settings.speech_default_target_lang).lower(),
        )
        tokens = generated[0].detach().cpu().numpy().squeeze()
        text = self._tokenizer.decode(
            tokens,
            clean_up_tokenization_spaces=True,
            skip_special_tokens=True,
        ).strip()
        return SpeechTranslationResult(
            text=text,
            target_language=(target_language or self.settings.speech_default_target_lang).lower(),
            device=self._device,
            model_source=self.model_source,
            sample_rate=sample_rate,
        )

    @staticmethod
    def _dependencies_available() -> bool:
        return all(
            dependency is not None
            for dependency in (
                torch,
                torchaudio,
                SeamlessM4TFeatureExtractor,
                SeamlessM4TTokenizer,
                SeamlessM4Tv2ForSpeechToText,
            )
        )

    def _ensure_model_loaded(self) -> None:
        if self._model is not None and self._processor is not None and self._tokenizer is not None:
            return
        model_source = self.model_source
        self._model = SeamlessM4Tv2ForSpeechToText.from_pretrained(model_source).to(self._device)
        self._processor = SeamlessM4TFeatureExtractor.from_pretrained(model_source)
        self._tokenizer = SeamlessM4TTokenizer.from_pretrained(model_source)

    def _resolve_device(self) -> str:
        configured = (self.settings.speech_device or 'auto').lower()
        if configured == 'auto':
            return 'cuda' if torch is not None and torch.cuda.is_available() else 'cpu'
        if configured == 'cuda' and (torch is None or not torch.cuda.is_available()):
            return 'cpu'
        return configured


def speech_result_to_dict(result: SpeechTranslationResult) -> dict[str, Any]:
    return asdict(result)
