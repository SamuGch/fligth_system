function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeAirport(airport) {
  if (!airport) return {};
  return {
    ...airport,
    codigo_iata: firstValue(airport.codigo_iata, airport.codigoIata, airport.iata),
    codigo_icao: firstValue(airport.codigo_icao, airport.codigoIcao, airport.icao),
    ciudad: firstValue(airport.ciudad, airport.city),
    nombre: firstValue(airport.nombre, airport.name),
  };
}

export function getFlightMetadata(flight = {}) {
  const source = flight.detalle_vuelo ?? flight.detalleVuelo ?? flight;
  const route = source.ruta ?? source.route ?? {};
  const origin = normalizeAirport(
    flight.origen ?? source.origen ?? source.originAirport ?? source.origin_airport ?? route.aeropuerto_origen ?? route.origin,
  );
  const destination = normalizeAirport(
    flight.destino ?? source.destino ?? source.destinationAirport ?? source.destination_airport ?? route.aeropuerto_destino ?? route.destination,
  );
  const airline = flight.aerolinea ?? source.aerolinea ?? source.airlineDetails ?? source.airline_data ?? source.avion?.aerolinea;
  const gate = flight.puerta_embarque ?? source.puerta_embarque ?? source.puertaEmbarque ?? source.boardingGate;
  const terminal = gate?.terminal ?? flight.terminal ?? source.terminal;

  return {
    number: firstValue(flight.numero_vuelo, flight.numeroVuelo, flight.flightNumber, source.numero_vuelo, source.numeroVuelo),
    airline: typeof airline === "string" ? airline : airline?.nombre ?? firstValue(flight.airline, source.airline, flight.airlineName, source.airlineName),
    airlineCode: typeof airline === "object" ? firstValue(airline.codigo_iata, airline.codigoIata) : undefined,
    origin,
    destination,
    departure: firstValue(flight.fecha_salida, flight.fechaSalida, flight.hora_salida, flight.departure, flight.departureTime, source.fecha_salida, source.fechaSalida, source.hora_salida),
    arrival: firstValue(flight.fecha_llegada, flight.fechaLlegada, flight.hora_llegada, flight.arrival, flight.arrivalTime, source.fecha_llegada, source.fechaLlegada, source.hora_llegada),
    gate: gate?.numero ?? gate?.number ?? firstValue(flight.puerta, source.puerta, flight.gate),
    terminal: terminal?.nombre ?? terminal?.name ?? firstValue(flight.terminalNombre, source.terminalNombre),
    aircraft: flight.avion?.nombre ?? source.avion?.nombre ?? flight.aircraft?.name ?? source.aircraft?.name ?? flight.aircraftName,
    status: firstValue(flight.estado, source.estado, flight.status),
  };
}

export function formatFlightOperator(flight) {
  const metadata = getFlightMetadata(flight);
  return [metadata.airlineCode, metadata.airline].filter(Boolean).join(" · ") || "Aerolínea no informada";
}

export function formatAirportName(airport, fallback = "Aeropuerto no informado") {
  const normalized = normalizeAirport(airport);
  return normalized.nombre || normalized.ciudad || fallback;
}

export function formatFlightLocation(airport, fallback = "---") {
  const normalized = normalizeAirport(airport);
  return {
    code: normalized.codigo_iata || fallback,
    name: formatAirportName(normalized),
  };
}
