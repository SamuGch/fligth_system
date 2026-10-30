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

export async function obtenerFechasDisponibles(origenId, destinoId) {
  const [vuelos, rutas] = await Promise.all([
    obtenerDatos("/vuelo"),
    obtenerDatos("/ruta"),
  ]);

  const rutasActivas = rutas.filter((ruta) => ruta.activa !== false);
  const getDatesForRoute = (from, to) => {
    const routeIds = new Set(
      rutasActivas
        .filter(
          (ruta) =>
            Number(ruta.aeropuertoOrigenId) === Number(from) &&
            Number(ruta.aeropuertoDestinoId) === Number(to)
        )
        .map((ruta) => Number(ruta.id))
    );

    return [
      ...new Set(
        vuelos
          .filter(
            (vuelo) =>
              routeIds.has(Number(vuelo.rutaId)) &&
              vuelo.estado === "PROGRAMADO"
          )
          .map((vuelo) => fechaLocal(vuelo.fechaSalida))
          .filter(Boolean)
      ),
    ].sort();
  };

  return {
    departure: getDatesForRoute(origenId, destinoId),
    return: getDatesForRoute(destinoId, origenId),
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
