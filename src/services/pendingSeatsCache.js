import { getPendingReservationSeats } from "./apiClient";

const cache = new Map();
const pending = new Map();

function keyFor(reservationId, accessToken) {
  return `${accessToken}:${reservationId}`;
}

export function getCachedPendingSeats(reservationId, accessToken) {
  return cache.get(keyFor(reservationId, accessToken)) ?? null;
}

export function loadPendingSeats(reservationId, accessToken, { force = false } = {}) {
  const key = keyFor(reservationId, accessToken);
  if (!force && cache.has(key)) return Promise.resolve(cache.get(key));
  if (!force && pending.has(key)) return pending.get(key);

  const request = getPendingReservationSeats(reservationId, accessToken)
    .then((result) => {
      cache.set(key, result);
      return result;
    })
    .finally(() => {
      if (pending.get(key) === request) pending.delete(key);
    });
  pending.set(key, request);
  return request;
}

export function invalidatePendingSeats(reservationId) {
  for (const key of cache.keys()) {
    if (key.endsWith(`:${reservationId}`)) cache.delete(key);
  }
}
