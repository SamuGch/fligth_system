import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, Plane, X } from "lucide-react";
import { airports } from "../data/airports";
import { useAuth } from "../features/auth/context/AuthContext";

function formatTime(value) {
  if (!value) return "--:--";
  return value.match(/(?:T|\s)(\d{2}:\d{2})/)?.[1] ?? value;
}

function formatDate(value) {
  if (!value) return "Fecha por seleccionar";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString("es-GT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "Precio no disponible";
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

function getLayoverLabel(layover) {
  const airport = airports.find((item) => item.code === layover.airport);
  const city = layover.city ?? airport?.city;
  const country = layover.country ?? airport?.country;
  const place = [city, country].filter(Boolean).join(", ");

  return `${place || layover.airport}${place ? ` (${layover.airport})` : ""}`;
}

export default function FlightSearchModal({
  isOpen,
  onClose,
  searchData,
  searchResults,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const flights = searchResults?.outbound?.flights ?? [];
  const alternativeDates =
    searchResults?.outbound?.alternativeDates ??
    searchResults?.alternativeDates ??
    [];
  const firstFlight = flights[0];

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectFlight = (flight) => {
    const selectedFlight = {
      ...flight,
      vueloId: flight.vueloId ?? flight.id,
      avionId: flight.avionId ?? flight.avion_id,
    };
    const seatSelectionData = {
      flight: selectedFlight,
      avionId: selectedFlight.avionId,
    };

    onClose();

    if (isAuthenticated) {
      navigate("/seleccion-asientos", {
        state: seatSelectionData,
      });
      return;
    }

    navigate("/login", {
      state: {
        backgroundLocation: location,
        returnTo: "/seleccion-asientos",
        seatSelectionData,
      },
    });
  };

  const currentPrices = flights.flatMap((flight) => flight.prices ?? []);
  const currentPrice = currentPrices.length
    ? Math.min(...currentPrices.map((fare) => Number(fare.price)))
    : null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-2 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-modal-title"
        className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[90dvh]"
      >
        <header className="flex items-start justify-between gap-3 bg-[#3b2b7a] px-4 py-5 text-white sm:px-8 sm:py-6">
          <div className="min-w-0">
            <p className="mb-1 text-sm text-white/70">Resultados de búsqueda</p>
            <h2 id="flight-modal-title" className="text-xl font-bold sm:text-3xl">
              Vuelos disponibles
            </h2>
            {firstFlight && (
              <p className="mt-2 text-sm text-white/80">
                {firstFlight.originCity ?? firstFlight.origin} ({firstFlight.origin})
                {" → "}
                {firstFlight.destinationCity ?? firstFlight.destination} ({firstFlight.destination})
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar resultados"
            className="min-h-11 min-w-11 shrink-0 rounded-full p-2 hover:bg-white/15"
          >
            <X size={22} />
          </button>
        </header>

        <div className="bg-slate-50 p-4 sm:p-8">
          {alternativeDates.length > 0 && (
            <section aria-label="Fechas alternativas" className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays size={17} />
                <h3>Otras fechas disponibles</h3>
              </div>
              <div className="flex overflow-x-auto border-b border-slate-200">
                {[
                  ...(searchData?.departureDate
                    ? [{ departureDate: searchData.departureDate, price: currentPrice, current: true }]
                    : []),
                  ...alternativeDates,
                ].map((dateOption, index) => (
                  <div
                    key={`${dateOption.departureDate}-${index}`}
                    className={`min-w-36 flex-1 border-b-4 px-4 py-3 text-center ${
                      dateOption.current
                        ? "border-blue-600 text-slate-800"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    <p className="whitespace-nowrap text-sm font-medium">
                      {dateOption.current ? "Tu fecha" : formatDate(dateOption.departureDate)}
                    </p>
                    <p className="mt-1 whitespace-nowrap text-base font-semibold">
                      {dateOption.price == null
                        ? "Sin precio"
                        : `desde ${formatPrice(dateOption.price)}`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mb-5 flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays size={17} />
            <span>{formatDate(searchData?.departureDate ?? firstFlight?.departure)}</span>
          </div>

          {flights.length === 0 ? (
            <div className="py-14 text-center text-slate-600">
              No encontramos vuelos para esta búsqueda.
            </div>
          ) : (
            <div className="space-y-4">
              {flights.map((flight, index) => {
                const layovers = flight.layovers ?? [];
                const segmentCount = flight.segments?.length ?? 0;
                const hasStops = segmentCount > 1 || Number(flight.stops) > 0 || layovers.length > 0;

                return (
                  <article
                    key={`${flight.flightNumber}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
                  >
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{flight.flightNumber}</p>
                        <p className="mt-1 text-sm text-slate-500">Operado por {flight.airline}</p>
                      </div>
                      {hasStops ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                          {layovers.length || Math.max(segmentCount - 1, Number(flight.stops) || 0)} escala
                          {(layovers.length || Math.max(segmentCount - 1, Number(flight.stops) || 0)) === 1 ? "" : "s"}
                          {layovers[0] && ` en ${getLayoverLabel(layovers[0])}`}
                          {layovers[0]?.duration && ` · ${layovers[0].duration}`}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          Directo
                        </span>
                      )}
                    </div>

                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(4rem,auto)_minmax(0,1fr)] items-center gap-2 sm:gap-5">
                      <div className="min-w-0">
                        <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatTime(flight.departure)}</p>
                        <p className="mt-1 break-words text-sm font-medium text-slate-700">{flight.originCity}</p>
                        <p className="text-xs text-slate-500">{flight.origin}</p>
                      </div>
                      <div className="min-w-0 text-center text-slate-500 sm:min-w-32">
                        <p className="flex items-center justify-center gap-1 text-xs">
                          <Clock3 size={14} /> {flight.duration}
                        </p>
                        <div className="my-2 border-t border-dashed border-slate-300" />
                        <p className="text-xs">{hasStops ? `${Math.max(segmentCount - 1, Number(flight.stops) || layovers.length)} escala(s)` : "Vuelo directo"}</p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatTime(flight.arrival)}</p>
                        <p className="mt-1 break-words text-sm font-medium text-slate-700">{flight.destinationCity}</p>
                        <p className="text-xs text-slate-500">{flight.destination}</p>
                      </div>
                    </div>

                    {flight.prices?.length > 0 && (
                      <div className="mt-5 border-t border-slate-200 pt-4">
                        <h3 className="mb-3 text-sm font-semibold text-slate-700">Precios por clase</h3>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {flight.prices.map((fare) => (
                            <div
                              key={fare.seatTypeId}
                              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">{fare.seatType}</p>
                                <p className="text-xs text-slate-500">
                                  {fare.availableSeats == null
                                    ? "Disponibilidad no informada"
                                    : `${fare.availableSeats} asientos disponibles`}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-bold text-[#3b2b7a]">
                                {formatPrice(fare.price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSelectFlight(flight)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#3b2b7a] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#2c205e] sm:w-auto"
                      >
                        <Plane size={17} /> Seleccionar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
