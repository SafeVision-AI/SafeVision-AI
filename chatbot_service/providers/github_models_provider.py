from providers.base import TemplateProvider


class GitHubModelsProvider(TemplateProvider):
    name = 'github-models-template'
    model = 'github-models-fallback'
