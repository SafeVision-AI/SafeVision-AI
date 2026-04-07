from __future__ import annotations

from fastapi.testclient import TestClient


class FakeGeocodingService:
    async def reverse(self, *, lat: float, lon: float):
        return {
            'display_name': 'Chennai, Tamil Nadu, India',
            'city': 'Chennai',
            'state': 'Tamil Nadu',
            'state_code': 'TN',
            'country_code': 'IN',
            'postcode': '600001',
            'lat': lat,
            'lon': lon,
        }

    async def search(self, query: str):
        return [
            {
                'display_name': 'Chennai, Tamil Nadu, India',
                'city': 'Chennai',
                'state': 'Tamil Nadu',
                'state_code': 'TN',
                'country_code': 'IN',
                'postcode': '600001',
                'lat': 13.0827,
                'lon': 80.2707,
            }
        ]


def test_reverse_geocode_endpoint(app):
    with TestClient(app) as client:
        client.app.state.geocoding_service = FakeGeocodingService()
        response = client.get('/api/v1/geocode/reverse?lat=13.0827&lon=80.2707')

    assert response.status_code == 200
    payload = response.json()
    assert payload['city'] == 'Chennai'
    assert payload['state_code'] == 'TN'


def test_search_geocode_endpoint(app):
    with TestClient(app) as client:
        client.app.state.geocoding_service = FakeGeocodingService()
        response = client.get('/api/v1/geocode/search?q=Chennai')

    assert response.status_code == 200
    payload = response.json()
    assert len(payload['results']) == 1
    assert payload['results'][0]['display_name'].startswith('Chennai')
