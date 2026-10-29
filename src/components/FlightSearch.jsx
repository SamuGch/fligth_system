import { useEffect, useState } from "react";
import FlightSearchModal from "./FlightSearchModal";
import {
  Search,
  ChevronDown,
  PlaneTakeoff,
  PlaneLanding
} from 'lucide-react';
import { obtenerAeropuertos } from "../services/aeropuertoService";
import * as Api from "../tools/Api";
import AirportCombobox from "./AirportCombobox";
import AvailableFlightDates from "./AvailableFlightDates";

function getLocalFlightDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const dateParts = Object.fromEntries(
    parts
      .filter(({ type }) => ["year", "month", "day"].includes(type))
      .map(({ type, value: partValue }) => [type, partValue])
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function getFlightPage(response) {
  if (Array.isArray(response)) {
    return { flights: response, totalPages: 1, limit: null };
  }

  if (!response || !Array.isArray(response.data)) {
    throw new Error("Formato de respuesta de vuelos inválido.");
  }

  const parsedTotalPages = Number(response.total_pages);

  return {
    flights: response.data,
    totalPages:
      Number.isInteger(parsedTotalPages) && parsedTotalPages > 0
        ? parsedTotalPages
        : 1,
    limit: Number(response.limit) || null,
  };
}

async function getAllFlights() {
  const firstPage = getFlightPage(await Api.get("/vuelo"));
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => {
      const page = index + 2;
      const limit = firstPage.limit ? `&limit=${firstPage.limit}` : "";
      return Api.get(`/vuelo?page=${page}${limit}`);
    })
  );

  return [
    ...firstPage.flights,
    ...remainingPages.flatMap((response) => getFlightPage(response).flights),
  ];
}

function getAlternativeDates(results) {
  const dates =
    results?.outbound?.alternativeDates ?? results?.alternativeDates;

  return Array.isArray(dates)
    ? [...dates].sort((a, b) =>
        a.departureDate.localeCompare(b.departureDate)
      )
    : [];
}

function mergeAlternativeDates(currentDates, nextDates) {
  const nextDatesByDate = new Map(
    nextDates.map((dateOption) => [
      dateOption.departureDate,
      dateOption,
    ])
  );
  const currentDateSet = new Set(
    currentDates.map((dateOption) => dateOption.departureDate)
  );

  return [
    ...currentDates.map(
      (dateOption) =>
        nextDatesByDate.get(dateOption.departureDate) ?? dateOption
    ),
    ...nextDates.filter(
      (dateOption) => !currentDateSet.has(dateOption.departureDate)
    ),
  ].sort((a, b) =>
    a.departureDate.localeCompare(b.departureDate)
  );
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

  const [searchData, setSearchData] = useState({
    tripType: "round",
    OrigenID: 0,
    DestinationID: 0,
    departureDate: "",
    returnDate: ""
  });

  const [availableDepartureDates, setAvailableDepartureDates] = useState([]);
  const [availableReturnDates, setAvailableReturnDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [datesError, setDatesError] = useState("");

  useEffect(() => {
    let active = true;

    const originId = Number(searchData.OrigenID);
    const destinationId = Number(searchData.DestinationID);

    if (!originId || !destinationId || originId === destinationId) return;

    async function loadAvailableDates() {
      setLoadingDates(true);

      try {
        const [flights, routes] = await Promise.all([
          getAllFlights(),
          Api.get("/ruta"),
        ]);

        if (!active) return;

        if (!Array.isArray(routes)) {
          throw new Error("Formato de respuesta de rutas inválido.");
        }

        const outboundRoutes = new Set(
          routes
            .filter(
              (route) =>
                route.activa &&
                Number(route.aeropuertoOrigenId) === originId &&
                Number(route.aeropuertoDestinoId) === destinationId
            )
            .map((route) => Number(route.id))
        );

        const inboundRoutes = new Set(
          routes
            .filter(
              (route) =>
                route.activa &&
                Number(route.aeropuertoOrigenId) === destinationId &&
                Number(route.aeropuertoDestinoId) === originId
            )
            .map((route) => Number(route.id))
        );

        const today = getLocalFlightDate(new Date());

        const extractDates = (routeIds) =>
          [
            ...new Set(
              flights
                .filter(
                  (flight) =>
                    routeIds.has(Number(flight.rutaId)) &&
                    flight.estado === "PROGRAMADO"
                )
                .map((flight) =>
                  getLocalFlightDate(flight.fechaSalida)
                )
                .filter((date) => date && date >= today)
            ),
          ].sort();

        setAvailableDepartureDates(extractDates(outboundRoutes));
        setAvailableReturnDates(extractDates(inboundRoutes));
      } catch (error) {
        if (!active) return;

        setDatesError(
          error instanceof Error
            ? error.message
            : "No se pudieron consultar las fechas."
        );
      } finally {
        if (active) setLoadingDates(false);
      }
    }

    void loadAvailableDates();

    return () => {
      active = false;
    };
  }, [searchData.OrigenID, searchData.DestinationID]);

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
      if (!searchData.OrigenID || !searchData.DestinationID) {
        setSearchError("Selecciona un origen y un destino.");
        return;
      }

      if (!searchData.departureDate) {
        setSearchError("Selecciona una fecha de salida disponible.");
        return;
      }

      if (
        searchData.tripType === "round" &&
        !searchData.returnDate
      ) {
        setSearchError("Selecciona una fecha de regreso disponible.");
        return;
      }

      const response = await Api.post("/vuelo/buscar", searchData);
      setAlternativeDates(getAlternativeDates(response));
      setData(response);
      setModalOpen(true);
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
      setAlternativeDates((currentDates) =>
        mergeAlternativeDates(currentDates, getAlternativeDates(response))
      );
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
        <div className="relative z-30 -mt-42 sm:-mt-8 md:-mt-16 lg:-mt-23 mx-4 sm:mx-6 lg:mx-12 xl:mx-25">
          <div className="bg-white rounded-4xl p-5 py-5 shadow-[0_15px_45px_rgba(51,51,153,0.25),0_0_35px_rgba(140,155,255,0.25)] border border-white/70">
            {/* Top Row: Selectors */}
            <div className="flex items-center mb-4 gap-3 border-b border-gray-100 pb-4">
              {/* Selector de tipo de viaje */}
              <div className="w-full sm:w-auto">
                <div
                  role="group"
                  aria-label="Tipo de viaje"
                  className="
                    flex w-full sm:w-[340px]
                    items-center
                    rounded-full
                    bg-[#eeebf5]
                    p-1
                    shadow-inner
                  "
                >
                  {/* Ida y vuelta */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchData((current) => ({
                        ...current,
                        tripType: "round",
                      }));
                    }}
                    aria-pressed={searchData.tripType === "round"}
                    className={`
                      flex-1
                      min-w-0
                      rounded-full
                      px-4 py-3
                      text-sm sm:text-base
                      whitespace-nowrap
                      transition-all duration-300 ease-in-out
                      ${
                        searchData.tripType === "round"
                          ? "bg-white text-[#3b2b7a] font-semibold shadow-md"
                          : "bg-transparent text-[#3b2b7a]/70 font-normal hover:text-[#3b2b7a]"
                      }
                    `}
                  >
                    Ida y vuelta
                  </button>

                  {/* Solo ida */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchData((current) => ({
                        ...current,
                        tripType: "one",
                        returnDate: "",
                      }));
                    }}
                    aria-pressed={searchData.tripType === "one"}
                    className={`
                      flex-1
                      min-w-0
                      rounded-full
                      px-4 py-3
                      text-sm sm:text-base
                      whitespace-nowrap
                      transition-all duration-300 ease-in-out
                      ${
                        searchData.tripType === "one"
                          ? "bg-white text-[#3b2b7a] font-semibold shadow-md"
                          : "bg-transparent text-[#3b2b7a]/70 font-normal hover:text-[#3b2b7a]"
                      }
                    `}
                  >
                    Solo ida
                  </button>
                </div>
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
                  setAvailableDepartureDates([]);
                  setAvailableReturnDates([]);
                  setDatesError("");
                  setLoadingDates(false);
                  setSearchData((current) => ({
                    ...current,
                    OrigenID: airportId,
                    DestinationID:
                      Number(current.DestinationID) === Number(airportId)
                        ? 0
                        : current.DestinationID,
                    departureDate: "",
                    returnDate: "",
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
                  setAvailableDepartureDates([]);
                  setAvailableReturnDates([]);
                  setDatesError("");
                  setLoadingDates(false);
                  setSearchData((current) => ({
                    ...current,
                    DestinationID: airportId,
                    departureDate: "",
                    returnDate: "",
                  }));
                }}
              />


              {/* Salida */}
              <AvailableFlightDates
                label="Salida"
                value={searchData.departureDate}
                dates={availableDepartureDates}
                loading={loadingDates}
                disabled={
                  !searchData.OrigenID ||
                  !searchData.DestinationID
                }
                placeholder="Selecciona tu salida"
                onChange={(date) => {
                  setSearchData((current) => ({
                    ...current,
                    departureDate: date,
                    returnDate: "",
                  }));
                }}
              />

              {/* Regreso */}
              {searchData.tripType === "round" && (
                <AvailableFlightDates
                  label="Regreso"
                  value={searchData.returnDate}
                  dates={availableReturnDates.filter(
                    (date) =>
                      searchData.departureDate &&
                      date >= searchData.departureDate
                  )}
                  loading={loadingDates}
                  disabled={!searchData.departureDate}
                  placeholder="Selecciona tu regreso"
                  onChange={(date) => {
                    setSearchData((current) => ({
                      ...current,
                      returnDate: date,
                    }));
                  }}
                />
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
            {datesError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {datesError}
              </p>
            )}
          </div>

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
