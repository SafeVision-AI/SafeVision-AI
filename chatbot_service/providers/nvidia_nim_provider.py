"""NVIDIA NIM provider — GPU-optimized inference via NVIDIA cloud.
Free tier: 1,000 API credits on sign-up. Sign up: build.nvidia.com
Env vars: NVIDIA_NIM_API_KEY, NVIDIA_NIM_MODEL (optional)
"""
from __future__ import annotations

from providers.base import HttpProvider


class NvidiaNimProvider(HttpProvider):
    """NVIDIA NIM — runs Llama 3.1 on NVIDIA A100 GPUs."""

    name = "nvidia"

    def api_key_env(self) -> str:
        return "NVIDIA_NIM_API_KEY"

    def base_url(self) -> str:
        return "https://integrate.api.nvidia.com/v1/chat/completions"

    def default_model(self) -> str:
        return "meta/llama-3.1-8b-instruct"

    def extra_headers(self) -> dict:
        return {"User-Agent": "SafeVixAI/1.0"}
