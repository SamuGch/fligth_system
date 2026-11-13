import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Loader2,
  ChevronDown,
  CalendarDays,
  PlaneTakeoff,
  PlaneLanding
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { obtenerAeropuertos } from "../services/aeropuertoService";
import {
  buscarVuelos,
  obtenerFechasDisponibles,
  obtenerFechasDisponiblesRuta,
} from "../services/flightService";
import AirportCombobox from "./AirportCombobox";
import FlightDateRangeCalendar from "./FlightDateRangeCalendar";
import Toast from "./Toast";
import PassengerClassSelector from "./PassengerClassSelector";

function formatSearchDate(value, placeholder) {
  if (!value) return placeholder;

  const [year, month, day] = value.split("-");

  // Formato visual anterior: DD/MM/YYYY. El valor de la API sigue siendo YYYY-MM-DD.
  return `${day}/${month}/${year}`;
}

function normalizeCalendarDates(data, minimumDate = "") {
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
    .filter(
      (item) =>
        item.fecha &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.fecha) &&
        (!minimumDate || item.fecha >= minimumDate)
    );
}

const COMPLETED_RESERVATION_KEY = "airtravel_completed_reservation";

function getAirportId(airport) {
  return airport?.id ?? airport?.aeropuertoId;
}

export default function FlightSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpansionVisible, setIsExpansionVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const searchModalRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(true);
  const [airportsError, setAirportsError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [availableDates, setAvailableDates] = useState({
    departure: [],
    return: [],
  });
  const [loadingAvailableDates, setLoadingAvailableDates] = useState(false);
  const calendarRequestIds = useRef({
    departure: 0,
    return: 0,
  });

  const [searchData, setSearchData] = useState({
    tripType: "one",
    OrigenID: 0,
    DestinationID: 0,
    departureDate: "",
    returnDate: "",
    totalPassengers: 1,
    passengerDetails: { adults: 1, children: 0, infants: 0 },
  });
  const navigate = useNavigate();

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
      mesAnio: currentViewMonth,
    };
    const originId =
      phase === "departure" ? searchData.OrigenID : searchData.DestinationID;
    const destinationId =
      phase === "departure" ? searchData.DestinationID : searchData.OrigenID;
    const minimumDate =
      phase === "return" && searchData.departureDate
        ? searchData.departureDate
        : "";

    setLoadingAvailableDates(true);

    try {
      const data = await obtenerFechasDisponibles(
        originId,
        destinationId,
        request
      );
      let dates = normalizeCalendarDates(data, minimumDate);
      let resolvedMonth = currentViewMonth;

      if (dates.length === 0) {
        const routeDates = await obtenerFechasDisponiblesRuta(
          originId,
          destinationId,
          request
        );
        const firstAvailableDate = routeDates.find(
          (date) =>
            date >= `${currentViewMonth}-01` &&
            (!minimumDate || date >= minimumDate)
        );

        if (firstAvailableDate) {
          const nextMonth = firstAvailableDate.slice(0, 7);
          const nextData = await obtenerFechasDisponibles(
            originId,
            destinationId,
            { ...request, mesAnio: nextMonth }
          );
          dates = normalizeCalendarDates(nextData, minimumDate);
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
    searchData.departureDate,
    searchData.totalPassengers,
  ]);

  const handleSearch = async () => {
    if (searching) return;
    setSearchError("");
    setSearching(true);

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

      const oneWaySearchData = {
        ...searchData,
        tripType: "one",
        returnDate: "",
      };
      const response = await buscarVuelos(oneWaySearchData);
      sessionStorage.removeItem(COMPLETED_RESERVATION_KEY);
      navigate("/seleccion-vuelos", {
        state: {
          searchData: oneWaySearchData,
          searchResults: response,
          alternativeDates:
            response?.outbound?.alternativeDates ??
            response?.alternativeDates ??
            [],
        },
      });
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "No se pudieron buscar vuelos.",
      );
    } finally {
      setSearching(false);
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
          className={` flex h-[64px] min-h-0 w-full min-w-0 box-border items-center gap-3 rounded-2xl border border-[#DCE3EF] bg-white px-4 py-2 text-left transition-all duration-200 hover:border-[#3333CC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3333CC]/20 ${isOpen ? "border-[#3333CC] ring-2 ring-[#3333CC]/10" : ""} ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} `} >
          <CalendarDays className="h-7 w-7 shrink-0 text-[#455675]" />
          <span className="flex min-w-0 flex-1 flex-col justify-center text-left">
            <span className="mb-1 block text-xs font-normal normal-case tracking-normal leading-tight text-[#8292B0]">
              {label}
            </span>
            <span
              className={`block min-w-0 truncate whitespace-nowrap text-[14px] font-semibold leading-tight ${value ? "text-[#101936]" : "text-[#64748B]"
                }`}
            >
              {formatSearchDate(value, placeholder)}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#455675] transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>

        {isOpen && (
          <div
            onClick={(event) => event.stopPropagation()}
            className={`absolute top-full z-50 mt-2 w-[min(420px,calc(100vw-2rem))] ${phase === "return" ? "right-0" : "left-0"
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
              emptyMessage="No hay vuelos programados en esta ruta."
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
            ? `fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#151339]/55 px-2 pt-8 backdrop-blur-[6px] transition-opacity duration-300 ease-out sm:px-4 sm:pt-14 ${isExpansionVisible
              ? "opacity-100"
              : "pointer-events-none opacity-0"
            }`
            : ""
        }
      >
        <div
          ref={searchModalRef}
          className={`${isExpanded
            ? `w-full transition-all duration-300 ease-out ${isExpansionVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-2 scale-95 opacity-0"
            }`
            : ""
            }`}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Search Widget */}
          <div
            className={`relative z-50 ${isExpanded
              ? "w-full"
              : "mt-6 mx-4 sm:mx-6 md:-mt-16 lg:-mt-23 lg:mx-12 xl:mx-25"
              }`}
          >
            <div className={`relative mx-auto w-full rounded-4xl border border-white/80 bg-white px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5 shadow-[0_18px_55px_rgba(51,51,153,0.20),0_0_30px_rgba(140,155,255,0.14)] ${isExpanded
              ? "w-[calc(100%-1.5rem)] max-w-[96vw] rounded-4xl p-4 shadow-[0_20px_65px_rgba(51,51,153,0.28)] transition-all duration-300 ease-out sm:w-[calc(100%-3rem)] sm:p-6"
              : ""
              }`}>
              {isExpanded && (
                <button
                  type="button"
                  onClick={closeExpandedSearch}
                  aria-label="Cerrar búsqueda enfocada"
                  className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-indigo-50 hover:text-[#333399] focus-visible:outline-2 focus-visible:outline-[#3333CC]"
                >
                  <span aria-hidden="true" className="text-xl leading-none">✕</span>
                </button>
              )}
              {/* Selector de tipo de viaje desactivado; botones conservados para uso futuro.
              <div className="mb-3 flex items-center gap-3 border-b border-[#E7EBF3] pb-3">
                <div className="w-full sm:w-auto">
                  <div
                    role="group"
                    aria-label="Tipo de viaje"
                    className="
                    flex w-full max-w-[290px] sm:w-[290px]
                    items-center
                    rounded-full
                    bg-[#E9E6F7]
                    p-1
                    shadow-[inset_0_1px_2px_rgba(51,51,153,0.08)]
                  "
                  >
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
                      px-3 sm:px-4 py-2 sm:py-2.5
                      text-[13px] sm:text-sm
                      whitespace-nowrap
                      transition-all duration-300 ease-in-out
                      ${searchData.tripType === "round"
                          ? "bg-[#333399] text-white font-semibold shadow-[0_6px_16px_rgba(51,51,153,0.22)]"
                          : "bg-transparent text-[#333399]/75 font-normal hover:text-[#333399]"
                        }
                    `}
                    >
                      Ida y vuelta
                    </button>

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
                      px-3 sm:px-4 py-2 sm:py-2.5
                      text-[13px] sm:text-sm
                      whitespace-nowrap
                      transition-all duration-300 ease-in-out
                      ${searchData.tripType === "one"
                          ? "bg-[#333399] text-white font-semibold shadow-[0_6px_16px_rgba(51,51,153,0.22)]"
                          : "bg-transparent text-[#333399]/75 font-normal hover:text-[#333399]"
                        }
                    `}
                    >
                      Solo ida
                    </button>
                  </div>
                </div>
              </div>
              */}

              {/* Bottom Row: Inputs */}
              <div
                className={`grid w-full min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 ${searchData.tripType === "round"
                  ? "xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)]"
                  : "xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)]"
                  }`}
              >
                {/* Origen */}
                <div className="min-w-0">
                  <AirportCombobox
                    label="Origen"
                    icon={PlaneTakeoff}
                    compact={false}
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
                <div className="min-w-0">
                  <AirportCombobox
                    label="Destino"
                    icon={PlaneLanding}
                    compact={false}
                    airports={airports.filter(
                      (airport) =>
                        Number(getAirportId(airport)) !==
                        Number(searchData.OrigenID)
                    )}
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
                {renderDateSelector("departure", "Salida", searchData.departureDate, "dd/mm/yyyy", "")}

                {/* Regreso */}
                {searchData.tripType === "round" &&
                  renderDateSelector("return", "Regreso", searchData.returnDate, "dd/mm/yyyy", "")}

                <div className="min-w-0">
                  <PassengerClassSelector
                    value={searchData}
                    compact={false}
                    active={activeDropdown === "passengers"}
                    onFocus={() => activateDropdown("passengers")}
                    onClose={() => setActiveDropdown(null)}
                    onChange={(selection) => {
                      setSearchData((current) => ({
                        ...current,
                        ...selection,
                      }));
                      setActiveDropdown(null);
                    }}
                  />
                </div>

                {/* Botón Buscar */}
                <button
                  type="button"
                  disabled={searching || loadingAirports || Boolean(airportsError)}
                  onClick={() => {
                    openExpandedSearch();
                    void handleSearch();
                  }}

                  className=" inline-flex h-[64px] min-h-0 w-full min-w-0 box-border items-center justify-center gap-2 rounded-full bg-[#333399] px-4 py-2 text-[15px] font-semibold text-white whitespace-nowrap shadow-[0_8px_20px_rgba(51,51,153,0.24)] hover:bg-[#2D2DA8] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 " >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span className="font-semibold">{searching ? "Cargando..." : "Buscar vuelos"}</span>
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

    </>
  );
}
