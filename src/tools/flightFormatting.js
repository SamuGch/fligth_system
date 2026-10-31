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
  const originFromSegment = {
    codigo_iata: firstValue(
      flight.origen_codigo_iata,
      flight.origenCodigoIata,
      flight.OrigenCodigoIATA,
    ),
    codigo_icao: firstValue(
      flight.origen_codigo_icao,
      flight.origenCodigoIcao,
      flight.OrigenCodigoICAO,
    ),
    ciudad: firstValue(flight.origen_ciudad, flight.origenCiudad, flight.OrigenCiudad),
    nombre: firstValue(flight.origen_nombre, flight.origenNombre, flight.OrigenNombre),
  };
  const destinationFromSegment = {
    codigo_iata: firstValue(
      flight.destino_codigo_iata,
      flight.destinoCodigoIata,
      flight.DestinoCodigoIATA,
    ),
    codigo_icao: firstValue(
      flight.destino_codigo_icao,
      flight.destinoCodigoIcao,
      flight.DestinoCodigoICAO,
    ),
    ciudad: firstValue(flight.destino_ciudad, flight.destinoCiudad, flight.DestinoCiudad),
    nombre: firstValue(flight.destino_nombre, flight.destinoNombre, flight.DestinoNombre),
  };
  const origin = normalizeAirport(
    firstValue(
      originFromSegment.codigo_iata,
      originFromSegment.codigo_icao,
      originFromSegment.ciudad,
      originFromSegment.nombre,
    )
      ? originFromSegment
      : flight.origen ??
          source.origen ??
          source.originAirport ??
          source.origin_airport ??
          route.aeropuerto_origen ??
          route.origin,
  );
  const destination = normalizeAirport(
    firstValue(
      destinationFromSegment.codigo_iata,
      destinationFromSegment.codigo_icao,
      destinationFromSegment.ciudad,
      destinationFromSegment.nombre,
    )
      ? destinationFromSegment
      : flight.destino ??
          source.destino ??
          source.destinationAirport ??
          source.destination_airport ??
          route.aeropuerto_destino ??
          route.destination,
  );
  const airlineFromSegment = {
    codigo_iata: firstValue(
      flight.aerolinea_codigo_iata,
      flight.aerolineaCodigoIata,
      flight.AerolineaCodigoIATA,
    ),
    nombre: firstValue(
      flight.aerolinea_nombre,
      flight.aerolineaNombre,
      flight.AerolineaNombre,
    ),
  };
  const airline = firstValue(airlineFromSegment.codigo_iata, airlineFromSegment.nombre)
    ? airlineFromSegment
    : flight.aerolinea ??
        source.aerolinea ??
        source.airlineDetails ??
        source.airline_data ??
        source.avion?.aerolinea;
  const gate =
    flight.puerta_embarque ??
    flight.puertaEmbarque ??
    flight.PuertaEmbarque ??
    source.puerta_embarque ??
    source.puertaEmbarque ??
    source.boardingGate;
  const terminal =
    gate?.terminal ??
    flight.terminal ??
    flight.Terminal ??
    source.terminal ??
    source.Terminal;

  return {
    number: firstValue(
      flight.numero_vuelo,
      flight.numeroVuelo,
      flight.NumeroVuelo,
      flight.flightNumber,
      source.numero_vuelo,
      source.numeroVuelo,
      source.NumeroVuelo,
    ),
    airline: typeof airline === "string" ? airline : airline?.nombre ?? firstValue(flight.airline, source.airline, flight.airlineName, source.airlineName),
    airlineCode: typeof airline === "object" ? firstValue(airline.codigo_iata, airline.codigoIata, airline.CodigoIATA) : undefined,
    origin,
    destination,
    departure: firstValue(
      flight.fecha_salida,
      flight.fechaSalida,
      flight.FechaSalida,
      flight.hora_salida,
      flight.horaSalida,
      flight.HoraSalida,
      flight.departure,
      flight.departureTime,
      source.fecha_salida,
      source.fechaSalida,
      source.FechaSalida,
      source.hora_salida,
      source.horaSalida,
      source.HoraSalida,
    ),
    arrival: firstValue(
      flight.fecha_llegada,
      flight.fechaLlegada,
      flight.FechaLlegada,
      flight.hora_llegada,
      flight.horaLlegada,
      flight.HoraLlegada,
      flight.arrival,
      flight.arrivalTime,
      source.fecha_llegada,
      source.fechaLlegada,
      source.FechaLlegada,
      source.hora_llegada,
      source.horaLlegada,
      source.HoraLlegada,
    ),
    gate: gate?.numero ?? gate?.number ?? gate?.Numero ?? firstValue(flight.puerta, flight.Puerta, source.puerta, source.Puerta, flight.gate),
    terminal: terminal?.nombre ?? terminal?.name ?? terminal?.Nombre ?? firstValue(flight.terminalNombre, flight.TerminalNombre, source.terminalNombre, source.TerminalNombre),
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
