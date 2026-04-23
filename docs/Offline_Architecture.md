# Offline Bundle Architecture Investigation

## Current State (V1 MVP)
Currently, offline metadata (like queued SOS events and cached chat logs) is managed in the browser using IndexedDB. If a user submits a road report photo while offline, the browser caches the multipart form data using service workers (via Workbox background sync). When the connection is restored, the `posthog-js` queue and our custom `offline-sos-queue` flush their payloads to the backend.

The backend is currently hosted on **Render** (FastAPI) and the frontend on **Vercel** (Next.js). When photos are uploaded, they are temporarily saved to Render's local disk space (`/uploads` volume).

## The Problem at Enterprise Scale
1. **Ephemeral Disks**: Render's free/standard instances have ephemeral disks. If the service restarts, locally saved images from offline syncs might be lost.
2. **Distributed Processing**: If we scale the backend to multiple workers, a user might upload an image to Worker A, but a subsequent request to view it might hit Worker B, resulting in a 404.

## Proposed V2 Enterprise Solution
To achieve true enterprise scale and stateless operation, the architecture must transition to an Object Storage solution:

1. **AWS S3 / Supabase Storage**:
   - Instead of the backend handling the raw file upload stream, the frontend will request a **Pre-Signed URL** from the backend.
   - Once online, the frontend will directly upload the photo to the S3 bucket using the Pre-Signed URL.
   - This removes the bandwidth bottleneck from the FastAPI server and ensures files are persisted globally.

2. **Supabase Realtime for Offline Resync**:
   - Use Supabase Realtime/Postgres logical replication to sync offline queues when devices reconnect, rather than custom REST endpoints.
   - This provides out-of-the-box conflict resolution for overlapping offline events.
