import { useCallback, useEffect, useRef, useState } from "react";
import FlightSearchModal from "./FlightSearchModal";
import {
  Search,
  ChevronDown,
  CalendarDays,
  PlaneTakeoff,
  PlaneLanding
} from 'lucide-react';
import { obtenerAeropuertos } from "../services/aeropuertoService";
import { obtenerFechasDisponibles } from "../services/flightService";
import * as Api from "../tools/Api";
import AirportCombobox from "./AirportCombobox";
import FlightDateRangeCalendar from "./FlightDateRangeCalendar";
import Toast from "./Toast";

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

function formatSearchDate(value, placeholder) {
  if (!value) return placeholder;

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FlightSearch() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpansionVisible, setIsExpansionVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const [calendarPhase, setCalendarPhase] = useState("");
  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(true);
  const [airportsError, setAirportsError] = useState("");
  const [data, setData] = useState({})
  const [alternativeDatesError, setAlternativeDatesError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [loadingAlternativeDate, setLoadingAlternativeDate] = useState("");
  const [alternativeDates, setAlternativeDates] = useState([]);
  const [availableDates, setAvailableDates] = useState({
    departure: [],
    return: [],
  });
  const [loadingAvailableDates, setLoadingAvailableDates] = useState(false);

  const [searchData, setSearchData] = useState({
    tripType: "round",
    OrigenID: 0,
    DestinationID: 0,
    departureDate: "",
    returnDate: ""
  });

  const closeSearchToast = useCallback(() => {
    setSearchError("");
  }, []);

  const openExpandedSearch = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsExpanded(true);
    requestAnimationFrame(() => setIsExpansionVisible(true));
  }, []);

  const closeExpandedSearch = useCallback(() => {
    setIsExpansionVisible(false);
    setCalendarPhase("");
    closeTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
      closeTimerRef.current = null;
    }, 300);
  }, []);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isExpanded) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") closeExpandedSearch();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isExpanded, closeExpandedSearch]);

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

  useEffect(() => {
    let active = true;

    if (!searchData.OrigenID || !searchData.DestinationID) {
      return undefined;
    }

    async function cargarFechasDisponibles() {
      setLoadingAvailableDates(true);

      try {
        const dates = await obtenerFechasDisponibles(
          searchData.OrigenID,
          searchData.DestinationID
        );

        if (active) setAvailableDates(dates);
      } catch (error) {
        if (active) {
          setAvailableDates({ departure: [], return: [] });
          setSearchError(
            error instanceof Error
              ? error.message
              : "No se pudieron consultar las fechas disponibles."
          );
        }
      } finally {
        if (active) setLoadingAvailableDates(false);
      }
    }

    void cargarFechasDisponibles();

    return () => {
      active = false;
    };
  }, [searchData.OrigenID, searchData.DestinationID]);

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
        setSearchError("Selecciona una fecha de salida.");
        return;
      }

      if (
        searchData.tripType === "round" &&
        !searchData.returnDate
      ) {
        setSearchError("Selecciona una fecha de regreso.");
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

  const handleCalendarSelect = (date) => {
    if (calendarPhase === "departure") {
      setSearchData((current) => ({
        ...current,
        departureDate: date,
        returnDate:
          current.returnDate && current.returnDate >= date
            ? current.returnDate
            : "",
      }));
      setCalendarPhase(searchData.tripType === "round" ? "return" : "");
      return;
    }

    setSearchData((current) => ({
      ...current,
      returnDate: date,
    }));
    setCalendarPhase("");
  };

  const renderDateSelector = (phase, label, value, placeholder) => {
    const isOpen = calendarPhase === phase;
    const isDisabled = phase === "return" && !searchData.departureDate;

    return (
      <div
        className={`relative w-full min-w-0 ${isOpen ? "z-40" : "z-0"}`}
      >
        <button
          type="button"
          aria-label={`${label}: ${formatSearchDate(value, placeholder)}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          disabled={isDisabled}
          onClick={() => {
            openExpandedSearch();
            setCalendarPhase((current) =>
              current === phase ? "" : phase
            );
          }}
          className={`flex w-full min-w-0 items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#3333CC] ${
            isOpen
              ? "border-[#3333CC] ring-2 ring-[#3333CC]/10"
              : "border-[#DCE3EF] hover:border-[#3333CC]"
          } ${
            isDisabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer"
          }`}
        >
          <CalendarDays className="mr-2 h-8 w-8 flex-shrink-0 text-gray-500" />
          <span className="flex min-w-0 flex-1 flex-col justify-center text-left">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider leading-none text-gray-400">
              {label}
            </span>
            <span
              className={`block min-w-0 truncate whitespace-nowrap text-sm font-semibold leading-none ${
                value ? "text-[#101936]" : "text-[#64748B]"
              }`}
            >
              {formatSearchDate(value, placeholder)}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#455675] transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div
            className={`absolute top-full z-50 mt-2 w-[min(760px,calc(100vw-2rem))] ${
              phase === "return" ? "right-0" : "left-0"
            }`}
          >
            <FlightDateRangeCalendar
              departureDate={searchData.departureDate}
              returnDate={searchData.returnDate}
              phase={phase}
              onSelect={handleCalendarSelect}
              onClose={() => setCalendarPhase("")}
              availableDates={
                availableDates[phase]
              }
              loading={loadingAvailableDates}
              onClear={() => {
                setSearchData((current) => ({
                  ...current,
                  departureDate: "",
                  returnDate: "",
                }));
                setCalendarPhase("departure");
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={
          isExpanded
            ? `fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300 ease-out sm:pt-16 ${
                isExpansionVisible
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`
            : ""
        }
        onClick={isExpanded ? closeExpandedSearch : undefined}
      >
        <div
          className={`${
            isExpanded
              ? `mx-auto w-full max-w-6xl transition-all duration-300 ease-out ${
                  isExpansionVisible
                    ? "translate-y-0 scale-100 opacity-100"
                    : "-translate-y-2 scale-95 opacity-0"
                }`
              : ""
          }`}
          onClick={(event) => event.stopPropagation()}
        >
        {/* Search Widget */}
        <div
          className={`relative z-50 ${
            isExpanded
              ? "mx-auto w-full max-w-6xl"
              : "mt-0 md:-mt-16 lg:-mt-23 mx-4 sm:mx-6 lg:mx-12 xl:mx-25"
          }`}
        >
          <div className={`relative bg-white rounded-4xl p-5 py-5 shadow-[0_15px_45px_rgba(51,51,153,0.25),0_0_35px_rgba(140,155,255,0.25)] border border-white/70 ${
            isExpanded
              ? "shadow-2xl transition-all duration-200 sm:p-8"
              : ""
          }`}>
            {isExpanded && (
              <button
                type="button"
                onClick={closeExpandedSearch}
                aria-label="Cerrar búsqueda enfocada"
                className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[#3333CC]"
              >
                <span aria-hidden="true" className="text-xl leading-none">✕</span>
              </button>
            )}
            {/* Top Row: Selectors */}
            <div className="flex items-center mb-4 gap-3 border-b border-gray-100 pb-4">
              {/* Selector de tipo de viaje */}
              <div className="w-full sm:w-auto">
                <div
                  role="group"
                  aria-label="Tipo de viaje"
                  className="
                    flex w-70
                    items-center
                    rounded-full
                    bg-[#eeebf5]
                    p-1.5
                    shadow-inner
                  "
                >
                  {/* Ida y vuelta */}
                  <button
                    type="button"
                    onClick={() => {
                      openExpandedSearch();
                      setCalendarPhase("");
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
                          ? "bg-slate-950/80 text-white font-semibold shadow-md backdrop-blur-xl"
                          : "bg-transparent text-slate-700/70 font-normal hover:text-slate-950"
                      }
                    `}
                  >
                    Ida y vuelta
                  </button>

                  {/* Solo ida */}
                  <button
                    type="button"
                    onClick={() => {
                      openExpandedSearch();
                      setCalendarPhase("");
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
                          ? "bg-slate-950/80 text-white font-semibold shadow-md backdrop-blur-xl"
                          : "bg-transparent text-slate-700/70 font-normal hover:text-slate-950"
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
              className={`grid min-w-0 grid-cols-1 items-center gap-2 md:grid-cols-2 ${searchData.tripType === "round"
                ? "xl:grid-cols-[minmax(160px,1.3fr)_minmax(160px,1.3fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto]"
                : "xl:grid-cols-[minmax(160px,1.3fr)_minmax(160px,1.3fr)_minmax(150px,1fr)_auto]"
                }`}
            >
              {/* Origen */}
              <AirportCombobox
                label="Origen"
                icon={PlaneTakeoff}
                airports={airports}
                value={searchData.OrigenID}
                onFocus={openExpandedSearch}
                placeholder={
                  loadingAirports
                    ? "Cargando aeropuertos..."
                    : "Selecciona origen"
                }
                disabled={loadingAirports || Boolean(airportsError)}
                onChange={(airportId) => {
                  setCalendarPhase("");
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
                onFocus={openExpandedSearch}
                placeholder={
                  loadingAirports
                    ? "Cargando aeropuertos..."
                    : "Selecciona destino"
                }
                disabled={loadingAirports || Boolean(airportsError)}
                onChange={(airportId) => {
                  setCalendarPhase("");
                  setSearchData((current) => ({
                    ...current,
                    DestinationID: airportId,
                    departureDate: "",
                    returnDate: "",
                  }));
                }}
              />


              {/* Salida */}
              {renderDateSelector(
                "departure",
                "Salida",
                searchData.departureDate,
                "Selecciona tu salida"
              )}

              {/* Regreso */}
              {searchData.tripType === "round" &&
                renderDateSelector(
                  "return",
                  "Regreso",
                  searchData.returnDate,
                  "Selecciona tu regreso"
                )}


              {/* Botón Buscar */}
              <button
                type="button"
                    onClick={() => {
                      openExpandedSearch();
                      handleSearch();
                    }}
                className="min-w-0 w-full xl:w-auto bg-slate-950/80 hover:bg-slate-900/90 text-white rounded-full p-4 flex items-center justify-center gap-3 transition-colors shadow-lg shadow-slate-950/20 backdrop-blur-xl whitespace-nowrap pl-5 pr-6"  >
                <Search className="w-5 h-5" />
                <span className="font-semibold">Buscar vuelos</span>
              </button>
            </div>
          </div>

        </div>
      </div>
      </div>

      {searchError && (
        <Toast
          message={searchError}
          onClose={closeSearchToast}
        />
      )}

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
