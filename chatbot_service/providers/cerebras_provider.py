from providers.base import TemplateProvider


class CerebrasProvider(TemplateProvider):
    """Cerebras Cloud — llama-3.3-70b at 2000+ tok/s. Fastest LLM on earth.
    Free tier: 1M tokens/day, 30 RPM. Sign up: cloud.cerebras.ai
    """

    BASE_URL = "https://api.cerebras.ai/v1/chat/completions"

    def api_key_setting(self) -> str:
        return "cerebras_api_key"

    def model_setting(self) -> str:
        return "cerebras_model"

    def default_model(self) -> str:
        return "llama-3.3-70b"

    def build_headers(self, api_key: str) -> dict:
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def build_url(self) -> str:
        return self.BASE_URL
