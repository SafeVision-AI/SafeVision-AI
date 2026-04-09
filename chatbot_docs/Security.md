# Security and Safety - RoadSoS Chatbot

Since the RoadSoS Chatbot operates in emergency and legal contexts, security and safety are non-negotiable.

## Safety Check Nodes
The agentic graph in LangGraph includes a mandatory safety check node:
- **Criteria**: If a response is for an emergency query (injury, accident, trauma), this node validates the content.
- **Rule**: It ensures that at least one emergency number (like 112) and a nearby hospital's contact information are included in the assistant text.
- **Action**: If a response fails this check, it's flagged and a retry is initiated with a different provider.

## LLM Provider Security
- **API Keys**: All keys are stored in environment variables, never in code or committed to Git.
- **Fallback Logic**: Redundant providers ensure that downtime on one platform doesn't affect the user.
- **Rate Limiting**: Users are capped at 30 messages per session per hour to prevent abuse while ensuring availability for legitimate emergencies.

## Data Privacy
- **Anonymous Sessions**: Usage is tracked by session ID, reducing the need for persistent personal data storage.
- **PII Protection**: User-reported incidents are anonymized before being shared with the broader community through road hazards.
- **Context Handling**: GPS coordinates are used for real-time localization but are not stored in the long-term knowledge base.

## Content Filtering
- **Factual Reliance**: The RAG pipeline ensures that legal and medical responses are grounded in verified sources (Motor Vehicles Act and WHO guidelines) rather than model hallucinations.
- **Fallbacks**: If the retriever confidence is low, the chatbot is instructed to refer the user to official sources like 112 and 1033.
