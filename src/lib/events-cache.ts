// ── Shared in-memory cache for GET /api/events ─────────────────────────────
// Reduces Turso queries during traffic spikes on the PUBLIC site.
// Mutations (POST /api/events, PUT/DELETE /api/admin/events/[id]) MUST call
// invalidateEventsCache() so the admin panel never sees stale data.
//
// NOTE: this lives per serverless instance; the CDN layer (s-maxage) is the
// first cache. Admin consumers use GET /api/events?fresh=1 which bypasses
// BOTH caches (distinct URL -> distinct edge key + no-store response).

const CACHE_TTL_MS = 15_000;

let eventsCache: { data: string; timestamp: number } | null = null;

export function getEventsCache(): { data: string; timestamp: number } | null {
  return eventsCache;
}

export function setEventsCache(data: string, timestamp: number): void {
  eventsCache = { data, timestamp };
}

export function invalidateEventsCache(): void {
  eventsCache = null;
}

export function isEventsCacheFresh(now: number = Date.now()): boolean {
  return eventsCache !== null && now - eventsCache.timestamp < CACHE_TTL_MS;
}
