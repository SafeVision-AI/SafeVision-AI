from __future__ import annotations

from fastapi.testclient import TestClient


def test_challan_calculator_uses_built_in_defaults(app):
    with TestClient(app) as client:
        response = client.post(
            '/api/v1/challan/calculate',
            json={
                'violation_code': '185',
                'vehicle_class': 'car',
                'state_code': 'TN',
                'is_repeat': False,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload['section'] == 'Section 185'
    assert payload['base_fine'] == 10000
    assert payload['repeat_fine'] == 15000
    assert payload['amount_due'] == 10000


def test_challan_calculator_normalizes_inputs_and_repeat_amount(app):
    with TestClient(app) as client:
        response = client.post(
            '/api/v1/challan/calculate',
            json={
                'violation_code': '112/183',
                'vehicle_class': 'Truck',
                'state_code': 'Tamil Nadu (TN)',
                'is_repeat': True,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload['vehicle_class'] == 'heavy_vehicle'
    assert payload['state_code'] == 'TN'
    assert payload['amount_due'] == 8000


def test_challan_calculator_rejects_unknown_violation_codes(app):
    with TestClient(app) as client:
        response = client.post(
            '/api/v1/challan/calculate',
            json={
                'violation_code': 'XYZ',
                'vehicle_class': 'car',
                'state_code': 'TN',
                'is_repeat': False,
            },
        )

    assert response.status_code == 422
    assert 'Unsupported violation code' in response.json()['detail']
