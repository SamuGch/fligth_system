
import { useEffect, useMemo, useState } from "react";
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
  Clock3,
} from "lucide-react";
import { obtenerTiposAsiento } from "../services/asientoService";
import { createTemporaryReservation } from "../services/apiClient";
import { reservationErrorMessage } from "../services/reservationErrors";
import { invalidateTripsCache } from "../services/tripsCache";
import { useAuth } from "../context/AuthContext";
import MainNavbar from "../components/MainNavbar";
import * as Api from "../tools/Api"

const CABIN_THEMES = [
  { name: "violet", icon: Crown },
  { name: "amber", icon: Star },
  { name: "emerald", icon: Armchair },
];

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
  const disponible =
    asiento.disponible ??
    (asiento.activo === true || estado === "DISPONIBLE");
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
  return segment.flightId ?? segment.vueloId ?? segment.id;
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
  `Q${amount.toLocaleString("es-GT")}`;

const createPaymentDeadline = () => Date.now() + 5 * 60 * 1000;

function Seat({ seat, selected, onClick }) {
  const status = selected ? "Seleccionado" : seat.status;
  const colors = SEAT_STYLES[status] ?? SEAT_STYLES["No disponible"];
  const disabled = !selected && seat.status !== "Disponible";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(seat)}
      title={`${seat.id} · ${seat.classLabel} · ${status} · Q${seat.price}`}
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
          {currency(section.price)} por asiento
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

function FlightInfo({ flight }) {
  const stopCount = Math.max(
    Number(flight.stops) || 0,
    (flight.segments?.length ?? 1) - 1,
  );

  return (
    <div
      className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur-md sm:p-7
                 flex flex-col lg:flex-row
                 lg:items-center gap-6"
    >
      <div className="flex min-w-0 items-center gap-3 lg:min-w-48 lg:gap-4">
        <div
          className="w-16 h-16 rounded-2xl bg-violet-50
                     flex items-center justify-center"
        >
          <Plane
            size={31}
            className="text-[#3b2b7a]"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {flight.airline}
          </h3>
          <p className="text-sm text-slate-500">
            {flight.flightNumber}
          </p>
        </div>
      </div>

      <div className="hidden lg:block h-16 w-px bg-slate-200" />

      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(4rem,0.8fr)_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-xl font-bold text-slate-900 sm:text-2xl">
            {flight.departureTime}
          </p>
          <p className="font-semibold text-[#3b2b7a]">
            {flight.origin}
          </p>
          <p className="wrap-break-word text-xs text-slate-500">
            {flight.originCity}
          </p>
        </div>

        <div className="min-w-0 text-center">
          <p className="text-xs text-slate-500 mb-2">
            <Clock3 size={12} className="inline mr-1" />
            {flight.duration}
          </p>

          <div className="flex items-center gap-2">
            <Plane
              size={18}
              className="text-violet-400 rotate-90"
            />
            <div className="border-t-2 border-dashed
                            border-violet-200 flex-1" />
            <Plane
              size={18}
              className="text-violet-400 rotate-90"
            />
          </div>

          <p className="text-xs text-slate-500 mt-2">
            {stopCount > 0 ? `${stopCount} escala(s)` : "Vuelo directo"}
          </p>
        </div>

        <div className="min-w-0 text-right">
          <p className="text-xl font-bold text-slate-900 sm:text-2xl">
            {flight.arrivalTime}
          </p>
          <p className="font-semibold text-[#3b2b7a]">
            {flight.destination}
          </p>
          <p className="break-words text-xs text-slate-500">
            {flight.destinationCity}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { client } = useAuth();
  const selectedFlight = location.state?.flight ?? {};
  const flight = {
    ...selectedFlight,
    departureTime: selectedFlight.departureTime ?? selectedFlight.departure,
    arrivalTime: selectedFlight.arrivalTime ?? selectedFlight.arrival,
  };
  const vuelos = useMemo(() => {
    const seleccion = location.state?.flight;
    if (seleccion?.segments?.length) return seleccion.segments;
    return seleccion?.vueloId ? [seleccion] : [];
  }, [location.state?.flight]);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add("scrollbar-hidden");
    body.classList.add("scrollbar-hidden");

    return () => {
      root.classList.remove("scrollbar-hidden");
      body.classList.remove("scrollbar-hidden");
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function cargarAsientos() {
      setLoading(true);
      setError("");
      setAsientos([]);
      setSelectedSeats([]);

      try {
        if (vuelos.length === 0) {
          throw new Error("No se recibieron vuelos para cargar sus asientos.");
        }

        const [respuestas, tiposAsiento] = await Promise.all([
          Promise.all(
            vuelos.map((vuelo) =>
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

            return asientosVuelo.map((asiento) =>
              adaptarAsiento(
                asiento,
                tiposAsiento,
                getSegmentFlightId(vuelos[index]),
              ),
            );
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
  }, [vuelos]);

  const activeSegment = vuelos[activeSegmentIndex];
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
        };
      })
      .sort((a, b) => a.start - b.start);
  }, [asientosDelSegmento]);

  const handleSeatClick = (seat) => {
    setMessage("");
    if (!seat.activo || seat.ocupado) return;

    setSelectedSeats((prev) => {
      const existe = prev.some(
        (item) => item.selectionId === seat.selectionId,
      );
      return existe
        ? prev.filter((item) => item.selectionId !== seat.selectionId)
        : [...prev, seat];
    });
  };

  const subtotal = selectedSeats.reduce(
    (sum, seat) => sum + seat.price,
    0
  );

  // Cargo ficticio para la demostración.
  const serviceFee = selectedSeats.length * 45;
  const total = subtotal + serviceFee;

  const handleExit = () => {
    navigate("/", {
      replace: true,
    });
  };

  const handleContinue = async () => {
    if (selectedSeats.length === 0 || reserving) return;

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
        seatIds: selectedSeats.map((seat) => seat.databaseId),
      });

      if (reservation?.id == null) {
        throw new Error("Invalid reservation response");
      }

      invalidateTripsCache();

      navigate("/checkout", {
        state: {
          flight,
          passengers: selectedSeats.length,
          selectedSeats,
          subtotal,
          serviceFee,
          total,
          reservation,
          paymentDeadline: createPaymentDeadline(),
        },
      });
    } catch (reservationError) {
      setMessage(reservationErrorMessage(reservationError, "reserve"));
    } finally {
      setReserving(false);
    }
  };


  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url("/allFonts.png")' }}
    >
      <div className="flow-root min-h-screen w-full">
        <MainNavbar />

        {/* Distribución de dos columnas */}
        <div
          className="mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-[1600px] min-w-0 grid-cols-1 items-start gap-5 px-4 py-5 sm:px-6 lg:px-12 lg:py-8
                     xl:grid-cols-[minmax(0,1fr)_390px] lg:gap-8"
        >
          {/* Columna izquierda */}
          <main className="min-w-0 space-y-5">
            <FlightInfo flight={flight} />

            <section
              className="min-w-0 rounded-3xl border border-white/60 bg-white/90 p-3 shadow-lg backdrop-blur-md sm:p-6 lg:p-8"
            >
              <div
                className="mb-6 flex flex-col justify-between gap-5 rounded-2xl border border-violet-100 bg-violet-50/90 p-4 sm:p-5 lg:flex-row lg:items-center"
              >
                <div>
                  <h2
                    className="text-2xl font-bold
                               text-[#21194d]"
                  >
                    Selecciona tus asientos
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Haz clic en los asientos disponibles
                    para cada pasajero
                  </p>
                </div>

                <SeatLegend />
              </div>

              {vuelos.length > 1 && (
                <div className="mb-5 flex flex-wrap gap-2" aria-label="Tramos del vuelo">
                  {vuelos.map((vuelo, index) => (
                    <button
                      key={getSegmentFlightId(vuelo)}
                      type="button"
                      onClick={() => setActiveSegmentIndex(index)}
                      aria-pressed={activeSegmentIndex === index}
                      className={`min-w-0 flex-1 basis-36 rounded-lg border px-3 py-3 text-left sm:px-4 ${
                        activeSegmentIndex === index
                          ? "border-violet-600 bg-violet-100 text-violet-900"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <span className="block text-xs">Viaje {index + 1}</span>
                      <span className="block text-sm font-semibold">
                        {vuelo.origin} → {vuelo.destination}
                      </span>
                      <span className="block text-xs">{vuelo.flightNumber}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Mapa y filtros */}
              <div
                className="grid grid-cols-1
                           lg:grid-cols-[minmax(0,1fr)_1px]
                           gap-4 items-start"
              >
                <div
                  className="w-full min-w-0 overflow-x-hidden rounded-2xl border border-slate-200 bg-white/90 p-2 sm:p-6"
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
          <aside className="flex min-w-0 flex-col rounded-3xl border border-white/60 bg-white/95 p-5 shadow-lg backdrop-blur-md sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-5">
              <h2 className="text-xl font-bold
                           text-[#21194d]"
              >
                Resumen de selección
              </h2>

              <span
                className="bg-violet-100 text-violet-800
                           rounded-full px-3 py-1
                           text-xs font-semibold"
              >
                {selectedSeats.length} {selectedSeats.length === 1 ? "asiento" : "asientos"}
              </span>
            </div>

            <div className="mt-6">
              <h3
                className="text-lg font-bold
                           text-[#21194d] mb-4"
              >
                Asientos seleccionados
              </h3>

              <div className="space-y-3 pr-2 lg:max-h-64 lg:overflow-y-auto">
                  {selectedSeats.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Armchair className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-sm">
                        Selecciona tus asientos para continuar
                      </p>
                    </div>
                  ) : (
                    selectedSeats.map((seat, index) => (
                      <div
                        key={seat.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 sm:p-4"
                      >
                        <div
                          className="w-11 h-11 bg-violet-100 rounded-xl
                                    flex items-center justify-center"
                        >
                          <UserRound
                            size={22}
                            className="text-violet-700"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">
                            Pasajero {index + 1}
                          </p>

                          <p className="text-xs text-slate-500">
                            {seat.id} · {seat.classLabel}
                          </p>
                        </div>

                        <span className="font-bold text-[#21194d]">
                          {currency(seat.price)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSeatClick(seat)}
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

            <div
              className="mt-7 rounded-2xl border border-slate-200 bg-white/70 p-4 pt-5 sm:p-5"
            >
              <h3
                className="text-lg font-bold
                           text-[#21194d] mb-5"
              >
                Detalle de precios
              </h3>

              <div className="space-y-4">
                <div
                  className="border-t border-slate-200
                             pt-5 space-y-3"
                >
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

              <div
                className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-violet-50 px-4 py-5 sm:px-5 sm:py-6"
              >
                <p className="font-bold text-[#3b2b7a]">
                  Total a pagar
                </p>

                <div className="text-right">
                  <p
                    className="text-2xl font-extrabold sm:text-3xl
                               text-[#3b2b7a]"
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

            <div className="mt-auto pt-8 space-y-3">
              <button
                type="button"
                onClick={handleContinue}
                disabled={selectedSeats.length === 0 || loading || Boolean(error) || reserving}
                className="w-full bg-[#3b2b7a]
                           hover:bg-[#2b205c]
                           disabled:opacity-50
                           disabled:cursor-not-allowed
                           text-white rounded-2xl
                           py-4 font-semibold
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
          </aside>
        </div>
      </div>
    </div>
  );
}
