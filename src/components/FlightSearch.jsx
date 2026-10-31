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
import {
  buscarVuelos,
  obtenerFechasDisponibles,
} from "../services/flightService";
import AirportCombobox from "./AirportCombobox";
import FlightDateRangeCalendar from "./FlightDateRangeCalendar";
import Toast from "./Toast";
import PassengerClassSelector from "./PassengerClassSelector";

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
  });
}

function normalizeCalendarDates(data) {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (typeof item === "string") {
        return { fecha: item, precioMinimo: null };
      }

      return {
        fecha: item?.fecha ?? item?.departureDate,
        precioMinimo: item?.precioMinimo ?? item?.price ?? null,
      };
    })
    .filter((item) => item.fecha);
}

export default function FlightSearch() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpansionVisible, setIsExpansionVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const searchModalRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
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
  const calendarRequestIds = useRef({
    departure: 0,
    return: 0,
  });
  const availableDatesRef = useRef(availableDates);
  useEffect(() => {
    availableDatesRef.current = availableDates;
  }, [availableDates]);

  const [searchData, setSearchData] = useState({
    tripType: "round",
    OrigenID: 0,
    DestinationID: 0,
    departureDate: "",
    returnDate: "",
    totalPassengers: 1,
    passengerDetails: { adults: 1, children: 0, infants: 0 },
    seatTypeId: 2,
    seatClassName: "Económica",
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
    setActiveDropdown(null);
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

    const handleOutsideSearch = (event) => {
      if (
        searchModalRef.current &&
        !searchModalRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
        closeExpandedSearch();
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") closeExpandedSearch();
    };

    document.addEventListener("pointerdown", handleOutsideSearch);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideSearch);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isExpanded, closeExpandedSearch]);

  const activateDropdown = useCallback((dropdown) => {
    openExpandedSearch();
    setActiveDropdown((current) => current === dropdown ? null : dropdown);
  }, [openExpandedSearch]);

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

  const loadCalendarMonth = useCallback(async (currentViewMonth, phase) => {
    const requestId = calendarRequestIds.current[phase] + 1;
    calendarRequestIds.current[phase] = requestId;

    if (!searchData.OrigenID || !searchData.DestinationID) {
      return null;
    }

    const request = {
      totalPassengers: searchData.totalPassengers,
      seatTypeId: searchData.seatTypeId,
      mesAnio: currentViewMonth,
    };
    const originId =
      phase === "departure" ? searchData.OrigenID : searchData.DestinationID;
    const destinationId =
      phase === "departure" ? searchData.DestinationID : searchData.OrigenID;

    setLoadingAvailableDates(true);

    try {
      const data = await obtenerFechasDisponibles(
        originId,
        destinationId,
        request
      );
      console.log("FECHAS RECIBIDAS DEL BACKEND:", data);
      console.log("ESTADO availableDates:", availableDatesRef.current);

      let dates = normalizeCalendarDates(data);
      let resolvedMonth = currentViewMonth;

      if (dates.length === 0) {
        const [year, month] = currentViewMonth.split("-").map(Number);
        const nextDate = new Date(year, month, 1);
        const nextMonth = `${nextDate.getFullYear()}-${String(
          nextDate.getMonth() + 1
        ).padStart(2, "0")}`;
        const nextData = await obtenerFechasDisponibles(
          originId,
          destinationId,
          { ...request, mesAnio: nextMonth }
        );
        console.log("FECHAS RECIBIDAS DEL BACKEND:", nextData);

        const nextDates = normalizeCalendarDates(nextData);
        if (nextDates.length > 0) {
          dates = nextDates;
          resolvedMonth = nextMonth;
        }
      }

      if (calendarRequestIds.current[phase] === requestId) {
        setAvailableDates((current) => ({
          ...current,
          [phase]: dates,
        }));
      }

      return resolvedMonth === currentViewMonth ? null : resolvedMonth;
    } catch (error) {
      if (calendarRequestIds.current[phase] === requestId) {
        setAvailableDates((current) => ({
          ...current,
          [phase]: [],
        }));
        setSearchError(
          error instanceof Error
            ? error.message
            : "No se pudieron consultar las fechas disponibles."
        );
      }
      return null;
    } finally {
      if (calendarRequestIds.current[phase] === requestId) {
        setLoadingAvailableDates(false);
      }
    }
  }, [
    searchData.DestinationID,
    searchData.OrigenID,
    searchData.seatTypeId,
    searchData.totalPassengers,
  ]);

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

      const response = await buscarVuelos(searchData);
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
      const response = await buscarVuelos(updatedSearchData);
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
    if (activeDropdown === "departure") {
      setSearchData((current) => ({
        ...current,
        departureDate: date,
        returnDate:
          current.returnDate && current.returnDate >= date
            ? current.returnDate
            : "",
      }));
      setActiveDropdown(searchData.tripType === "round" ? "return" : null);
      return;
    }

    setSearchData((current) => ({
      ...current,
      returnDate: date,
    }));
    setActiveDropdown(null);
  };

  const renderDateSelector = (phase, label, value, placeholder, className = "") => {
    const dropdown = phase === "departure" ? "departure" : "return";
    const isOpen = activeDropdown === dropdown;
    const isDisabled = phase === "return" && !searchData.departureDate;

    return (
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative w-full min-w-0 ${className} ${isOpen ? "z-40" : "z-0"}`}
      >
        <button
          type="button"
          aria-label={`${label}: ${formatSearchDate(value, placeholder)}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          disabled={isDisabled}
          onClick={() => {
            activateDropdown(dropdown);
          }}
          className={`flex w-full min-w-0 items-center gap-2 rounded-2xl border bg-white px-3 ${isExpanded ? "py-3" : "py-1.5"} text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#3333CC] ${
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
            onClick={(event) => event.stopPropagation()}
            className={`absolute top-full z-50 mt-2 w-[min(420px,calc(100vw-2rem))] ${
              phase === "return" ? "right-0" : "left-0"
            }`}
          >
            <FlightDateRangeCalendar
              departureDate={searchData.departureDate}
              returnDate={searchData.returnDate}
              phase={phase}
              onSelect={handleCalendarSelect}
              onClose={() => setActiveDropdown(null)}
              availableDates={
                availableDates[phase]
              }
              loading={loadingAvailableDates}
              onMonthChange={loadCalendarMonth}
              emptyMessage="No hay vuelos programados en esta ruta para la cabina seleccionada."
              onClear={() => {
                setSearchData((current) => ({
                  ...current,
                  departureDate: "",
                  returnDate: "",
                }));
                setActiveDropdown("departure");
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
            ? `fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-2 pt-8 backdrop-blur-sm transition-opacity duration-300 ease-out sm:px-4 sm:pt-14 ${
                isExpansionVisible
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`
            : ""
        }
      >
        <div
          ref={searchModalRef}
          className={`${
            isExpanded
              ? `w-full transition-all duration-300 ease-out ${
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
              ? "w-full"
              : "mt-0 md:-mt-16 lg:-mt-23 mx-4 sm:mx-6 lg:mx-12 xl:mx-25"
          }`}
        >
          <div className={`relative mx-auto w-full rounded-3xl border border-white/70 bg-white px-3 py-1.5 shadow-[0_15px_45px_rgba(51,51,153,0.25),0_0_35px_rgba(140,155,255,0.25)] ${
            isExpanded
              ? "w-[calc(100%-1.5rem)] max-w-[96vw] rounded-3xl p-4 shadow-2xl transition-all duration-300 ease-out sm:w-[calc(100%-3rem)] sm:p-6"
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
            <div className={`flex items-center gap-3 border-b border-gray-100 ${isExpanded ? "mb-4 pb-4" : "mb-2 pb-2"}`}>
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
                    p-1
                    shadow-inner
                  "
                >
                  {/* Ida y vuelta */}
                  <button
                    type="button"
                    onClick={() => {
                      activateDropdown(null);
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
                      px-3 py-2
                      text-xs sm:text-sm
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
                      activateDropdown(null);
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
                      px-3 py-2
                      text-xs sm:text-sm
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
              className={`grid w-full min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-12 ${isExpanded ? "lg:gap-3" : ""}`}
            >
              {/* Origen */}
              <div className="min-w-0 sm:col-span-1 lg:col-span-2">
                <AirportCombobox
                  label="Origen"
                  icon={PlaneTakeoff}
                  compact={!isExpanded}
                  airports={airports}
                  value={searchData.OrigenID}
                  active={activeDropdown === "origin"}
                  onFocus={() => activateDropdown("origin")}
                  onClose={() => setActiveDropdown(null)}
                  placeholder={loadingAirports ? "Cargando aeropuertos..." : "Selecciona origen"}
                  disabled={loadingAirports || Boolean(airportsError)}
                  onChange={(airportId) => {
                    setActiveDropdown("destination");
                    setSearchData((current) => ({
                      ...current,
                      OrigenID: airportId,
                      DestinationID:
                        Number(current.DestinationID) === Number(airportId)
                          ? 0
                          : current.DestinationID,
                      departureDate:
                        Number(current.OrigenID) === Number(airportId)
                          ? current.departureDate
                          : "",
                      returnDate:
                        Number(current.OrigenID) === Number(airportId)
                          ? current.returnDate
                          : "",
                    }));
                  }}
                />
              </div>


              {/* Destino */}
              <div className="min-w-0 sm:col-span-1 lg:col-span-2">
                <AirportCombobox
                  label="Destino"
                  icon={PlaneLanding}
                  compact={!isExpanded}
                  airports={airports.filter((airport) => Number(airport.id) !== Number(searchData.OrigenID))}
                  value={searchData.DestinationID}
                  active={activeDropdown === "destination"}
                  onFocus={() => activateDropdown("destination")}
                  onClose={() => setActiveDropdown(null)}
                  placeholder={loadingAirports ? "Cargando aeropuertos..." : "Selecciona destino"}
                  disabled={loadingAirports || Boolean(airportsError)}
                  onChange={(airportId) => {
                    setActiveDropdown("departure");
                    setSearchData((current) => ({
                      ...current,
                      DestinationID: airportId,
                      departureDate:
                        Number(current.DestinationID) === Number(airportId)
                          ? current.departureDate
                          : "",
                      returnDate:
                        Number(current.DestinationID) === Number(airportId)
                          ? current.returnDate
                          : "",
                    }));
                  }}
                />
              </div>


              {/* Salida */}
              {renderDateSelector("departure", "Salida", searchData.departureDate, "Selecciona tu salida", "lg:col-span-2")}

              {/* Regreso */}
              {searchData.tripType === "round" &&
                renderDateSelector("return", "Regreso", searchData.returnDate, "Selecciona tu regreso", "lg:col-span-2")}

              <div className="min-w-0 lg:col-span-2">
                <PassengerClassSelector
                  value={searchData}
                  compact={!isExpanded}
                  active={activeDropdown === "passengers"}
                  onFocus={() => activateDropdown("passengers")}
                  onClose={() => setActiveDropdown(null)}
                  onChange={(selection) =>
                    (
                      setSearchData((current) => ({
                        ...current,
                        ...selection,
                        departureDate: "",
                        returnDate: "",
                      })),
                      setActiveDropdown(null)
                    )
                  }
                />
              </div>

              {/* Botón Buscar */}
              <button
                type="button"
                onClick={() => {
                  openExpandedSearch();
                  handleSearch();
                }}
                className={`min-w-0 w-full rounded-full bg-slate-950/80 px-5 ${isExpanded ? "min-h-[52px] py-3" : "py-1.5"} text-white hover:bg-slate-900/90 flex items-center justify-center gap-3 text-xs sm:text-sm transition-colors shadow-lg shadow-slate-950/20 backdrop-blur-xl whitespace-nowrap lg:col-span-2`}
              >
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
