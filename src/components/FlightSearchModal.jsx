import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Plane,
  Clock3,
  CalendarDays,
} from "lucide-react";
import { airports } from "../data/airports";
import { searchFlights } from "../services/flightService";

export default function FlightSearchModal({
  isOpen,
  onClose,
  searchData,
}) {
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const origin = searchData?.origin || "GUA";
  const destination = searchData?.destination || "MIA";
  const departureDate = searchData?.departureDate;

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    }; document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;

    async function cargarVuelos() {
      setLoading(true);
      setError("");
      setFlights([]);

      try {
        const resultados = await searchFlights({
          origin,
          destination,
          departureDate,
        });

        if (!cancelled) {
          setFlights(resultados);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible buscar vuelos.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void cargarVuelos();

    return () => {
      cancelled = true;
    };
  }, [isOpen, origin, destination, departureDate]);

  if (!isOpen) return null;

  const handleSelectFlight = (flight) => {
    const originAirport = airports.find(
      (airport) => airport.code === flight.origin
    );
    const destinationAirport = airports.find(
      (airport) => airport.code === flight.destination
    );

    onClose();
    navigate("/seleccion-asientos", {
      state: {
        flight: {
          ...flight,
          originCity:
            flight.originCity ??
            originAirport?.city ??
            flight.origin,
          destinationCity:
            flight.destinationCity ??
            destinationAirport?.city ??
            flight.destination,
          departureTime: flight.departure,
          arrivalTime: flight.arrival,
        },
        passengers: searchData?.passengers,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center
                 justify-center bg-slate-950/50
                 backdrop-blur-sm p-3 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-modal-title"
        className="bg-white w-full max-w-5xl
                   max-h-[90dvh] overflow-y-auto
                   rounded-3xl shadow-2xl"
      >
        {/* Encabezado */}
        <div
          className="bg-[#3b2b7a] text-white
                     px-5 sm:px-8 py-6
                     flex items-start justify-between"
        >
          <div>
            <p className="text-sm text-white/70 mb-1">
              Encuentra tu próximo destino
            </p>
            <h2
              id="flight-modal-title"
              className="text-2xl sm:text-3xl font-bold"
            >
              Vuelos disponibles
            </h2>
            <p className="text-white/80 text-sm mt-2">
              {origin} → {destination}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar resultados"
            className="p-2 rounded-full hover:bg-white/15
                       cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-8 bg-slate-50">
          <div className="flex items-center gap-2 mb-6
                          text-slate-600 text-sm">
            <CalendarDays size={18} />
            <span>
              {searchData?.departureDate ||
                "Fecha por seleccionar"}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-14 text-slate-600">
              Buscando vuelos disponibles...
            </div>
          ) : error ? (
            <div role="alert" className="text-center py-14 text-red-600">
              {error}
            </div>
          ) : flights.length === 0 ? (
            <div className="text-center py-14 text-slate-600">
              No encontramos vuelos para esta búsqueda.
            </div>
          ) : (
            <div className="space-y-4">
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className="bg-white border border-slate-200
                             rounded-2xl p-5 sm:p-6
                             hover:border-violet-300
                             hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row
                                  lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-5">
                        <div
                          className="bg-violet-100 p-2
                                     rounded-full"
                        >
                          <Plane
                            size={20}
                            className="text-[#3b2b7a]"
                          />
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {flight.airline}
                          </p>
                          <p className="text-xs text-slate-500">
                            Vuelo {flight.flightNumber}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center
                                   justify-between gap-3"
                      >
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {flight.departure}
                          </p>
                          <p className="text-sm text-slate-500">
                            {flight.origin}
                          </p>
                        </div>

                        <div className="text-center flex-1 max-w-44">
                          <div
                            className="flex items-center
                                       justify-center gap-2
                                       text-slate-500 text-xs"
                          >
                            <Clock3 size={14} />
                            {flight.duration}
                          </div>
                          <div
                            className="border-t border-dashed
                                       border-slate-300 my-2"
                          />
                          <p className="text-xs text-slate-400">
                            Directo
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">
                            {flight.arrival}
                          </p>
                          <p className="text-sm text-slate-500">
                            {flight.destination}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="lg:border-l border-slate-200
                                 lg:pl-6 lg:w-48
                                 flex flex-row lg:flex-col
                                 items-center lg:items-stretch
                                 justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs text-slate-500">
                          Precio desde
                        </p>
                        <p className="text-2xl font-extrabold
                                      text-[#3b2b7a]">
                          {flight.price == null
                            ? "No disponible"
                            : `Q${flight.price.toLocaleString("es-GT")}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {flight.availableSeats == null
                            ? "Asientos no disponibles"
                            : `${flight.availableSeats} asientos`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectFlight(flight)}
                        className="bg-[#3b2b7a] hover:bg-[#2c205e]
                                   text-white rounded-full
                                   px-5 py-3 font-semibold
                                   flex items-center
                                   justify-center gap-2
                                   cursor-pointer transition-colors"
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
