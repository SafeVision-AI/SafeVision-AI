from providers.base import TemplateProvider


class MistralProvider(TemplateProvider):
    name = 'mistral-template'
    model = 'mistral-fallback'
