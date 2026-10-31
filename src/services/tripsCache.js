import { getMyTrips } from "./apiClient";
import { obtenerDetalleVuelo } from "./flightService";

let cachedToken = null;
let cachedTrips = null;
let pendingToken = null;
let pendingRequest = null;
let cacheVersion = 0;

function normalizeTrips(payload) {
  return Array.isArray(payload) ? payload : [];
}

async function enrichTrips(trips) {
  return Promise.all(
    trips.map(async (trip) => {
      const tramos = await Promise.all(
        (trip.tramos || []).map(async (segment) => {
          const flightId = segment.vuelo_id ?? segment.vueloId ?? segment.id;
          if (!flightId || segment.detalle_vuelo) return segment;
          try {
            return {
              ...segment,
              detalle_vuelo: await obtenerDetalleVuelo(flightId),
            };
          } catch (error) {
            console.warn("No se pudo completar la información del tramo.", error);
            return segment;
          }
        }),
      );
      return { ...trip, tramos };
    }),
  );
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
    .then(async (payload) => {
      const trips = await enrichTrips(normalizeTrips(payload));
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
