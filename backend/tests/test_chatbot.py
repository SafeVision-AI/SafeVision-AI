from __future__ import annotations

from fastapi.testclient import TestClient


class FakeChatService:
    async def send_message(self, payload):
        return {
            'response': f'Handled: {payload.message}',
            'intent': 'test',
            'sources': ['unit:test'],
            'session_id': payload.session_id or 'generated-session',
        }


def test_chat_endpoint_returns_backend_chat_payload(app):
    with TestClient(app) as client:
        client.app.state.llm_service = FakeChatService()
        response = client.post(
            '/api/v1/chat/',
            json={
                'message': 'What is Section 185?',
                'session_id': 'session-123',
            },
            headers={'Authorization': 'Bearer mock-jwt-token-for-hackathon'},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload['response'] == 'Handled: What is Section 185?'
    assert payload['intent'] == 'test'
    assert payload['sources'] == ['unit:test']
    assert payload['session_id'] == 'session-123'
