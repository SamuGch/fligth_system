import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCw,
  Users,
} from "lucide-react";
import MainNavbar from "../components/MainNavbar";
import NoFlightsFound from "../components/NoFlightsFound";
import { buscarVuelos } from "../services/flightService";
import {
  formatFlightLocation,
  formatFlightOperator,
  getFlightMetadata,
} from "../tools/flightFormatting";

function formatTime(value) {
  if (!value) return "--:--";
  return value.match(/(?:T|\s)(\d{2}:\d{2})/)?.[1] ?? value;
}

function formatDate(value, options = { weekday: "short", day: "2-digit", month: "short" }) {
  if (!value) return "Fecha por seleccionar";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("es-GT", options);
}

function formatPrice(value) {
  const price = Number(value);
  return Number.isFinite(price)
    ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
    : "Precio no disponible";
}

function flightPrice(flight) {
  const price = Number(flight?.price ?? flight?.prices?.[0]?.price);
  return Number.isFinite(price) ? price : 0;
}

function flightKey(flight) {
  return [
    flight?.flightNumber ?? flight?.numeroVuelo ?? "",
    flight?.departure ?? flight?.departureTime ?? "",
    flight?.arrival ?? flight?.arrivalTime ?? "",
    flight?.origin ?? "",
    flight?.destination ?? "",
  ].join("|");
}

function flightsFrom(results, direction = "outbound") {
  return results?.[direction]?.flights ?? results?.flights ?? [];
}

function getReturnFlights(data) {
  return data?.outbound?.flights ?? data?.inbound?.flights ?? data?.flights ?? [];
}

function getAirportLabel(searchData, flight, side) {
  const prefix = side === "origin" ? "origin" : "destination";
  const iata =
    searchData?.[`${prefix}Iata`] ??
    searchData?.[`${prefix}Code`] ??
    flight?.[`${prefix}Iata`] ??
    flight?.[`${prefix}Code`] ??
    flight?.[prefix] ??
    "";
  const city =
    searchData?.[`${prefix}City`] ??
    flight?.[`${prefix}City`] ??
    "";

  return { iata, city };
}

function DateRibbon({ dates, selectedDate, loadingDate, onSelect }) {
  if (!dates.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden">
      {dates.map((option) => {
        const selected = option.departureDate === selectedDate;
        const loading = option.departureDate === loadingDate;

        return (
          <button
            key={option.departureDate}
            type="button"
            disabled={selected || Boolean(loadingDate)}
            onClick={() => onSelect(option.departureDate)}
            className={`min-w-36 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-center text-slate-800 shadow-sm backdrop-blur-md transition ${
              selected
                ? "border-[#3b2b7a] bg-[#f0ecfa] text-[#3b2b7a] shadow-md"
                : "text-slate-600 hover:-translate-y-0.5 hover:border-[#3b2b7a]/50"
            } disabled:cursor-default`}
          >
            {loading ? (
              <RefreshCw className="mx-auto animate-spin" size={16} />
            ) : (
              <>
                <p className="font-semibold">
                  {formatDate(option.departureDate)}
                </p>
                <p className="mt-1 text-xs">
                  {option.price == null
                    ? "Precio no disponible"
                    : formatPrice(option.price)}
                </p>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SelectedFlightSummary({ flight, label, onEdit }) {
  const metadata = getFlightMetadata(flight);
  const origin = formatFlightLocation(metadata.origin);
  const destination = formatFlightLocation(metadata.destination);
  return (
    <article className="rounded-3xl border border-white/80 bg-white/90 p-4 text-slate-800 shadow-[0_16px_45px_rgba(47,43,122,0.12)] backdrop-blur-md sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-700">{label}</p>
            <p className="mt-1 font-bold text-slate-900">
              {origin.code} {formatTime(metadata.departure)} → {destination.code} {formatTime(metadata.arrival)}
            </p>
            <p className="text-xs text-slate-500">
              {metadata.number ?? "Vuelo seleccionado"} · {formatFlightOperator(flight)} · {formatPrice(flightPrice(flight))}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full px-3 py-2 text-sm font-semibold text-[#3b2b7a] hover:bg-[#f0ecfa]"
        >
          ✎ Editar selección
        </button>
      </div>
    </article>
  );
}

function RouteDivider({ label }) {
  return (
    <div className="my-9 flex items-center gap-3 px-2 text-[#3b2b7a]" aria-hidden="true">
      <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-[#3b2b7a]/10 via-[#3b2b7a]/45 to-[#3b2b7a]/10" />
      <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur-md">
        <PlaneTakeoff size={14} />
        <span>{label}</span>
        <Plane className="rotate-90" size={15} />
        <PlaneLanding size={14} />
      </div>
      <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-[#3b2b7a]/10 via-[#3b2b7a]/45 to-[#3b2b7a]/10" />
    </div>
  );
}

function FlightCard({ flight, selected, disabled, onSelect }) {
  const metadata = getFlightMetadata(flight);
  const origin = formatFlightLocation(metadata.origin, flight.origin);
  const destination = formatFlightLocation(metadata.destination, flight.destination);
  const segments = Array.isArray(flight.segments) ? flight.segments : [];
  const stops = Math.max(segments.length - 1, 0);

  return (
    <article
      className={`rounded-3xl border border-white/80 bg-white/90 p-4 text-slate-800 shadow-[0_16px_45px_rgba(47,43,122,0.12)] backdrop-blur-md transition sm:p-5 ${
        selected ? "border-emerald-400 ring-2 ring-emerald-100" : ""
      } ${disabled && !selected ? "opacity-60" : ""}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">{metadata.number ?? "Vuelo disponible"}</p>
          <p className="mt-1 text-sm text-slate-500">Operado por {formatFlightOperator(flight)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {metadata.aircraft ? `${metadata.aircraft} · ` : ""}Terminal {metadata.terminal ?? "pendiente"} · Puerta {metadata.gate ?? "pendiente"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          stops ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"
        }`}>
          {stops ? `${stops} ${stops === 1 ? "escala" : "escalas"}` : "Directo"}
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(4rem,auto)_minmax(0,1fr)] items-center gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatTime(metadata.departure)}</p>
          <p className="mt-1 break-words text-sm font-medium text-slate-700">{origin.name}</p>
          <p className="text-xs text-slate-500">{origin.code}</p>
        </div>
        <div className="min-w-0 text-center text-slate-500 sm:min-w-32">
          <p className="flex items-center justify-center gap-1 text-xs"><Clock3 size={14} /> {flight.duration ?? "Duración no disponible"}</p>
          <div className="my-2 border-t border-dashed border-slate-300" />
          <p className="text-xs">{stops ? `${stops} escala(s)` : "Vuelo directo"}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatTime(metadata.arrival)}</p>
          <p className="mt-1 break-words text-sm font-medium text-slate-700">{destination.name}</p>
          <p className="text-xs text-slate-500">{destination.code}</p>
        </div>
      </div>

      {flight.prices?.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Opciones de cabina</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {flight.prices.map((fare) => (
              <div key={fare.seatTypeId} className="rounded-2xl border border-white/70 bg-slate-50/80 px-3 py-3 text-slate-800 backdrop-blur-sm">
                <p className="truncate text-sm font-medium text-slate-800">{fare.seatType}</p>
                <p className="mt-1 text-sm font-bold text-[#3b2b7a]">{formatPrice(fare.price)}</p>
                <p className="text-xs text-slate-500">{fare.availableSeats == null ? "Disponibilidad no informada" : `${fare.availableSeats} asientos disponibles`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <p className="text-lg font-bold text-[#3b2b7a]">{formatPrice(flightPrice(flight))}</p>
        <button type="button" disabled={disabled} onClick={() => onSelect(flight)}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold text-white ${
            selected ? "bg-emerald-600" : "bg-[#3b2b7a] hover:bg-[#2c205e]"
          } disabled:cursor-not-allowed`}>
          {selected ? <><Check size={17} /> Seleccionado</> : <><Plane size={17} /> Seleccionar</>}
        </button>
      </div>
    </article>
  );
}

export default function FlightSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSearchData = location.state?.searchData;
  const [searchData, setSearchData] = useState(initialSearchData ?? {});
  const [searchResults, setSearchResults] = useState(location.state?.searchResults ?? {});
  const [alternativeDates, setAlternativeDates] = useState(location.state?.alternativeDates ?? []);
  const [selectedOutbound, setSelectedOutbound] = useState(
    location.state?.outboundFlight ?? null,
  );
  const [selectedReturn, setSelectedReturn] = useState(
    location.state?.returnFlight ?? null,
  );
  const [returnFlights, setReturnFlights] = useState(() =>
    location.state?.returnFlights?.length
      ? location.state.returnFlights
      : location.state?.returnFlight
        ? [location.state.returnFlight]
        : [],
  );
  const [returnAlternativeDates, setReturnAlternativeDates] = useState(
    location.state?.returnAlternativeDates ?? [],
  );
  const [step, setStep] = useState(
    location.state?.returnFlight ? "inbound" : "outbound",
  );
  const [loadingReturn, setLoadingReturn] = useState(
    initialSearchData?.tripType === "round" &&
      Boolean(initialSearchData?.returnDate) &&
      !location.state?.returnFlights?.length,
  );
  const [loadingDate, setLoadingDate] = useState("");
  const [error, setError] = useState("");

  const outboundFlights = useMemo(() => flightsFrom(searchResults), [searchResults]);
  const outboundOrigin = getAirportLabel(searchData, outboundFlights[0], "origin");
  const outboundDestination = getAirportLabel(searchData, outboundFlights[0], "destination");
  useEffect(() => {
    if (!initialSearchData) navigate("/", { replace: true });
  }, [initialSearchData, navigate]);

  useEffect(() => {
    if (
      initialSearchData?.tripType !== "round" ||
      !initialSearchData?.returnDate ||
      !loadingReturn
    ) return;
    let active = true;
    buscarVuelos({
      ...initialSearchData,
      OrigenID: initialSearchData.DestinationID,
      DestinationID: initialSearchData.OrigenID,
      departureDate: initialSearchData.returnDate,
    })
      .then((response) => {
        if (active) {
          setReturnFlights(getReturnFlights(response));
          setReturnAlternativeDates(
            response?.outbound?.alternativeDates ??
            response?.inbound?.alternativeDates ??
            response?.alternativeDates ??
            [],
          );
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message || "No se pudieron cargar los vuelos de regreso."); })
      .finally(() => { if (active) setLoadingReturn(false); });
    return () => { active = false; };
  }, [initialSearchData, loadingReturn]);

  const selectOutbound = (flight) => {
    setSelectedOutbound(flight);
    if (searchData.tripType === "round") {
      setStep("inbound");
    } else {
      setSelectedReturn(null);
    }
  };

  const loadReturnFlights = async (date) => {
    setLoadingDate(date);
    setError("");
    try {
      const nextSearchData = { ...searchData, returnDate: date };
      const response = await buscarVuelos({
        ...nextSearchData,
        OrigenID: nextSearchData.DestinationID,
        DestinationID: nextSearchData.OrigenID,
        departureDate: date,
      });
      setSearchData(nextSearchData);
      setReturnFlights(getReturnFlights(response));
      setReturnAlternativeDates(
        response?.outbound?.alternativeDates ??
        response?.inbound?.alternativeDates ??
        response?.alternativeDates ??
        [],
      );
      setSelectedReturn(null);
    } catch (requestError) {
      setError(requestError.message || "No se pudieron consultar los vuelos de regreso.");
    } finally {
      setLoadingDate("");
    }
  };

  const selectReturn = (flight) => {
    setSelectedReturn(flight);
  };

  const continueToSeats = () => {
    const state = {
      outboundFlight: selectedOutbound,
      returnFlight: selectedReturn,
      searchData,
      searchResults,
      alternativeDates,
      returnFlights,
      returnAlternativeDates,
    };
    navigate("/seleccion-asientos", { state });
  };

  const selectAlternativeDate = async (date) => {
    setLoadingDate(date);
    setError("");
    try {
      const nextSearchData = { ...searchData, departureDate: date };
      const response = await buscarVuelos(nextSearchData);
      setSearchData(nextSearchData);
      setSearchResults(response);
      setSelectedOutbound(null);
      setSelectedReturn(null);
      setStep("outbound");
      setAlternativeDates(response?.outbound?.alternativeDates ?? response?.alternativeDates ?? alternativeDates);
      navigate("/seleccion-vuelos", { replace: true, state: { searchData: nextSearchData, searchResults: response, alternativeDates } });
    } catch (requestError) {
      setError(requestError.message || "No se pudieron consultar los vuelos para esta fecha.");
    } finally {
      setLoadingDate("");
    }
  };

  const canContinue = Boolean(selectedOutbound) && (searchData.tripType !== "round" || Boolean(selectedReturn));
  const subtotal = flightPrice(selectedOutbound) + flightPrice(selectedReturn);
  const currentPrice = outboundFlights.length ? Math.min(...outboundFlights.map(flightPrice)) : null;
  const outboundDateOptions = [...alternativeDates.filter((item) => item?.departureDate !== searchData.departureDate), ...(searchData.departureDate ? [{ departureDate: searchData.departureDate, price: currentPrice }] : [])].sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  const inboundDateOptions = [
    ...returnAlternativeDates.filter(
      (item) => item?.departureDate !== searchData.returnDate,
    ),
    ...(searchData.returnDate
      ? [{ departureDate: searchData.returnDate, price: flightPrice(selectedReturn) || null }]
      : []),
  ].sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  const itinerarySummary = !selectedOutbound
    ? "Selecciona tu vuelo de ida"
    : searchData.tripType !== "round"
      ? `Ida: ${formatTime(selectedOutbound.departure)} → ${formatTime(selectedOutbound.arrival)}`
      : selectedReturn
        ? `Ida: ${formatTime(selectedOutbound.departure)} → ${formatTime(selectedOutbound.arrival)} | Regreso: ${formatTime(selectedReturn.departure)} → ${formatTime(selectedReturn.arrival)}`
        : `Ida: ${formatTime(selectedOutbound.departure)} → ${formatTime(selectedOutbound.arrival)} | Selecciona tu vuelo de regreso`;

  if (!initialSearchData) return null;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-cover bg-center bg-fixed font-sans text-slate-800"
      style={{ backgroundImage: 'url("/font.jpeg")' }}
    >
      <div className="fixed inset-0 z-0 bg-white/35 backdrop-blur-md pointer-events-none"></div>
      <MainNavbar className="!fixed !left-4 !right-4 !top-3 !mx-0 sm:!left-6 sm:!right-6 sm:!top-5 lg:!left-12 lg:!right-12 xl:!left-25 xl:!right-25" />
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-32 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => navigate("/")} className="flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-[#3b2b7a]"><ArrowLeft size={17} /> Modificar búsqueda</button>
          <div className="flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md sm:gap-3">
            {["Vuelos", "Asientos", "Pasajeros", "Pago"].map((step, index) => <div key={step} className="flex items-center gap-1.5 sm:gap-2"><span className={`grid h-7 w-7 place-items-center rounded-full ${index === 0 ? "bg-[#3b2b7a] text-white shadow-md" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span><span className="hidden sm:inline">{step}</span>{index < 3 && <ChevronRight className="text-slate-400" size={14} />}</div>)}
          </div>
        </div>

        <section className="rounded-3xl border border-white/80 bg-white/90 p-6 text-slate-800 shadow-[0_16px_45px_rgba(47,43,122,0.12)] backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b2b7a]">Tu búsqueda</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:text-base">
            <strong>
              {outboundOrigin.iata || searchData.OrigenID}
              {outboundOrigin.city && ` (${outboundOrigin.city})`}
              <span className="px-2 text-slate-400">⇄</span>
              {outboundDestination.iata || searchData.DestinationID}
              {outboundDestination.city && ` (${outboundDestination.city})`}
            </strong>
            <span className="flex items-center gap-2 text-slate-700"><CalendarDays size={16} /> {formatDate(searchData.departureDate)}{searchData.tripType === "round" && ` - ${formatDate(searchData.returnDate)}`}</span>
            <span className="flex items-center gap-2 text-slate-700"><Users size={16} /> {searchData.totalPassengers ?? 1} pasajeros</span>
          </div>
        </section>

        {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <section className="mt-8">
          {step === "outbound" || searchData.tripType !== "round" ? (
            <>
              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-900">Paso 1 de 2</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Selecciona tu vuelo de ida</h1>
                <p className="mt-1 font-medium text-slate-700">{formatDate(searchData.departureDate)}</p>
              </div>
              <section className="mb-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800"><CalendarDays size={17} /> Fechas de salida</h2>
                <DateRibbon dates={outboundDateOptions} selectedDate={searchData.departureDate} loadingDate={loadingDate} onSelect={selectAlternativeDate} />
              </section>
              {outboundFlights.length ? <div className="space-y-4">{outboundFlights.map((flight, index) => {
                const isSelected = flightKey(selectedOutbound) === flightKey(flight);
                return <FlightCard key={`${flight.flightNumber ?? "flight"}-${index}`} flight={flight} selected={isSelected} disabled={Boolean(selectedOutbound && !isSelected)} onSelect={selectOutbound} />;
              })}</div> : <NoFlightsFound onModifySearch={() => navigate("/")} />}
            </>
          ) : selectedOutbound ? (
            <SelectedFlightSummary
              flight={selectedOutbound}
              label="Vuelo de ida seleccionado"
              onEdit={() => {
                setSelectedOutbound(null);
                setStep("outbound");
              }}
            />
          ) : null}
        </section>

        {searchData.tripType === "round" && selectedOutbound && step === "inbound" && (
          <>
            <RouteDivider label="Tu itinerario" />
            <section className="mt-4">
            {!selectedReturn && (
              <>
                <div className="mb-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-900">Paso 2 de 2</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">Selecciona tu vuelo de regreso</h2>
                  <p className="mt-1 font-medium text-slate-700">{formatDate(searchData.returnDate)}</p>
                </div>
                <section className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800"><CalendarDays size={17} /> Fechas de regreso</h3>
                  <DateRibbon dates={inboundDateOptions} selectedDate={searchData.returnDate} loadingDate={loadingDate} onSelect={loadReturnFlights} />
                </section>
              </>
            )}
            {selectedReturn ? (
              <SelectedFlightSummary
                flight={selectedReturn}
                label="Vuelo de regreso seleccionado"
                onEdit={() => setSelectedReturn(null)}
              />
            ) : loadingReturn ? (
              <div className="flex items-center gap-2 rounded-xl bg-white p-6 text-slate-600">
                <RefreshCw className="animate-spin" size={18} /> Cargando vuelos de regreso...
              </div>
            ) : returnFlights.length ? (
              <div className="space-y-4">
                {returnFlights.map((flight, index) => (
                  <FlightCard
                    key={`${flight.flightNumber ?? "return"}-${index}`}
                    flight={flight}
                    selected={flightKey(selectedReturn) === flightKey(flight)}
                    disabled={Boolean(
                      selectedReturn &&
                      flightKey(selectedReturn) !== flightKey(flight),
                    )}
                    onSelect={selectReturn}
                  />
                ))}
              </div>
            ) : (
              <NoFlightsFound onModifySearch={() => navigate("/")} />
            )}
            </section>
          </>
        )}
      </main>

      <aside className="fixed inset-x-4 bottom-3 z-40 rounded-2xl border border-white/15 bg-slate-950/80 p-2.5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:inset-x-6 sm:bottom-5 sm:rounded-full sm:p-3 lg:inset-x-12 xl:inset-x-25">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
          <div className="min-w-0">
            <p className="text-sm text-slate-300">Resumen de compra</p>
            <p className="truncate font-semibold text-white">{itinerarySummary}</p>
          </div>
          <div className="flex items-center justify-between gap-5 sm:justify-end">
            <p className="text-xl font-bold text-white">${subtotal.toFixed(2)} USD</p>
            <button type="button" disabled={!canContinue} onClick={continueToSeats} className="flex min-h-9 items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-[#3b2b7a] shadow-lg hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Continuar a selección de asientos <ChevronRight size={17} /></button>
          </div>
        </div>
      </aside>
    </div>
  );
}
