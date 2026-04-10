from providers.base import TemplateProvider


class GroqProvider(TemplateProvider):
    name = 'groq-template'
    model = 'groq-fallback'
