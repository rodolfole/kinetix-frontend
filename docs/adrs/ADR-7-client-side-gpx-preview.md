# ADR-7: Client-side GPX preview

- Status: Accepted
- Date: 2026-11-06
- Deciders: Kinetix team
- Related: ADR-3, ADR-5, backend/docs/adrs/ADR-10-gpx-route-parsing-server-side.md

## Context
Organizers attach a GPX file per distance while creating an event. They need immediate feedback (map, distance, elevation gain) before saving. The backend parses and stores routes authoritatively (backend ADR-10), but waiting for an upload round trip makes the form slow and gives no preview.

## Decision
Parse GPX in the browser with `parseGPX` in `src/lib/gpx-parser.ts` (uses `DOMParser`; computes coordinates, Haversine cumulative distance, elevation profile, gain, min/max, route name). `DistanceRoutePreview.tsx` reads the file, calls `parseGPX`, and lazy-renders `RouteMap` (Leaflet) and `ElevationProfile` (Recharts). The preview is advisory; the backend remains the source of truth for stored route data.

## Consequences
### Positive
- Instant preview, no upload until save; invalid files fail early (`No track points found in GPX file`).
- Heavy libraries are lazy chunks, loaded only when a file is chosen.

### Negative / risks
- Two implementations of the same math (client `haversineKm`, server parser) can disagree on distance/gain; there is no shared test fixture.
- Elevation gain sums every positive point-to-point difference, with no smoothing or threshold, so GPS noise inflates it and values may differ from the backend's.
- `DOMParser` is browser-only, so `gpx-parser.ts` cannot run in SSR; its tests need happy-dom.
- `gpx-parser.ts` has no test file of its own (`DistanceRoutePreview.test.tsx` feeds it GPX fixtures) and is untracked in git at the time of writing.
- Missing `lat`/`lon`/`ele` values silently become `0` (`parseFloat(... || '0')`), producing bogus points instead of an error.
- Large GPX files are parsed on the main thread.
- `DistanceRoutePreview` is mounted manually (see ADR-3).

## Alternatives considered
- **Server-only parsing with an upload-then-preview step**: single source of truth but slower UX; kept as the authoritative path.
- **`@tmcw/togeojson` or similar library**: less code to maintain; not adopted yet, candidate to replace the hand-written parser.
- **Web Worker parsing**: worthwhile only if large files become common.
