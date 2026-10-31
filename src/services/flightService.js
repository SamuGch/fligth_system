const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const DEFAULT_SEAT_TYPE_ID = 2;

function buildApiUrl(endpoint) {
  const normalizedEndpoint = endpoint.startsWith("/api/")
    ? endpoint.slice(4)
    : endpoint;
  const apiPrefix = API_URL.endsWith("/api") ? "" : "/api";

  return `${API_URL}${apiPrefix}${normalizedEndpoint}`;
}

async function post(endpoint, payload) {
  const response = await fetch(buildApiUrl(endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error consultando ${endpoint}: ${response.status}`);
  }

  return response.json();
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthYear(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("El mes de disponibilidad no es válido.");
    }

    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }

  const monthYear = String(value).trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthYear)) {
    throw new Error("El mes de disponibilidad debe tener el formato YYYY-MM.");
  }

  return monthYear;
}

function getArrayResponse(response, endpoint) {
  const data = Array.isArray(response) ? response : response?.data;

  if (!Array.isArray(data)) {
    throw new Error(`Respuesta inesperada de ${endpoint}`);
  }
  return data;
}

async function enrichFlight(flight) {
  const flightId =
    flight?.vueloId ??
    flight?.vuelo_id ??
    flight?.segments?.[0]?.vueloId ??
    flight?.segments?.[0]?.vuelo_id ??
    (Number.isInteger(Number(flight?.id)) ? flight.id : null);
  if (!flightId) return flight;

  try {
    const response = await fetch(buildApiUrl(`/vuelo/${flightId}`));
    if (!response.ok) {
      throw new Error(`Error consultando /vuelo/${flightId}: ${response.status}`);
    }
    const payload = await response.json();
    const details = payload?.data ?? payload;
    const segments = Array.isArray(flight.segments)
      ? await Promise.all(flight.segments.map(enrichFlight))
      : flight.segments;
    return { ...flight, ...details, ...(segments ? { segments } : {}) };
  } catch (error) {
    console.warn("No se pudo completar la información del vuelo.", error);
    return flight;
  }
}

async function enrichFlightResults(response) {
  const result = response?.data ?? response;
  if (!result || typeof result !== "object") return response;

  const enrichList = (flights) =>
    Array.isArray(flights) ? Promise.all(flights.map(enrichFlight)) : flights;
  const enriched = { ...result };
  if (result.outbound) {
    enriched.outbound = {
      ...result.outbound,
      flights: await enrichList(result.outbound.flights),
    };
  }

  if (result.inbound) {
    enriched.inbound = {
      ...result.inbound,
      flights: await enrichList(result.inbound.flights),
    };
  }
  if (Array.isArray(result.flights)) enriched.flights = await enrichList(result.flights);
  return response?.data ? { ...response, data: enriched } : enriched;
}

export async function obtenerDetalleVuelo(flightId) {
  const normalizedId = Number(flightId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) return null;
  const response = await fetch(buildApiUrl(`/vuelo/${normalizedId}`));
  if (!response.ok) {
    throw new Error(`Error consultando /vuelo/${normalizedId}: ${response.status}`);
  }
  const payload = await response.json();
  return payload?.data ?? payload;
}

export async function obtenerFechasDisponibles(
  origenId,
  destinoId,
  { totalPassengers = 1, seatTypeId, mesAnio = currentMonth() } = {}
) {
  const normalizedOrigenId = Number(origenId);
  const normalizedDestinoId = Number(destinoId);

  if (
    !Number.isInteger(normalizedOrigenId) ||
    normalizedOrigenId <= 0 ||
    !Number.isInteger(normalizedDestinoId) ||
    normalizedDestinoId <= 0
  ) {
    throw new Error("El origen y el destino deben ser válidos.");
  }

  if (normalizedOrigenId === normalizedDestinoId) {
    throw new Error("El origen y el destino deben ser diferentes.");
  }

  const response = await post("/api/vuelo/disponibilidad-calendario", {
    OrigenID: normalizedOrigenId,
    DestinationID: normalizedDestinoId,
    totalPassengers: Number(totalPassengers),
    seatTypeId:
      Number(seatTypeId) > 0 ? Number(seatTypeId) : DEFAULT_SEAT_TYPE_ID,
    mesAnio: formatMonthYear(mesAnio),
  });

  return getArrayResponse(response, "/vuelo/disponibilidad-calendario");
}

export async function buscarVuelos({
  OrigenID,
  DestinationID,
  totalPassengers,
  seatTypeId,
  departureDate,
}) {
  const response = await post("/vuelo/buscar", {
    OrigenID,
    DestinationID,
    totalPassengers,
    seatTypeId,
    departureDate,
  });
  return enrichFlightResults(response);
}
