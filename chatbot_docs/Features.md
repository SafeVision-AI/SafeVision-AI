# RoadSoS Chatbot - Key Features

The RoadSoS AI chatbot provides a robust set of features categorized by module: RoadSoS, DriveLegal, and RoadWatch.

## Emergency Response (RoadSoS)
- **Service Locator**: Finds the nearest hospital, police station, or ambulance center in real-time.
- **SOS Creation**: Generates WhatsApp emergency messages with GPS coordinates and nearby contacts.
- **First Aid Guidance**: Provides step-by-step, WHO-based instructions for accidents and injuries.
- **Bystander Assistance Mode**: Voice-guided support for first responders to manage trauma before professional help arrives.

## Traffic Law Legal Info (DriveLegal)
- **Legal Q&A**: Answers queries on the Motor Vehicles Act (1988, 2019) with exact section citations.
- **Challan Calculator**: Deterministic calculation of traffic fines based on violation code, vehicle type, and state.
- **Geo-fencing**: Automatically applies state-specific fine variations based on the user's GPS location.

## Infrastructure Insights (RoadWatch)
- **Contractor Accountability**: Displays contractor info, budget data, and last maintenance details for a road segment.
- **Issue Submission**: Guides users through reporting potholes or infrastructure failures to the correct authority.
- **Proactive Hazard Alerts**: Warns users of nearby community-reported issues via WebSocket push notifications.

## Core Interaction Features
- **Voice I/O**: Support for voice input and automatic response read-out in emergency scenarios.
- **Multilingual Support**: Interaction in English, Hindi, Tamil, and other regional languages.
- **Offline RAG**: A browser-native fallback for first-aid information when internet connectivity is lost.
