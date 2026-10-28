import { useEffect, useState, useRef } from "react";
import FlightSearchModal from "./FlightSearchModal";
import {
  Calendar,
  Search,
  ChevronDown,
  PlaneTakeoff,
  PlaneLanding
} from 'lucide-react';
import { obtenerAeropuertos } from "../services/aeropuertoService";
import * as Api from "../tools/Api";
import AirportCombobox from "./AirportCombobox";
import FlightDateRangeCalendar from "./FlightDateRangeCalendar";

function getLocalFlightDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getOutboundFlights(results) {
  return results?.outbound?.flights ?? [];
}

function getLowestPrice(flights) {
  const prices = flights
    .flatMap((flight) => flight.prices ?? [])
    .map((fare) => Number(fare.price))
    .filter(Number.isFinite);

  return prices.length ? Math.min(...prices) : null;
}

export default function FlightSearch() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(true);
  const [airportsError, setAirportsError] = useState("");
  const [data, setData] = useState({})
  const [alternativeDatesError, setAlternativeDatesError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [loadingAlternativeDate, setLoadingAlternativeDate] = useState("");
  const [alternativeDates, setAlternativeDates] = useState([]);


  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarPhase, setCalendarPhase] = useState("departure");
  const calendarPopupRef = useRef(null);


  const formatDate = (value) => {
    if (!value) return "dd/mm/yyyy";

    const [year, month, day] = value.split("-");

    return `${day} / ${month} / ${year}`;
  };

  // Función para abrir el calendario
  const openCalendar = (phase) => {
    if (phase === "return" && !searchData.departureDate) {
      setCalendarPhase("departure");
    } else {
      setCalendarPhase(phase);
    }

    setCalendarOpen(true);
  };

  // Función para seleccionar fechas
  const handleCalendarDateSelect = (date) => {
    if (
      calendarPhase === "departure" ||
      !searchData.departureDate
    ) {
      setSearchData((current) => ({
        ...current,
        departureDate: date,
        returnDate: "",
      }));

      if (searchData.tripType === "round") {
        // Mantener abierto para seleccionar regreso
        setCalendarPhase("return");
      } else {
        // Solo ida (cerrar después de elegir salida)
        setCalendarOpen(false);
      }

      return;
    }

    if (date < searchData.departureDate) return;

    setSearchData((current) => ({
      ...current,
      returnDate: date,
    }));

    // Ambas fechas seleccionadas
    setCalendarOpen(false);
  };

  // Limpia las fechas del calendario
  const clearCalendarDates = () => {
    setSearchData((current) => ({
      ...current,
      departureDate: "",
      returnDate: "",
    }));

    setCalendarPhase("departure");
  };



  // Cerrar el calendario al hacer clic fuera


  useEffect(() => {
    if (!calendarOpen) return;

    const handleOutsideClick = (event) => {
      const target = event.target;

      // Verificar si el clic ocurrió dentro del calendario
      const clickedInsideCalendar =
        calendarPopupRef.current?.contains(target);

      // Verificar si se presionó Salida o Regreso
      const clickedCalendarTrigger =
        target instanceof Element &&
        target.closest("[data-calendar-trigger]");

      // Cerrar únicamente si se hizo clic fuera
      if (!clickedInsideCalendar && !clickedCalendarTrigger) {
        setCalendarOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setCalendarOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [calendarOpen]);





  const [searchData, setSearchData] = useState({
    tripType: "round",
    OrigenID: 0,
    DestinationID: 0,
    departureDate: "",
    returnDate: ""
  });

  const updateSearch = (event) => {
    const { name, value } = event.target;

    // Logs de la rama HEAD
    console.log({ name }, { value });
    console.log({ event });

    // Actualización de estado funcional de la rama responsive2
    setSearchData((current) => ({
      ...current,
      [name]:
        name === "OrigenID" || name === "DestinationID"
          ? Number(value)
          : value,
    }));
  };

  useEffect(() => {
    let active = true;

    async function cargarAeropuertos() {
      try {
        setLoadingAirports(true);
        setAirportsError("");

        const data = await obtenerAeropuertos();

        if (!active) return;

        setAirports(data);
      } catch (error) {
        if (active) {
          setAirportsError(
            error instanceof Error
              ? error.message
              : "No se pudieron obtener los aeropuertos.",
          );
        }
      } finally {
        if (active) setLoadingAirports(false);
      }
    }

    void cargarAeropuertos();

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async () => {
    setSearchError("");
    setAlternativeDatesError("");
    setAlternativeDates([]);

    try {
      const response = await Api.post("/vuelo/buscar", searchData);
      setData(response);
      setModalOpen(true);

      try {
        const [flights, routes] = await Promise.all([
          Api.get("/vuelo"),
          Api.get("/ruta"),
        ]);

        if (!Array.isArray(flights) || !Array.isArray(routes)) {
          throw new Error("La API devolvió un formato de vuelos o rutas inválido.");
        }

        const matchingRouteIds = new Set(
          routes
            .filter(
              (route) =>
                route.activa &&
                Number(route.aeropuertoOrigenId) === Number(searchData.OrigenID) &&
                Number(route.aeropuertoDestinoId) === Number(searchData.DestinationID),
            )
            .map((route) => Number(route.id)),
        );
        const candidateDates = [
          ...new Set(
            flights
              .filter(
                (flight) =>
                  matchingRouteIds.has(Number(flight.rutaId)) &&
                  flight.estado === "PROGRAMADO",
              )
              .map((flight) => getLocalFlightDate(flight.fechaSalida))
              .filter((date) => date && date !== searchData.departureDate),
          ),
        ].sort();

        const datesWithFlights = await Promise.all(
          candidateDates.map(async (departureDate) => {
            const dateResults = await Api.post("/vuelo/buscar", {
              ...searchData,
              departureDate,
            });
            const dateFlights = getOutboundFlights(dateResults);

            if (!dateFlights.length) return null;

            return {
              departureDate,
              price: getLowestPrice(dateFlights),
            };
          }),
        );

        setAlternativeDates(datesWithFlights.filter(Boolean));
      } catch (error) {
        setAlternativeDatesError(
          error instanceof Error
            ? error.message
            : "No se pudieron consultar otras fechas disponibles.",
        );
      }
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "No se pudieron buscar vuelos.",
      );
    }
  };

  const handleSelectAlternativeDate = async (departureDate) => {
    setLoadingAlternativeDate(departureDate);
    setAlternativeDatesError("");

    try {
      const updatedSearchData = { ...searchData, departureDate };
      const response = await Api.post("/vuelo/buscar", updatedSearchData);
      setSearchData(updatedSearchData);
      setData(response);
    } catch (error) {
      setAlternativeDatesError(
        error instanceof Error
          ? error.message
          : "No se pudieron consultar los vuelos para esta fecha.",
      );
    } finally {
      setLoadingAlternativeDate("");
    }
  };

  return (
    <>
      <div>
        {/* Search Widget */}
        <div className={`relative ${calendarOpen ? "z-50" : "z-30"} -mt-42 sm:-mt-8 md:-mt-16 lg:-mt-23 mx-4 sm:mx-6 lg:mx-12 xl:mx-25`}>
          <div className="bg-white rounded-4xl p-5 py-5 shadow-[0_15px_45px_rgba(51,51,153,0.25),0_0_35px_rgba(140,155,255,0.25)] border border-white/70">
            {/* Top Row: Selectors */}
            <div className="flex items-center mb-4 gap-3 border-b border-gray-100 pb-4">
              <div className="relative inline-block">
                <button
                  onClick={() => setTripTypeOpen((open) => !open)}
                  aria-expanded={tripTypeOpen}
                  className="bg-[#333399] text-white px-6 py-2 rounded-full text-sm font-medium flex items-center justify-between gap-5 min-w-[180px] hover:bg-[#2c2c5c] transition-colors"
                >
                  {searchData.tripType === "round" ? "Ida y vuelta" : "Solo ida"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${tripTypeOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {tripTypeOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 flex w-48 flex-col rounded-2xl border border-purple-300 bg-purple-50 py-2 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchData((current) => ({ ...current, tripType: "round" }));
                        setTripTypeOpen(false);
                      }}
                      className="min-h-11 px-4 text-left hover:bg-violet-100"
                    >
                      Ida y vuelta
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchData((current) => ({ ...current, tripType: "one", returnDate: "", }));
                        setCalendarOpen(false);
                        setTripTypeOpen(false);
                      }}
                      className="min-h-11 px-4 text-left hover:bg-violet-100"
                    >
                      Solo ida
                    </button>
                  </div>
                )}
              </div>

              {/* Pasajeros 
            <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">
                Pasajeros
            </label>

            <select
                value={searchData.passengers}
                onChange={(e) =>
                updateSearch("passengers", Number(e.target.value))
                }
                className="rounded-full px-4 py-2.5 bg-slate-50
                        text-slate-700 text-sm cursor-pointer"
            >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <option key={number} value={number}>
                    {number}
                </option>
                ))}
            </select>
            </div>*/}

              {/* Clase 
            <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">
                Clase
            </label>

            <select
                value={searchData.seatClass}
                onChange={(e) =>
                updateSearch("seatClass", e.target.value)
                }
                className="rounded-full px-4 py-2.5 bg-slate-50
                        text-slate-700 text-sm cursor-pointer"
            >
                <option value="Economica">Económica</option>
                <option value="Business">Business</option>
            </select>
            </div>

                    className={`w-5 h-5 transition-transform ${tripTypeOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {tripTypeOpen && (
                  <div className="absolute left-0 top-full mt-2 w-43 bg-purple-50 rounded-[10px] shadow-xl border border-purple-300 py-2 z-50 flex flex-col">
                    <button type="button" onClick={() => {
                      updateSearch("tripType", "round"); setTripTypeOpen(false);
                    }}
                    >
                      Ida y vuelta
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateSearch("tripType", "one");
                        setTripTypeOpen(false);
                      }}
                    >
                      Solo ida
                    </button>

                  </div>
                )}
              </div>

              {/* Pasajeros 
            <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">
                Pasajeros
            </label>

            <select
                value={searchData.passengers}
                onChange={(e) =>
                updateSearch("passengers", Number(e.target.value))
                }
                className="rounded-full px-4 py-2.5 bg-slate-50
                        text-slate-700 text-sm cursor-pointer"
            >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <option key={number} value={number}>
                    {number}
                </option>
                ))}
            </select>
            </div>*/}

              {/* Clase 
            <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">
                Clase
            </label>

            <select
                value={searchData.seatClass}
                onChange={(e) =>
                updateSearch("seatClass", e.target.value)
                }
                className="rounded-full px-4 py-2.5 bg-slate-50
                        text-slate-700 text-sm cursor-pointer"
            >
                <option value="Economica">Económica</option>
                <option value="Business">Business</option>
            </select>
            </div>

          </div>*/}
            </div>

            {/* Bottom Row: Inputs */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 items-center gap-3 ${searchData.tripType === "round"
                ? "xl:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto]"
                : "xl:grid-cols-[1.5fr_1.5fr_1fr_auto]"
                }`}
            >
              {/* Origen */}
              <AirportCombobox
                label="Origen"
                icon={PlaneTakeoff}
                airports={airports}
                value={searchData.OrigenID}
                placeholder={
                  loadingAirports
                    ? "Cargando aeropuertos..."
                    : "Selecciona origen"
                }
                disabled={loadingAirports || Boolean(airportsError)}
                onChange={(airportId) => {
                  setSearchData((current) => ({
                    ...current,
                    OrigenID: airportId,
                    DestinationID:
                      Number(current.DestinationID) === Number(airportId)
                        ? 0
                        : current.DestinationID,
                  }));
                }}
              />


              {/* Destino */}
              <AirportCombobox
                label="Destino"
                icon={PlaneLanding}
                airports={airports.filter(
                  (airport) =>
                    Number(airport.id) !== Number(searchData.OrigenID)
                )}
                value={searchData.DestinationID}
                placeholder={
                  loadingAirports
                    ? "Cargando aeropuertos..."
                    : "Selecciona destino"
                }
                disabled={loadingAirports || Boolean(airportsError)}
                onChange={(airportId) => {
                  setSearchData((current) => ({
                    ...current,
                    DestinationID: airportId,
                  }));
                }}
              />


              {/* Salida */}
              <button
                type="button"
                data-calendar-trigger
                aria-expanded={calendarOpen && calendarPhase === "departure"}
                onClick={() => openCalendar("departure")}
                className="
                            w-full min-w-0
                            border border-gray-200 rounded-2xl
                            p-3 pl-5 pr-5
                            flex items-center gap-5
                            text-left cursor-pointer
                            hover:border-[#3333CC]
                            hover:bg-indigo-50/30
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[#3333CC]/20
                            transition-all duration-200
                          "
              >
                <Calendar className="w-8 h-8 text-slate-600 shrink-0" />

                <div className="flex-1 min-w-0">
                  <span className="block text-xs text-slate-500 mb-1">
                    Salida
                  </span>

                  <span className="block text-sm font-semibold text-slate-800">
                    {formatDate(searchData.departureDate)}
                  </span>
                </div>

                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-[#455675] transition-transform duration-200 ${calendarOpen && calendarPhase === "departure" ? "rotate-180" : ""} `}
                />
              </button>


              {/* Regreso: solamente para ida y vuelta */}
              {searchData.tripType === "round" && (

                <button
                  type="button"
                  data-calendar-trigger
                  aria-expanded={calendarOpen && calendarPhase === "return"}
                  onClick={() => openCalendar("return")}
                  className="
                              w-full min-w-0
                              border border-gray-200 rounded-2xl
                              p-3 pl-5 pr-5
                              flex items-center gap-5
                              text-left cursor-pointer
                              hover:border-[#3333CC]
                              hover:bg-indigo-50/30
                              focus-visible:outline-none
                              focus-visible:ring-2
                              focus-visible:ring-[#3333CC]/20
                              transition-all duration-200
                            "
                >
                  <Calendar className="w-8 h-8 text-slate-600 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <span className="block text-xs text-slate-500 mb-1">
                      Regreso
                    </span>

                    <span className="block text-sm font-semibold text-slate-800">
                      {formatDate(searchData.returnDate)}
                    </span>
                  </div>

                  <ChevronDown
                    className={` w-4 h-4 shrink-0 text-[#455675] transition-transform duration-200 ${calendarOpen && calendarPhase === "return" ? "rotate-180" : ""} `}
                  />
                </button>

              )}


              {/* Botón Buscar */}
              <button
                type="button"
                onClick={handleSearch}
                className="w-full xl:w-auto bg-[#333399] hover:bg-[#2c2c5c] text-white rounded-full p-4 flex items-center justify-center gap-3 transition-colors shadow-lg shadow-indigo-900/20 whitespace-nowrap pl-5 pr-6 "  >
                <Search className="w-5 h-5" />
                <span className="font-semibold">Buscar vuelos</span>
              </button>
            </div>
            {searchError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {searchError}
              </p>
            )}
          </div>


          {/* Calendario compartido */}
          {calendarOpen && (
            <>
              {/* Fondo oscuro exclusivo para móviles */}
              <div
                aria-hidden="true"
                onClick={() => setCalendarOpen(false)}
                className="
        fixed inset-0 z-40
        bg-[#101936]/40
        backdrop-blur-[2px]
        md:hidden
      "
              />

              {/* Contenedor del calendario */}
              <div
                ref={calendarPopupRef}
                className="
                            fixed inset-x-3 bottom-3 z-50

                            md:absolute
                            md:inset-x-auto
                            md:bottom-auto
                            md:top-full
                            md:right-0
                            md:mt-3

                            md:w-[700px]
                            md:max-w-[calc(100vw-2rem)]
                          "
              >
                <FlightDateRangeCalendar
                  departureDate={searchData.departureDate}
                  returnDate={searchData.returnDate}
                  phase={calendarPhase}
                  tripType={searchData.tripType}
                  onSelect={handleCalendarDateSelect}
                  onClose={() => setCalendarOpen(false)}
                  onClear={clearCalendarDates}
                />
              </div>
            </>
          )}


        </div>
      </div>





      <FlightSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        searchData={searchData}
        searchResults={data}
        alternativeDates={alternativeDates}
        alternativeDatesError={alternativeDatesError}
        loadingAlternativeDate={loadingAlternativeDate}
        onSelectAlternativeDate={handleSelectAlternativeDate}
      />
    </>
  );
}
