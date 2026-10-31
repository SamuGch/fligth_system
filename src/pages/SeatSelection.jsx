
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plane,
  X,
  UserRound,
  ArrowRight,
  ArrowLeft,
  Crown,
  Star,
  Armchair,
  Check,
} from "lucide-react";
import { obtenerTiposAsiento } from "../services/asientoService";
import { createTemporaryReservation } from "../services/apiClient";
import { reservationErrorMessage } from "../services/reservationErrors";
import { invalidateTripsCache } from "../services/tripsCache";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/auth/AuthModal";
import MainNavbar from "../components/MainNavbar";
import * as Api from "../tools/Api";
import {
  formatFlightLocation,
  formatFlightOperator,
  getFlightMetadata,
} from "../tools/flightFormatting";

const CABIN_THEMES = [
  { name: "violet", icon: Crown },
  { name: "amber", icon: Star },
  { name: "emerald", icon: Armchair },
];
const SEAT_SELECTION_INTENT_KEY = "airtravel_seat_selection_intent";

function readSeatSelectionIntent() {
  try {
    const stored = sessionStorage.getItem(SEAT_SELECTION_INTENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function adaptarAsiento(asiento, tiposAsiento, vueloId) {
  const tipoAsientoId =
    asiento.tipoAsientoId ?? asiento.tipo_asiento_id;
  const tipo = tiposAsiento.find(
    (item) => Number(item.id) === Number(tipoAsientoId),
  );
  const nombreClase =
    asiento.tipoAsiento ?? tipo?.nombre ?? tipo?.name ?? "Sin clase";
  const estado = String(asiento.estado ?? "").toUpperCase();
  const ocupado =
    asiento.ocupado === true ||
    ["OCUPADO", "CONFIRMADO"].includes(estado);
  const reservado = ["RESERVADO", "BLOQUEADO"].includes(estado);
  const disponible = asiento.disponible === true;
  const activo = disponible === true && !ocupado && !reservado;
  const status = ocupado
    ? "Ocupado"
    : reservado
      ? "Reservado"
      : activo
        ? "Disponible"
        : "No disponible";
  const databaseId =
    asiento.vueloAsientoId ?? asiento.id ?? asiento.asientoId;

  return {
    id: String(asiento.numero),
    databaseId,
    vueloAsientoId: asiento.vueloAsientoId ?? databaseId,
    selectionId: `${vueloId}-${databaseId}`,
    vueloId,
    avionId: asiento.avionId ?? asiento.avion_id,
    row: Number(asiento.fila),
    letter: String(asiento.letra),
    classId: String(tipoAsientoId ?? nombreClase),
    classLabel: nombreClase,
    tipoAsientoId,
    price: Number(asiento.precio ?? asiento.price ?? 0),
    activo,
    ocupado,
    reservado,
    status,
  };
}

function getSegmentFlightId(segment) {
  return segment?.flightId ?? segment?.vueloId ?? segment?.id;
}

function getFarePrice(flight, seatTypeId) {
  const fare = flight?.prices?.find(
    (item) => Number(item.seatTypeId) === Number(seatTypeId),
  );
  const price = Number(flight?.price ?? fare?.price ?? flight?.prices?.[0]?.price);
  return Number.isFinite(price) ? price : 0;
}

function normalizeLegs(state) {
  const addFlightSegments = (flight, direction) => {
    if (!flight) return [];
    const segments = Array.isArray(flight.segments) && flight.segments.length
      ? flight.segments
      : [flight];

    return segments.map((segment, index) => ({
      ...segment,
      vueloId: getSegmentFlightId(segment),
      origen: segment.origen ?? segment.origin,
      destino: segment.destino ?? segment.destination,
      flightNumber: segment.flightNumber ?? flight.flightNumber,
      avionId: segment.avionId ?? segment.avion_id ?? flight.avionId,
      price: segment.price ?? flight.price,
      prices: segment.prices ?? flight.prices,
      departureDate: segment.departureDate ?? flight.departureDate,
      direction,
      segmentIndex: index,
    }));
  };

  if (state?.outboundFlight || state?.returnFlight) {
    return [
      ...addFlightSegments(state.outboundFlight, "Ida"),
      ...addFlightSegments(state.returnFlight, "Vuelta"),
    ];
  }

  return addFlightSegments(state?.flight, "Ida");
}

const SEAT_STYLES = {
  Disponible: {
    base: "bg-emerald-100 border-emerald-500 text-emerald-800",
    back: "bg-emerald-300 border-emerald-500",
    arms: "bg-emerald-400",
  },
  Seleccionado: {
    base: "bg-violet-200 border-violet-700 text-violet-950",
    back: "bg-violet-500 border-violet-700",
    arms: "bg-violet-600",
  },
  Reservado: {
    base: "bg-amber-100 border-amber-500 text-amber-800",
    back: "bg-amber-300 border-amber-500",
    arms: "bg-amber-400",
  },
  Ocupado: {
    base: "bg-rose-100 border-rose-500 text-rose-800",
    back: "bg-rose-300 border-rose-500",
    arms: "bg-rose-400",
  },
  "No disponible": {
    base: "bg-slate-100 border-slate-400 text-slate-500",
    back: "bg-slate-300 border-slate-400",
    arms: "bg-slate-400",
  },
};

const currency = (amount) =>
  `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;

const createPaymentDeadline = () => Date.now() + 5 * 60 * 1000;

function Seat({ seat, selected, onClick }) {
  const status = selected ? "Seleccionado" : seat.status;
  const colors = SEAT_STYLES[status] ?? SEAT_STYLES["No disponible"];
  const disabled = !selected && (!seat.seatTypeAllowed || seat.status !== "Disponible");
  const unavailableClass = !seat.seatTypeAllowed ? "opacity-45" : "";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(seat)}
      title={`${seat.id} · ${seat.classLabel} · ${status} · Q${seat.price}${seat.seatTypeAllowed ? "" : " · Clase no seleccionada"}`}
      aria-label={`Asiento ${seat.id}, ${seat.classLabel}, ${status}`}
      aria-pressed={selected}
      className={`
        group relative flex h-8 min-w-0 flex-1 sm:h-12 sm:w-11 sm:flex-none
        items-end justify-center rounded-lg
        transition-transform duration-150
        focus-visible:outline-2 focus-visible:outline-violet-700
        focus-visible:outline-offset-2
        ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:-translate-y-1"}
        ${selected ? "scale-105" : ""}
        ${unavailableClass}
      `}
    >
      <span
        className={`
          absolute left-0.5 right-0.5 top-0 h-3 sm:left-1 sm:right-1 sm:h-4
          rounded-t-lg border shadow-sm sm:border-2
          ${colors.back}
        `}
      />
      <span
        className={`
          absolute bottom-1 left-0 h-4 w-1 sm:h-6 sm:w-1.5
          rounded-md ${colors.arms}
        `}
      />
      <span
        className={`
          absolute bottom-1 right-0 h-4 w-1 sm:h-6 sm:w-1.5
          rounded-md ${colors.arms}
        `}
      />
      <span
        className={`
          relative z-10 mb-1 flex h-5 w-[18px] sm:h-7 sm:w-8
          items-center justify-center rounded-md
          border shadow-sm sm:border-2
          ${colors.base}
        `}
      >
        {selected ? (
          <Check size={12} strokeWidth={3} className="sm:hidden" />
        ) : status === "Ocupado" ? (
          <X size={11} strokeWidth={2.5} className="sm:hidden" />
        ) : (
          <span className="text-[8px] font-bold sm:hidden">{seat.letter}</span>
        )}
        {selected ? (
          <Check size={15} strokeWidth={3} className="hidden sm:block" />
        ) : status === "Ocupado" ? (
          <X size={14} strokeWidth={2.5} className="hidden sm:block" />
        ) : (
          <span className="hidden text-[10px] font-bold sm:block">
            {seat.letter}
          </span>
        )}
      </span>
    </button>
  );
}

function SeatLegend() {
  const statuses = [
    ["Disponible", "bg-emerald-400"],
    ["Seleccionado", "bg-violet-500"],
    ["Reservado", "bg-amber-400"],
    ["Ocupado", "bg-rose-400"],
    ["No disponible", "bg-slate-400"],
  ];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3">
      {statuses.map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`h-5 w-5 rounded-t-lg rounded-b-md border-2 border-white shadow-sm ${color}`}
          />
          <span className="text-xs text-slate-600">{label}</span>
        </div>
      ))}
    </div>
  );
}

function CabinSection({
  section,
  seats,
  selectedSeats,
  onSeatClick,
  displayPrice,
}) {
  const Icon = section.icon;
  const sectionSeats = seats.filter((seat) => seat.classId === section.id);
  const seatMap = new Map(
    sectionSeats.map((seat) => [`${seat.row}-${seat.letter}`, seat]),
  );

  const rows = Array.from(
    { length: section.end - section.start + 1 },
    (_, index) => section.start + index,
  );

  const letters = [...section.columns].sort();
  const middle = Math.ceil(letters.length / 2);
  const leftLetters = letters.slice(0, middle);
  const rightLetters = letters.slice(middle);

  const renderPosition = (row, letter) => {
    const seat = seatMap.get(`${row}-${letter}`);

    if (!seat) {
      return (
        <div
          key={`${row}-${letter}`}
          className="h-8 min-w-0 flex-1 sm:h-12 sm:w-11 sm:flex-none"
        />
      );
    }

    return (
      <Seat
        key={seat.selectionId}
        seat={seat}
        selected={selectedSeats.some(
          (item) => item.selectionId === seat.selectionId,
        )}
        onClick={onSeatClick}
      />
    );
  };

  return (
    <section className="mx-auto w-full py-4 sm:py-7">
      <div
        className="mb-5 rounded-xl border border-violet-200
                   bg-violet-50 px-2 py-3 text-center sm:mb-6 sm:px-6 sm:py-4"
      >
        <div className="flex items-center justify-center gap-2 text-[#3b2b7a]">
          <Icon size={17} className="shrink-0 sm:h-[19px] sm:w-[19px]" />
          <h3 className="text-sm font-bold sm:text-base">{section.label}</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Filas {section.start}–{section.end}
        </p>
        <p className="mt-2 text-sm font-bold text-violet-800">
          {currency(displayPrice ?? section.price)} por asiento
        </p>
      </div>

      <div className="mb-2 flex items-center gap-1 sm:mb-3 sm:justify-center sm:gap-2">
        <span className="w-3.5 sm:w-7" />
        <div className="flex min-w-0 flex-1 gap-0.5 sm:flex-none sm:gap-2">
          {leftLetters.map((letter) => (
            <span key={letter} className="min-w-0 flex-1 text-center text-[9px] font-semibold text-slate-500 sm:flex-none sm:w-11 sm:text-xs">
              {letter}
            </span>
          ))}
        </div>
        <span className="w-5 sm:w-14" />
        <div className="flex min-w-0 flex-1 gap-0.5 sm:flex-none sm:gap-2">
          {rightLetters.map((letter) => (
            <span key={letter} className="min-w-0 flex-1 text-center text-[9px] font-semibold text-slate-500 sm:flex-none sm:w-11 sm:text-xs">
              {letter}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {rows.map((row) => (
          <div key={row} className="flex w-full items-center gap-1 sm:justify-center sm:gap-2">
            <span className="w-3.5 text-right text-[9px] font-bold text-slate-400 sm:w-7 sm:text-xs">
              {row}
            </span>
            <div className="flex min-w-0 flex-1 gap-0.5 sm:flex-none sm:gap-2">
              {leftLetters.map((letter) => renderPosition(row, letter))}
            </div>
            <div className="flex w-5 shrink-0 items-center justify-center sm:w-14">
              <span className="rounded-md bg-white/80 px-1 py-0.5 text-[9px] font-semibold text-slate-400 sm:px-2 sm:py-1 sm:text-xs">
                {row}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 gap-0.5 sm:flex-none sm:gap-2">
              {rightLetters.map((letter) => renderPosition(row, letter))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, session } = useAuth();
  const [savedIntent] = useState(() => readSeatSelectionIntent());
  const searchData = useMemo(
    () => location.state?.searchData ?? savedIntent?.searchData ?? {},
    [location.state?.searchData, savedIntent?.searchData],
  );
  const targetSeatTypeId = Number(searchData.seatTypeId) || 2;
  const totalPassengers = Math.max(
    1,
    Number(searchData.totalPassengers) || 1,
  );
  const legs = useMemo(() => normalizeLegs(location.state), [location.state]);
  const selectedFlight = useMemo(
    () => location.state?.flight ?? location.state?.outboundFlight ?? legs[0] ?? {},
    [location.state?.flight, location.state?.outboundFlight, legs],
  );
  const flight = useMemo(
    () => ({
      ...selectedFlight,
      departureTime: selectedFlight.departureTime ?? selectedFlight.departure,
      arrivalTime: selectedFlight.arrivalTime ?? selectedFlight.arrival,
    }),
    [selectedFlight],
  );
  const [selectedSeatsByFlight, setSelectedSeatsByFlight] = useState(
    () => savedIntent?.selectedSeatsByFlight ?? {},
  );
  const [asientos, setAsientos] = useState([]);
  const [activeFlightIndex, setActiveFlightIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reserving, setReserving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(false);
  const reservationAttemptedRef = useRef(false);

  useEffect(() => {
    let cancelado = false;

    async function cargarAsientos() {
      setLoading(true);
      setError("");
      setAsientos([]);

      try {
        if (legs.length === 0) {
          throw new Error("No se recibieron vuelos para cargar sus asientos.");
        }

        const [respuestas, tiposAsiento] = await Promise.all([
          Promise.all(
            legs.map((vuelo) =>
              Api.get(`/vuelo/${getSegmentFlightId(vuelo)}/asientos`),
            ),
          ),
          obtenerTiposAsiento(),
        ]);

        const asientosOrdenados = respuestas
          .flatMap((respuesta, index) => {
            const asientosVuelo = Array.isArray(respuesta)
              ? respuesta
              : respuesta?.asientos ?? [];

            return asientosVuelo.map((asiento) => {
              const normalizedSeat = adaptarAsiento(
                asiento,
                tiposAsiento,
                getSegmentFlightId(legs[index]),
              );
              return {
                ...normalizedSeat,
                seatTypeAllowed:
                  Number(normalizedSeat.tipoAsientoId) === targetSeatTypeId,
              };
            });
          })
          .sort(
            (a, b) =>
              a.vueloId - b.vueloId ||
              a.row - b.row ||
              a.letter.localeCompare(b.letter),
          );

        if (!cancelado) setAsientos(asientosOrdenados);
      } catch (err) {
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron obtener los asientos.",
          );
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    void cargarAsientos();

    return () => {
      cancelado = true;
    };
  }, [legs, targetSeatTypeId]);

  const activeSegment = legs[activeFlightIndex];
  const activeFlightId = getSegmentFlightId(activeSegment);
  const selectedSeats = selectedSeatsByFlight[activeFlightId] ?? [];
  const asientosDelSegmento = useMemo(
    () =>
      asientos.filter(
        (seat) =>
          String(seat.vueloId) === String(getSegmentFlightId(activeSegment)),
      ),
    [asientos, activeSegment],
  );

  const sections = useMemo(() => {
    const grouped = new Map();

    asientosDelSegmento.forEach((seat) => {
      const key = seat.classId ?? "sin-clase";
      let section = grouped.get(key);

      if (!section) {
        section = {
          id: key,
          label: seat.classLabel,
          start: seat.row,
          end: seat.row,
          columns: new Set(),
          price: seat.price,
        };
        grouped.set(key, section);
      }

      section.start = Math.min(section.start, seat.row);
      section.end = Math.max(section.end, seat.row);
      section.columns.add(seat.letter);
    });

    return Array.from(grouped.values())
      .map((section, index) => {
        const theme = CABIN_THEMES[index % CABIN_THEMES.length];
        return {
          ...section,
          columns: Array.from(section.columns).sort((a, b) =>
            a.localeCompare(b),
          ),
          icon: theme.icon,
          theme: theme.name,
          displayPrice: getFarePrice(activeSegment, targetSeatTypeId),
        };
      })
      .sort((a, b) => a.start - b.start);
  }, [asientosDelSegmento, activeSegment, targetSeatTypeId]);

  const handleSeatClick = (seat) => {
    setMessage("");
    if (
      !seat.seatTypeAllowed ||
      !seat.activo ||
      seat.ocupado ||
      (selectedSeats.length >= totalPassengers &&
        !selectedSeats.some((item) => item.selectionId === seat.selectionId))
    ) return;

    const existe = selectedSeats.some(
      (item) => item.selectionId === seat.selectionId,
    );
    const nextSeats = existe
      ? selectedSeats.filter((item) => item.selectionId !== seat.selectionId)
      : [...selectedSeats, seat];

    if (!existe && nextSeats.length === totalPassengers) {
      const nextIncompleteIndex = legs.findIndex(
        (leg, index) =>
          index > activeFlightIndex &&
          (selectedSeatsByFlight[getSegmentFlightId(leg)] ?? []).length < totalPassengers,
      );
      if (nextIncompleteIndex >= 0) setActiveFlightIndex(nextIncompleteIndex);
    }

    setSelectedSeatsByFlight((previous) => ({
      ...previous,
      [activeFlightId]: nextSeats,
    }));
  };

  const allSelectedSeats = useMemo(
    () => Object.values(selectedSeatsByFlight).flat(),
    [selectedSeatsByFlight],
  );
  const handleRemoveSeat = (seat) => {
    setSelectedSeatsByFlight((previous) => ({
      ...previous,
      [seat.vueloId]: (previous[seat.vueloId] ?? []).filter(
        (item) => item.selectionId !== seat.selectionId,
      ),
    }));
  };
  const everyLegComplete = useMemo(
    () => legs.length > 0 && legs.every(
      (leg) => (selectedSeatsByFlight[getSegmentFlightId(leg)] ?? []).length === totalPassengers,
    ),
    [legs, selectedSeatsByFlight, totalPassengers],
  );
  const subtotal = allSelectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const serviceFee = 0;
  const total = subtotal + serviceFee;

  const handleExit = () => {
    navigate("/seleccion-vuelos", {
      state: {
        searchData,
        searchResults: location.state?.searchResults,
        outboundFlight: location.state?.outboundFlight,
        returnFlight: location.state?.returnFlight,
        alternativeDates: location.state?.alternativeDates,
        returnFlights: location.state?.returnFlights,
        returnAlternativeDates: location.state?.returnAlternativeDates,
      },
    });
  };

  const reserveSelectedSeats = useCallback(async () => {
    if (!everyLegComplete || reserving) return;

    const clienteId = client?.id ?? client?.cliente_id ?? client?.clienteId;
    if (clienteId == null) {
      setMessage("No fue posible identificar tu perfil de cliente. Intenta iniciar sesión nuevamente.");
      return;
    }

    setReserving(true);
    setMessage("");

    try {
      const reservation = await createTemporaryReservation({
        clienteId,
        seatIds: allSelectedSeats.map((seat) => seat.vueloAsientoId),
      });

      if (reservation?.id == null) {
        throw new Error("Invalid reservation response");
      }

      invalidateTripsCache();

      navigate("/checkout", {
        state: {
          flight,
          outboundFlight: location.state?.outboundFlight,
          returnFlight: location.state?.returnFlight,
          searchData,
          passengers: totalPassengers,
          selectedSeats: allSelectedSeats,
          selectedSeatsByFlight,
          legs,
          reservation,
          paymentDeadline: createPaymentDeadline(),
        },
      });
      sessionStorage.removeItem(SEAT_SELECTION_INTENT_KEY);
    } catch (reservationError) {
      setMessage(reservationErrorMessage(reservationError, "reserve"));
    } finally {
      setReserving(false);
    }
  }, [
    allSelectedSeats,
    client,
    everyLegComplete,
    flight,
    legs,
    location.state,
    navigate,
    reserving,
    searchData,
    selectedSeatsByFlight,
    totalPassengers,
  ]);

  const handleContinue = () => {
    if (!everyLegComplete || reserving) return;
    if (!session) {
      sessionStorage.setItem(
        SEAT_SELECTION_INTENT_KEY,
        JSON.stringify({
          ...location.state,
          searchData,
          selectedSeatsByFlight,
        }),
      );
      setShowAuthModal(true);
      return;
    }
    void reserveSelectedSeats();
  };

  useEffect(() => {
    if (
      !session ||
      (!savedIntent && !pendingAuth) ||
      !everyLegComplete ||
      reserving
    ) return;
    if (reservationAttemptedRef.current) return;
    reservationAttemptedRef.current = true;
    sessionStorage.removeItem(SEAT_SELECTION_INTENT_KEY);
    void reserveSelectedSeats();
  }, [
    everyLegComplete,
    pendingAuth,
    reserving,
    reserveSelectedSeats,
    savedIntent,
    session,
  ]);


  return (
    <div
      className="relative flex h-screen w-full flex-col overflow-hidden bg-cover bg-center bg-fixed font-sans text-slate-800 px-4 pb-3 pt-3 sm:px-6"
      style={{ backgroundImage: 'url("/font.jpeg")' }}
    >
      <div className="fixed inset-0 z-0 bg-white/45 backdrop-blur-md pointer-events-none" />
      <div className="flex min-h-0 flex-1 flex-col">
        <MainNavbar className="!fixed !left-4 !right-4 !top-3 !mx-0 sm:!left-6 sm:!right-6 sm:!top-5 lg:!left-12 lg:!right-12 xl:!left-25 xl:!right-25" />

        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col pt-20 sm:pt-24">
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-[#3b2b7a]"
            >
              <ArrowLeft size={17} /> Volver a vuelos
            </button>
            <div className="hidden items-center gap-3 rounded-full border border-white/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md sm:flex">
              {["Vuelos", "Asientos", "Pasajeros", "Pago"].map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full ${
                      index === 0
                        ? "bg-emerald-600 text-white"
                        : index === 1
                        ? "bg-[#3b2b7a] text-white shadow-md"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {index === 0 ? <Check size={15} /> : index + 1}
                  </span>
                  {step}
                  {index < 3 && <ArrowRight size={14} />}
                </div>
              ))}
            </div>
          </div>

          <div
            className="grid min-h-0 flex-1 grid-cols-12 items-stretch gap-5"
          >
          {/* Columna izquierda */}
          <main className="col-span-12 flex min-h-0 min-w-0 flex-col lg:col-span-8">
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-3 shadow-[0_16px_45px_rgba(47,43,122,0.12)] backdrop-blur-md sm:p-4">
              <div
                className="mb-3 flex flex-col justify-between gap-2 rounded-2xl border border-white/80 bg-[#f0ecfa]/90 p-3 sm:flex-row sm:items-center"
              >
                <div>
                  <h2 className="text-lg font-bold text-[#21194d]">
                    Selecciona tus asientos
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Haz clic en los asientos disponibles
                    para cada pasajero
                  </p>
                </div>

                <SeatLegend />
              </div>

              <div className="shrink-0 bg-white pb-2">
              {legs.length > 1 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin" aria-label="Tramos del vuelo">
                  {legs.map((vuelo, index) => {
                    const flightId = getSegmentFlightId(vuelo);
                    const metadata = getFlightMetadata(vuelo);
                    const origin = formatFlightLocation(metadata.origin, vuelo.origen);
                    const destination = formatFlightLocation(metadata.destination, vuelo.destino);
                    const assigned = selectedSeatsByFlight[flightId]?.length ?? 0;
                    const complete = assigned === totalPassengers;
                    return (
                    <button
                      key={`${flightId}-${index}`}
                      type="button"
                      onClick={() => setActiveFlightIndex(index)}
                      aria-pressed={activeFlightIndex === index}
                      className={`min-w-56 shrink-0 rounded-xl border px-3 py-2 text-left transition-all sm:min-w-64 sm:px-3 ${
                        activeFlightIndex === index
                          ? "border-[#3b2b7a] bg-[#3b2b7a] text-white shadow-lg shadow-violet-200"
                          : "border-white/80 bg-white/85 text-slate-700 shadow-sm hover:border-violet-300 hover:bg-violet-50"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                        <span><Plane size={12} className="mr-1 inline" />{vuelo.direction}</span>
                        {complete ? <Check size={14} /> : <span className={activeFlightIndex === index ? "text-amber-200" : "text-amber-600"}>⚠</span>}
                      </span>
                      <span className="mt-1 block text-sm font-bold">
                        Tramo {index + 1}: {origin.code} → {destination.code}
                      </span>
                      <span className={`mt-1 block text-xs ${activeFlightIndex === index ? "text-white/75" : "text-slate-500"}`}>
                        {vuelo.departureDate ?? metadata.departure?.slice?.(0, 10) ?? "Fecha pendiente"} · {metadata.number ?? "Vuelo"} · {formatFlightOperator(vuelo)}
                      </span>
                      <span className={`mt-1 block text-[11px] ${activeFlightIndex === index ? "text-white/65" : "text-slate-400"}`}>
                        Terminal {metadata.terminal ?? "pendiente"} · Puerta {metadata.gate ?? "pendiente"}
                      </span>
                      <span className={`mt-1 block text-xs font-semibold ${complete ? (activeFlightIndex === index ? "text-emerald-200" : "text-emerald-700") : (activeFlightIndex === index ? "text-amber-200" : "text-amber-700")}`}>
                        {complete ? `✓ ${assigned}/${totalPassengers} seleccionado${totalPassengers === 1 ? "" : "s"}` : "⚠ Falta asiento"}
                      </span>
                    </button>
                    );
                  })}
                </div>
              )}
              </div>

              <div className="flex min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/70 bg-white/55 p-2 shadow-inner scrollbar-thin sm:p-3">
                <div
                  className="w-full min-w-0 rounded-2xl border border-white/80 bg-white/85 p-2 sm:p-4"
                  aria-busy={loading}
                >
                  {loading ? (
                    <p className="py-12 text-center text-slate-500">
                      Cargando asientos...
                    </p>
                  ) : error ? (
                    <p role="alert" className="py-12 text-center text-rose-700">
                      {error}
                    </p>
                  ) : asientosDelSegmento.length === 0 ? (
                    <p className="py-12 text-center text-slate-500">
                      Este tramo no tiene asientos registrados.
                    </p>
                  ) : (
                    <div className="mx-auto w-full min-w-0">
                      <div
                        className="mx-auto mb-4 flex h-24 w-full max-w-72
                                   items-end justify-center rounded-t-[100%]
                                   border-x-2 border-t-2 border-slate-300
                                   bg-gradient-to-b from-violet-100 to-white"
                      >
                        <div className="mb-4 flex flex-col items-center">
                          <Plane size={28} className="text-[#3b2b7a]" />
                          <span className="mt-2 text-xs font-semibold text-slate-500">
                            Parte delantera
                          </span>
                        </div>
                      </div>
                      <div
                        className="rounded-b-[3rem] border-x-2 border-b-2
                                   border-slate-300 bg-gradient-to-r
                                   from-slate-100 via-white to-slate-100
                                   px-1 pb-8 shadow-inner sm:px-6 sm:pb-10"
                      >
                        {sections.map((section) => (
                          <CabinSection
                            key={section.id}
                            section={section}
                            seats={asientosDelSegmento}
                            selectedSeats={selectedSeats}
                            onSeatClick={handleSeatClick}
                            displayPrice={section.displayPrice}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Navegación de cabina
                <aside className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("all")}
                    className={`w-full text-left px-3 py-3
                      rounded-xl text-xs font-semibold
                      cursor-pointer ${
                        activeSection === "all"
                          ? "bg-violet-100 text-violet-800"
                          : "hover:bg-slate-100 text-slate-600"
                      }`}
                  >
                    Todas las filas
                  </button>

                  {CABIN.map((section) => {
                    const Icon = section.icon;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() =>
                          setActiveSection(section.id)
                        }
                        className={`w-full flex items-start
                          gap-2 px-3 py-3 rounded-xl
                          text-left cursor-pointer ${
                            activeSection === section.id
                              ? "bg-violet-100 text-violet-800"
                              : "hover:bg-slate-100 text-slate-600"
                          }`}
                      >
                        <Icon size={17} />

                        <span>
                          <span
                            className="block text-xs font-bold"
                          >
                            {section.label}
                          </span>
                          <span className="text-xs opacity-70">
                            Filas {section.start}-{section.end}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </aside>*/}
              </div>

              {/* Referencias de la cabina 
              <div
                className="flex flex-wrap items-center
                           justify-center gap-6
                           mt-7 text-xs text-slate-500"
              >
                <span className="flex items-center gap-2">
                  <Users size={16} /> Baños
                </span>
                <span className="flex items-center gap-2">
                  <Coffee size={16} /> Cocina
                </span>
                <span className="flex items-center gap-2">
                  <DoorOpen size={16} />
                  Salida de emergencia
                </span>
              </div> */}
            </section>
          </main>

          {/* Columna derecha */}
          <aside className="col-span-12 min-h-0 min-w-0 lg:sticky lg:top-3 lg:col-span-4 lg:h-full">
            <div className="flex h-full max-h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-3 shadow-[0_16px_45px_rgba(47,43,122,0.12)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <h2 className="text-lg font-bold text-[#21194d]">
                Resumen de compra
              </h2>

              <span
                className="rounded-full bg-[#f0ecfa] text-[#3b2b7a]
                           px-3 py-1
                           text-xs font-semibold"
              >
                {allSelectedSeats.length} {allSelectedSeats.length === 1 ? "asiento" : "asientos"}
              </span>
            </div>

            <div className="mt-2 min-h-0">
              <h3 className="mb-1 text-sm font-bold text-[#21194d]">
                Asientos seleccionados
              </h3>

              <div className="max-h-28 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
                  {allSelectedSeats.length === 0 ? (
                    <div className="py-3 text-center text-slate-400">
                      <Armchair className="mx-auto mb-2 h-8 w-8" />
                      <p className="text-xs">
                        Selecciona tus asientos para continuar
                      </p>
                    </div>
                  ) : (
                    allSelectedSeats.map((seat, index) => (
                      <div
                        key={seat.selectionId}
                        className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 p-1.5 shadow-sm"
                      >
                        <div
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100
                                    flex items-center justify-center"
                        >
                          <UserRound size={17} className="text-violet-700" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">
                            Pasajero {index + 1} · {legs.find((leg) => String(getSegmentFlightId(leg)) === String(seat.vueloId))?.direction ?? "Tramo"}
                          </p>

                          <p className="truncate text-[11px] text-slate-500">
                            {seat.id} · {seat.classLabel}
                          </p>
                        </div>

                        <span className="text-xs font-bold text-[#21194d]">
                          {currency(seat.price)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveSeat(seat)}
                          aria-label={`Quitar asiento ${seat.id}`}
                          className="text-slate-400 hover:text-red-500
                                    cursor-pointer"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
            </div>

            <div             className="mt-2 rounded-xl border border-white/80 bg-white/70 p-2.5">
              <h3 className="mb-2 text-sm font-bold text-[#21194d]">
                Detalle de precios
              </h3>

              <div className="space-y-2">
                <div className="space-y-1.5 border-t border-slate-200 pt-2">
                  <div
                    className="flex justify-between
                               text-sm text-slate-600"
                  >
                    <span>Subtotal</span>
                    <span className="font-bold text-[#21194d]">
                      {currency(subtotal)}
                    </span>
                  </div>

                  <div
                    className="flex justify-between
                               text-sm text-slate-600"
                  >
                    <span>Cargo por servicio</span>
                    <span className="font-bold text-[#21194d]">
                      {currency(serviceFee)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-[#f0ecfa] px-3 py-2.5">
                <p className="font-bold text-[#3b2b7a]">
                  Total a pagar
                </p>

                <div className="text-right">
                  <p
                    className="text-lg font-extrabold text-[#3b2b7a]"
                  >
                    {currency(total)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Total simulado
                  </p>
                </div>
              </div>
            </div>

            {message && (
              <p
                role="alert"
                className="mt-4 text-sm text-rose-600"
              >
                {message}
              </p>
            )}

            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!everyLegComplete || loading || Boolean(error) || reserving}
                className="w-full bg-[#3b2b7a]
                           hover:bg-[#2b205c]
                           disabled:opacity-50
                           disabled:cursor-not-allowed
                           text-white rounded-2xl
                           py-3 font-semibold
                           flex items-center justify-center
                           gap-3 transition-colors
                           cursor-pointer"
              >
                {reserving ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Reservando asientos...
                  </>
                ) : (
                  <>
                    Continuar al pago
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExit}
                className="w-full text-slate-500
                           hover:text-[#3b2b7a]
                           flex items-center justify-center
                           gap-2 py-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                Volver a vuelos
              </button>
            </div>
            </div>
          </aside>
        </div>
      </div>
      </div>
      {showAuthModal && (
        <AuthModal
          mode="login"
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={() => {
            setPendingAuth(true);
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
}
