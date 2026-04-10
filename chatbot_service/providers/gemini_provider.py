from providers.base import TemplateProvider


class GeminiProvider(TemplateProvider):
    name = 'gemini-template'
    model = 'gemini-fallback'
