# Data Sources Reference

The RoadSoS Chatbot relies on high-quality, authoritative data for legal, emergency, and medical accuracy.

## Legal Data
- **Motor Vehicles Act 1988**: Full text, all 217 sections indexed for the RAG pipeline.
- **Motor Vehicles Amendment Act 2019**: Complete gazette notification included.
- **State-specific Amendments**: PDFs indexed for state-level geo-fenced fine queries.
- **MoRTH**: Monitored monthly for updated traffic regulation notifications.

## Medical Data (First Aid)
- **WHO Trauma Care Guidelines**: Official first-aid procedures for emergency response.
- **Static Knowledge base**: `first_aid.json` containing 20 pre-bundled articles for offline RAG capability.

## Geographic and Infrastructure Data
- **OpenStreetMap (OSM)**: Primary source for initial emergency service locations.
- **PostGIS (Managed)**: Private database of verified hospitals, police stations, and ambulance centers.
- **RoadWatch Community Reports**: Real-time crowd-sourced data for potholes and hazards.
- **Government Portals**: PMGSY, NHAI project data for contractor and budget details.

## Real-Time Data Injection
On every message, context is enriched with:
- **GPS Coordinates**: User's current location (lat, lon).
- **Reverse Geocoding**: City and state name for local regulation lookup.
- **Road Condition Events**: Recent incidents within a 5km radius of the user.
