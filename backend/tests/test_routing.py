from __future__ import annotations

from fastapi.testclient import TestClient

from models.schemas import RouteBounds, RouteInstruction, RouteOption, RoutePoint, RoutePreviewResponse


class FakeRoutingService:
    async def preview_route(self, **kwargs) -> RoutePreviewResponse:
        primary_path = [
            RoutePoint(lat=13.0827, lon=80.2707, label='Current location'),
            RoutePoint(lat=13.0475, lon=80.2202, label='Destination'),
        ]
        return RoutePreviewResponse(
            provider='osrm',
            profile='driving-car',
            distance_meters=4250.0,
            duration_seconds=540.0,
            path=primary_path,
            bounds=RouteBounds(
                south=13.0475,
                west=80.2202,
                north=13.0827,
                east=80.2707,
            ),
            origin=RoutePoint(lat=13.0827, lon=80.2707, label='Current location'),
            destination=RoutePoint(lat=13.0475, lon=80.2202, label='Destination'),
            steps=[
                RouteInstruction(
                    index=1,
                    instruction='Head south-west on Anna Salai',
                    distance_meters=900.0,
                    duration_seconds=120.0,
                    street_name='Anna Salai',
                    instruction_type=11,
                )
            ],
            routes=[
                RouteOption(
                    route_id='route-1',
                    label='Primary route',
                    distance_meters=4250.0,
                    duration_seconds=540.0,
                    path=primary_path,
                    bounds=RouteBounds(
                        south=13.0475,
                        west=80.2202,
                        north=13.0827,
                        east=80.2707,
                    ),
                    steps=[
                        RouteInstruction(
                            index=1,
                            instruction='Head south-west on Anna Salai',
                            distance_meters=900.0,
                            duration_seconds=120.0,
                            street_name='Anna Salai',
                            instruction_type=11,
                        )
                    ],
                )
            ],
            selected_route_id='route-1',
        )


def test_routing_preview_endpoint(app):
    with TestClient(app) as client:
        client.app.state.routing_service = FakeRoutingService()
        response = client.get(
            '/api/v1/routing/preview'
            '?origin_lat=13.0827&origin_lon=80.2707'
            '&destination_lat=13.0475&destination_lon=80.2202'
            '&profile=driving-car'
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload['provider'] == 'osrm'
    assert payload['distance_meters'] == 4250.0
    assert len(payload['path']) == 2
    assert payload['selected_route_id'] == 'route-1'
    assert payload['routes'][0]['steps'][0]['instruction'] == 'Head south-west on Anna Salai'


def test_routing_preview_rejects_invalid_profile(app):
    with TestClient(app) as client:
        client.app.state.routing_service = FakeRoutingService()
        response = client.get(
            '/api/v1/routing/preview'
            '?origin_lat=13.0827&origin_lon=80.2707'
            '&destination_lat=13.0475&destination_lon=80.2202'
            '&profile=driving-rocket'
        )

    assert response.status_code == 422
