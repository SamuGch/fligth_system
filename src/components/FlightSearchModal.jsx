import { useEffect } from "react";
import {
  X,
  Plane,
  Clock3,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { airports } from "../data/airports";

const mockFlights = [
  {
    id: 1,
    airline: "Avianca",
    flightNumber: "AV123",
    origin: "GUA",
    destination: "MIA",
    departure: "08:00",
    arrival: "11:00",
    duration: "3 h",
    price: 950,
    availableSeats: 45,
  },
  {
    id: 2,
    airline: "Avianca",
    flightNumber: "AV125",
    origin: "GUA",
    destination: "MIA",
    departure: "14:30",
    arrival: "17:30",
    duration: "3 h",
    price: 1250,
    availableSeats: 28,
  },
];

export default function FlightSearchModal({
  isOpen,
  onClose,
  searchData,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    }; document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const origin = searchData?.origin || "GUA";
  const destination = searchData?.destination || "MIA";

  const flights = mockFlights.filter(
    (flight) =>
      flight.origin === origin &&
      flight.destination === destination
  );

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
          originCity: originAirport?.city ?? flight.origin,
          destinationCity:
            destinationAirport?.city ?? flight.destination,
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

          {flights.length === 0 ? (
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
                          Q{flight.price.toLocaleString("es-GT")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {flight.availableSeats} asientos
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectFlight(flight)}
                        className="bg-[#3b2b7a] hover:bg-[#2b205c]
                                  text-white px-6 py-3 rounded-full
                                  font-semibold transition-colors
                                  cursor-pointer"
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
