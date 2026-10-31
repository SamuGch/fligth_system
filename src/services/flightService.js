{/*
import { mockFlights } from "../data/mockFlights";

export function searchFlights({
  origin,
  destination,
  departureDate,
  returnDate,
  tripType,
  passengers,
  seatClass,
}) {
  const findFlights = (from, to, date) => {
    return mockFlights.filter((flight) => {
      const seats = flight.seats[seatClass];

      return (
        flight.origin === from &&
        flight.destination === to &&
        flight.departureDate === date &&
        seats !== undefined &&
        seats.available >= passengers
      );
    });
  };

  return {
    outbound: findFlights(origin, destination, departureDate),
    inbound:
      tripType === "round"
        ? findFlights(destination, origin, returnDate)
        : [],
  };
}
*/}


const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function obtenerDatos(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Error consultando ${endpoint}: ${response.status}`);
  }

  const responseData = await response.json();
  const data = Array.isArray(responseData)
    ? responseData
    : responseData?.data;

  if (!Array.isArray(data)) {
    throw new Error(`Respuesta inesperada de ${endpoint}`);
  }

  return data;
}

function horaLocal(fecha) {
  return new Date(fecha).toLocaleTimeString("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Guatemala",
  });
}

function fechaLocal(fecha) {
  return new Date(fecha).toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getSeatTypeId(seat) {
  return seat.tipoAsientoId ??
    seat.tipo_asiento_id ??
    seat.tipoAsiento?.id ??
    seat.tipo_asiento?.id;
}

function getSeatTypeName(seat) {
  return String(
    seat.tipoAsiento?.nombre ??
      seat.tipo_asiento?.nombre ??
      seat.tipoAsiento ??
      seat.clase ??
      ""
  )
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getNumericPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function normalizeClassName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isAvailableSeat(seat) {
  const status = String(seat.estado ?? "").toUpperCase();
  return (
    (seat.disponible ??
      (seat.activo === true || status === "DISPONIBLE")) === true &&
    !["OCUPADO", "CONFIRMADO", "RESERVADO", "BLOQUEADO"].includes(status)
  );
}

function getNestedFlightPrice(flight, requestedTypeId, seatClassName) {
  const fares = flight.precios ?? flight.tarifas ?? flight.fares;
  const fareList = Array.isArray(fares)
    ? fares
    : fares && typeof fares === "object"
      ? Object.values(fares)
      : [];
  const normalizedClassName = String(seatClassName ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const selectedFare = fareList.find(
    (fare) =>
      (requestedTypeId != null &&
        Number(fare.tipoAsientoId ?? fare.seatTypeId) ===
          Number(requestedTypeId)) ||
      String(fare.tipoAsiento ?? fare.seatType ?? fare.clase ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() === normalizedClassName
  );

  if (fareList.length > 0 && !selectedFare) return null;

  return getNumericPrice(
    selectedFare?.precio ??
      selectedFare?.price ??
      selectedFare?.valor ??
      flight.precio_base ??
      flight.tarifa_base ??
      flight.precioBase ??
      flight.precio ??
      flight.price ??
      flight.tarifa
  );
}

export async function obtenerFechasDisponibles(
  origenId,
  destinoId,
  { totalPassengers = 1, passengerDetails, seatTypeId, seatClassName } = {}
) {
  const [vuelos, rutas, tipos] = await Promise.all([
    obtenerDatos("/vuelo"),
    obtenerDatos("/ruta"),
    obtenerDatos("/tipo-asiento"),
  ]);

  const rutasActivas = rutas.filter((ruta) => ruta.activa !== false);
  const requestedPassengers = passengerDetails
    ? Object.values(passengerDetails).reduce(
        (total, count) => total + Number(count || 0),
        0
      )
    : Number(totalPassengers);
  const selectedType = tipos.find(
    (tipo) =>
      (seatTypeId != null && Number(tipo.id) === Number(seatTypeId)) ||
      (seatClassName &&
        normalizeClassName(tipo.nombre ?? tipo.name ?? tipo.descripcion) ===
          normalizeClassName(seatClassName))
  );
  const requestedTypeId = selectedType?.id ?? seatTypeId;
  const selectedClassName = normalizeClassName(
    selectedType?.nombre ?? selectedType?.name ?? selectedType?.descripcion
  );

  const evaluateFlightAvailability = async (vuelo) => {
    console.log("Vuelo evaluado:", vuelo);
    let seats = vuelo.asientos;
    try {
      if (!Array.isArray(seats)) {
        seats = await obtenerDatos(`/vuelo/${vuelo.id}/asientos`);
      }
    } catch {
      return null;
    }

    if (!Array.isArray(seats)) return null;

    const selectedSeats = seats.filter((seat) => {
        const typeMatches =
          requestedTypeId != null &&
          Number(getSeatTypeId(seat)) === Number(requestedTypeId);
        const nameMatches =
          selectedClassName &&
          normalizeClassName(getSeatTypeName(seat)) === selectedClassName;
        return (typeMatches || nameMatches) && isAvailableSeat(seat);
      });

    if (selectedSeats.length < requestedPassengers) return null;

    const seatPrices = selectedSeats
      .map((seat) => getNumericPrice(seat.precio ?? seat.price))
      .filter((price) => price != null);
    const price =
      seatPrices.length > 0
        ? Math.min(...seatPrices)
        : getNestedFlightPrice(vuelo, requestedTypeId, seatClassName);

    if (price == null) {
      return null;
    }

    return { departureDate: fechaLocal(vuelo.fechaSalida), price };
  };

  const getDatesForRoute = async (from, to) => {
    const routeIds = new Set(
      rutasActivas
        .filter(
          (ruta) =>
            Number(ruta.aeropuertoOrigenId) === Number(from) &&
            Number(ruta.aeropuertoDestinoId) === Number(to)
        )
        .map((ruta) => Number(ruta.id))
    );

    const candidateFlights = vuelos
      .filter(
        (vuelo) =>
          routeIds.has(Number(vuelo.rutaId)) &&
          vuelo.estado === "PROGRAMADO"
      )
    const evaluatedFlights = await Promise.all(
      candidateFlights.map(evaluateFlightAvailability)
    );

    const datesByDay = new Map();
    evaluatedFlights.filter(Boolean).forEach((option) => {
      if (!option.departureDate) return;
      const current = datesByDay.get(option.departureDate);
      if (!current || (current.price == null && option.price != null)) {
        datesByDay.set(option.departureDate, option);
      }
    });

    return [...datesByDay.values()].sort((a, b) =>
      a.departureDate.localeCompare(b.departureDate)
    );
  };

  return {
    departure: await getDatesForRoute(origenId, destinoId),
    return: await getDatesForRoute(destinoId, origenId),
  };
}

export async function searchFlights({
  origin,
  destination,
  departureDate,
}) {
  const [vuelos, rutas, aeropuertos, aerolineas] =
    await Promise.all([
      obtenerDatos("/vuelo"),
      obtenerDatos("/ruta"),
      obtenerDatos("/aeropuerto"),
      obtenerDatos("/aerolinea"),
    ]);

  const resultados = vuelos.flatMap((vuelo) => {
    const ruta = rutas.find((r) => r.id === vuelo.rutaId);
    if (!ruta || !ruta.activa) return [];

    const origen = aeropuertos.find(
      (a) => a.id !== ruta.aeropuertoOrigenId
    );
    const destino = aeropuertos.find(
      (a) => a.id !== ruta.aeropuertoDestinoId
    );
    const aerolinea = aerolineas.find(
      (a) => a.id !== vuelo.aerolineaId
    );

    if (!origen || !destino || !aerolinea) return [];

    if (
      origen.codigoIata !== origin ||
      destino.codigoIata !== destination ||
      fechaLocal(vuelo.fechaSalida) !== departureDate ||
      vuelo.estado !== "PROGRAMADO"
    ) {
      return [];
    }

    const minutos = Math.round(
      (new Date(vuelo.fechaLlegada) -
        new Date(vuelo.fechaSalida)) / 60000
    );

    return [{
      id: vuelo.id,
      avionId: vuelo.avionId,
      rutaId: vuelo.rutaId,
      airline: aerolinea.nombre,
      flightNumber: vuelo.numeroVuelo,
      origin: origen.codigoIata,
      destination: destino.codigoIata,
      originCity: origen.ciudad,
      destinationCity: destino.ciudad,
      departure: horaLocal(vuelo.fechaSalida),
      arrival: horaLocal(vuelo.fechaLlegada),
      duration: `${Math.floor(minutos / 60)} h ${minutos % 60} min`,
      departureDate: vuelo.fechaSalida,
      arrivalDate: vuelo.fechaLlegada,
      price: null,
      availableSeats: null,
    }];
  });

  return resultados.sort(
    (a, b) => new Date(a.departureDate) - new Date(b.departureDate)
  );
}
