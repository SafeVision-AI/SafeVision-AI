"""Provider base classes — shared httpx transport + prompt builder for all LLM providers."""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are SafeVixAI, an AI assistant built for Indian road safety and emergency response. "
    "Help users with: emergency contacts, first aid, pothole/accident reporting, traffic challans, "
    "navigation, and road authority escalation. "
    "Always answer concisely in the SAME language the user writes in (Hindi, Tamil, Telugu, etc.). "
    "For life-threatening situations, always lead with 112 (universal emergency) or 102 (ambulance). "
    "Be factual — cite MV Act sections when answering challan questions."
)

MAX_HISTORY = 10          # messages to include in context window
MAX_RESPONSE_TOKENS = 800

PROHIBITED_PATTERNS = [
    "ignore all previous",
    "ignore previous",
    "disregard",
    "bypass",
    "system prompt",
    "you are now",
    "you are no longer",
    "forget instructions",
    "jailbreak",
    "forget everything",
    "new instructions",
    "hypothetical scenario where you ignore"
]

def check_prompt_injection(message: str) -> bool:
    """Returns True if a prompt injection attack is detected."""
    msg_lower = message.lower()
    return any(pattern in msg_lower for pattern in PROHIBITED_PATTERNS)


@dataclass(slots=True)
class ProviderRequest:
    message: str
    intent: str
    history: list[dict]
    tool_summaries: list[str] = field(default_factory=list)
    document_snippets: list[str] = field(default_factory=list)
    provider_hint: str | None = None


@dataclass(slots=True)
class ProviderResult:
    text: str
    provider: str
    model: str
    provider_used: str | None = None
    detected_lang: str | None = None
    india_badge: bool = False
    fallback_from: str | None = None


def build_messages(request: ProviderRequest) -> list[dict]:
    """Build the OpenAI-compatible messages list from a ProviderRequest."""
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject context block (tool results + RAG snippets) as a system message
    context_parts: list[str] = []
    if request.tool_summaries:
        context_parts.append("## Live Data\n" + "\n".join(f"- {s}" for s in request.tool_summaries[:4]))
    if request.document_snippets:
        context_parts.append("## Reference Knowledge\n" + "\n".join(f"- {s}" for s in request.document_snippets[:4]))
    if context_parts:
        messages.append({"role": "system", "content": "\n\n".join(context_parts)})

    # Conversation history (trim to last N turns)
    for turn in request.history[-(MAX_HISTORY * 2):]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    # Current user message
    messages.append({"role": "user", "content": request.message})
    return messages


class HttpProvider:
    """
    Shared async httpx transport for all OpenAI-compatible providers.
    Subclasses only need to implement: api_key_env(), base_url(), default_model().
    """

    name: str = "http"
    _client: httpx.AsyncClient | None = None

    def api_key_env(self) -> str:
        """Return the env-var name that holds the API key."""
        raise NotImplementedError

    def base_url(self) -> str:
        """Return the chat completions endpoint URL."""
        raise NotImplementedError

    def default_model(self) -> str:
        """Return the default model ID."""
        raise NotImplementedError

    def extra_headers(self) -> dict:
        """Override to add provider-specific headers (e.g., HTTP-Referer)."""
        return {}

    def _get_api_key(self) -> str:
        import os
        key = os.getenv(self.api_key_env(), "").strip()
        if not key:
            raise RuntimeError(
                f"{self.__class__.__name__}: Missing env var '{self.api_key_env()}'"
            )
        return key

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        if check_prompt_injection(request.message):
            logger.warning(f"Prompt injection blocked in HttpProvider. Message: {request.message[:50]}...")
            return ProviderResult(
                text="I cannot fulfill this request. I am SafeVixAI, an AI assistant focused strictly on Indian road safety and emergency response.",
                provider=self.name,
                model="safety-filter"
            )

        import os
        api_key = self._get_api_key()
        model = os.getenv(f"{self.api_key_env().replace('_API_KEY', '_MODEL')}", "").strip() or self.default_model()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            **self.extra_headers(),
        }

        payload = {
            "model": model,
            "messages": build_messages(request),
            "max_tokens": MAX_RESPONSE_TOKENS,
            "temperature": 0.5,
        }

        resp = await self._get_client().post(self.base_url(), headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        text = data["choices"][0]["message"]["content"]
        return ProviderResult(text=text, provider=self.name, model=model)


class TemplateProvider:
    """
    Deterministic fallback — always works, no API key needed.
    Used as the last resort in the fallback chain.
    """

    name = "template"
    model = "deterministic-rag"

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        if check_prompt_injection(request.message):
            logger.warning(f"Prompt injection blocked in TemplateProvider. Message: {request.message[:50]}...")
            return ProviderResult(
                text="I cannot fulfill this request. I am SafeVixAI, an AI assistant focused strictly on Indian road safety and emergency response.",
                provider=self.name,
                model="safety-filter"
            )

        lines: list[str] = []
        if request.intent == "emergency":
            lines.append("🚨 Emergency: Call 112 (universal) or 102 (ambulance) immediately.")
        elif request.intent == "first_aid":
            lines.append("🩹 First-aid guidance:")
        elif request.intent == "challan":
            lines.append("📋 Traffic challan under the Motor Vehicles Act 2019:")
        elif request.intent == "legal":
            lines.append("⚖️ Legal reference (Motor Vehicles Act):")
        elif request.intent == "road_issue":
            lines.append("🛣️ Road issue guidance:")
        elif request.intent == "road_weather":
            lines.append("Road-weather guidance:")
        elif request.intent == "safe_route":
            lines.append("Safe-route guidance:")
        elif request.intent == "road_infrastructure":
            lines.append("Road authority and infrastructure guidance:")

        if request.tool_summaries:
            lines.extend(request.tool_summaries[:3])
        if request.document_snippets:
            lines.append("Relevant references:")
            lines.extend(request.document_snippets[:3])
        if not lines:
            lines.append(
                "I can help with road safety, emergency response, challans, first aid, and nearby authority lookups. "
                "Please share more detail so I can assist you better."
            )
        else:
            lines.append("\nFor life-threatening emergencies, always call 112 immediately.")

        return ProviderResult(text="\n".join(lines), provider=self.name, model=self.model)
