import { getMyTrips } from "./apiClient";

let cachedToken = null;
let cachedTrips = null;
let pendingToken = null;
let pendingRequest = null;
let cacheVersion = 0;

function normalizeTrips(payload) {
  return Array.isArray(payload) ? payload : [];
}

export function getCachedTrips(accessToken) {
  if (!accessToken || cachedToken !== accessToken) return null;
  return cachedTrips;
}

export function loadTrips(accessToken, { force = false } = {}) {
  if (!accessToken) return Promise.resolve([]);

  if (!force) {
    const cached = getCachedTrips(accessToken);
    if (cached) return Promise.resolve(cached);
    if (pendingRequest && pendingToken === accessToken) return pendingRequest;
  }

  if (
    force ||
    (cachedToken && cachedToken !== accessToken) ||
    (pendingToken && pendingToken !== accessToken)
  ) {
    cacheVersion += 1;
  }

  const requestToken = accessToken;
  const requestVersion = cacheVersion;
  const request = getMyTrips()
    .then((payload) => {
      const trips = normalizeTrips(payload);
      if (requestVersion === cacheVersion) {
        cachedToken = requestToken;
        cachedTrips = trips;
      }
      return trips;
    })
    .finally(() => {
      if (pendingRequest === request) {
        pendingRequest = null;
        pendingToken = null;
      }
    });

  pendingToken = requestToken;
  pendingRequest = request;
  return request;
}

export function invalidateTripsCache() {
  cacheVersion += 1;
  cachedToken = null;
  cachedTrips = null;
}
