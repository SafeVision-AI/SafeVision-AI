from providers.base import TemplateProvider


class OpenRouterProvider(TemplateProvider):
    """OpenRouter — gateway to 20+ models with one API key.
    Free tier: 50 req/day, $10 gives 1K req. Sign up: openrouter.ai
    Automatically selects the best free model available.
    """

    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

    def api_key_setting(self) -> str:
        return "openrouter_api_key"

    def model_setting(self) -> str:
        return "openrouter_model"

    def default_model(self) -> str:
        return "meta-llama/llama-3.1-70b-instruct:free"

    def build_headers(self, api_key: str) -> dict:
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/SafeVision-AI/SafeVision-AI",
            "X-Title": "RoadSoS",
        }

    def build_url(self) -> str:
        return self.BASE_URL
