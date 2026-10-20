
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  Coffee,
  DoorOpen,
  Users,
  Clock3,
} from "lucide-react";

// Configuración visual de la cabina.
// Posteriormente vendrá de Avion, Asiento y Tipo_asiento.
const CABIN = [
  {
    id: "Business",
    label: "Business",
    start: 1,
    end: 5,
    columns: ["A", "C", "D", "F"],
    price: 2300,
    icon: Crown,
    theme: "violet",
  },
  {
    id: "Preferente",
    label: "Preferente",
    start: 6,
    end: 12,
    columns: ["A", "B", "C", "D", "E", "F"],
    price: 1250,
    icon: Star,
    theme: "amber",
  },
  {
    id: "Economica",
    label: "Económica",
    start: 13,
    end: 28,
    columns: ["A", "B", "C", "D", "E", "F"],
    price: 950,
    icon: Armchair,
    theme: "emerald",
  },
];

const CLASS_THEME = {
  violet: {
    header: "bg-violet-100 text-violet-800",
    border: "border-violet-200",
  },
  amber: {
    header: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
  },
  emerald: {
    header: "bg-emerald-100 text-emerald-800",
    border: "border-emerald-200",
  },
};

// Disponibilidad simulada, estable entre renders.
// No representa una reserva real.
function createMockSeats() {
  const seats = [];

  CABIN.forEach((section) => {
    for (let row = section.start; row <= section.end; row++) {
      section.columns.forEach((letter) => {
        const code = `${row}${letter}`;
        const seed = row * 13 + letter.charCodeAt(0);

        let status = "Disponible";

        if (seed % 13 === 0) {
          status = "Ocupado";
        } else if (seed % 11 === 0) {
          status = "Reservado";
        }

        // Dejamos estos asientos libres para la demostración.
        if (code === "15C" || code === "15D") {
          status = "Disponible";
        }

        seats.push({
          id: code,
          row,
          letter,
          classId: section.id,
          classLabel: section.label,
          price: section.price,
          status,
        });
      });
    }
  });

  return seats;
}

const MOCK_SEATS = createMockSeats();

const STATUS_COLORS = {
  Disponible:
    "bg-emerald-300 border-emerald-500 hover:bg-emerald-400",
  Reservado:
    "bg-amber-300 border-amber-500 cursor-not-allowed",
  Ocupado:
    "bg-rose-300 border-rose-500 cursor-not-allowed",
  Seleccionado:
    "bg-violet-500 border-violet-700 text-white",
};

const currency = (amount) =>
  `Q${amount.toLocaleString("es-GT")}`;

function Seat({ seat, selected, onClick }) {
  const status = selected ? "Seleccionado" : seat.status;
  const disabled = !selected && seat.status !== "Disponible";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(seat)}
      title={`${seat.id} · ${seat.classLabel} · ${status}`}
      aria-label={`Asiento ${seat.id}, ${status}`}
      aria-pressed={selected}
      className={`
        w-7 h-7 sm:w-8 sm:h-8
        rounded-md border-2
        flex items-center justify-center
        text-[10px] font-bold
        transition-all duration-150
        ${STATUS_COLORS[status]}
        ${selected ? "ring-2 ring-violet-300 scale-105" : ""}
        ${!disabled ? "cursor-pointer hover:scale-110" : ""}
      `}
    >
      {selected ? (
        <Check size={13} strokeWidth={3} />
      ) : status === "Ocupado" ? (
        <X size={12} className="text-rose-800" />
      ) : null}
    </button>
  );
}

function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {Object.entries(STATUS_COLORS).map(([status, color]) => (
        <div key={status} className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded border ${color}`}
          />
          <span className="text-xs text-slate-600">
            {status}
          </span>
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
  const theme = CLASS_THEME[section.theme];

  const rows = Array.from(
    { length: section.end - section.start + 1 },
    (_, index) => section.start + index
  );

  const getSeat = (row, letter) =>
    seats.find(
      (seat) =>
        seat.row === row &&
        seat.letter === letter &&
        seat.classId === section.id
    );

  const midpoint = section.columns.length / 2;
  const leftColumns = section.columns.slice(0, midpoint);
  const rightColumns = section.columns.slice(midpoint);

  const renderSeat = (row, letter) => {
    const seat = getSeat(row, letter);

    if (!seat) return null;

    return (
      <Seat
        key={seat.id}
        seat={seat}
        selected={selectedSeats.some(
          (item) => item.id === seat.id
        )}
        onClick={onSeatClick}
      />
    );
  };

  return (
    <div className="min-w-max">
      <div
        className={`rounded-xl px-4 py-3 mb-5
                    text-center ${theme.header}`}
      >
        <div className="flex items-center justify-center gap-2">
          <Icon size={17} />
          <span className="font-bold text-sm">
            {section.label}
          </span>
        </div>
        <p className="text-xs opacity-75 mt-1">
          Filas {section.start} - {section.end}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="w-5" />

        <div className="flex gap-1.5">
          {leftColumns.map((letter) => (
            <span
              key={letter}
              className="w-7 sm:w-8 text-center
                         text-xs text-slate-500"
            >
              {letter}
            </span>
          ))}
        </div>

        <div className="w-5" />

        <div className="flex gap-1.5">
          {rightColumns.map((letter) => (
            <span
              key={letter}
              className="w-7 sm:w-8 text-center
                         text-xs text-slate-500"
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row}
            className="flex items-center gap-2"
          >
            <span
              className="w-5 text-xs text-slate-500
                         text-right"
            >
              {row}
            </span>

            <div className="flex gap-1.5">
              {leftColumns.map((letter) =>
                renderSeat(row, letter)
              )}
            </div>

            {/* Pasillo central */}
            <div className="w-5" />

            <div className="flex gap-1.5">
              {rightColumns.map((letter) =>
                renderSeat(row, letter)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlightInfo({ flight }) {
  return (
    <div
      className="bg-white p-5 sm:p-7
                 flex flex-col lg:flex-row
                 lg:items-center gap-6"
    >
      <div className="flex items-center gap-4 lg:min-w-48">
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

      <div
        className="flex-1 flex items-center
                   justify-between gap-3"
      >
        <div>
          <p className="text-2xl font-bold text-slate-900">
            {flight.departureTime}
          </p>
          <p className="font-semibold text-[#3b2b7a]">
            {flight.origin}
          </p>
          <p className="text-xs text-slate-500">
            {flight.originCity}
          </p>
        </div>

        <div className="flex-1 max-w-48 text-center">
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
            Vuelo directo
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">
            {flight.arrivalTime}
          </p>
          <p className="font-semibold text-[#3b2b7a]">
            {flight.destination}
          </p>
          <p className="text-xs text-slate-500">
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
  const { flightId } = useParams();

  // Datos que envía FlightSearchModal.
  // El fallback permite probar la pantalla directamente.
  const flight = location.state?.flight ?? {
    id: Number(flightId) || 1,
    airline: "Avianca",
    flightNumber: "AV123",
    origin: "GUA",
    destination: "MIA",
    originCity: "Ciudad de Guatemala",
    destinationCity: "Miami",
    departureTime: "08:00",
    arrivalTime: "11:00",
    duration: "3 h",
  };

  const [selectedSeats, setSelectedSeats] = useState([]);
  const passengerCount = selectedSeats.length;
  const [message, setMessage] = useState("");
  const sections = CABIN;

  const handleSeatClick = (seat) => {
    setMessage("");
    if (selectedSeats.some((item) => item.id === seat.id)) {
        setSelectedSeats((prev) =>
          prev.filter((item) => item.id !== seat.id)
        );
        return;
      }

      if (seat.status !== "Disponible") {
        return;
      }

    setSelectedSeats((prev) => [...prev, seat]);
  };

  const subtotal = selectedSeats.reduce(
    (sum, seat) => sum + seat.price,
    0
  );

  // Cargo ficticio para la demostración.
  const serviceFee = selectedSeats.length * 45;
  const total = subtotal + serviceFee;

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      setMessage("Debes seleccionar al menos un asiento.");
      return;
    }

    navigate("/pasajeros", {
      state: {
        flight,
        passengers: selectedSeats.length,
        selectedSeats,
        subtotal,
        serviceFee,
        total,
      },
    });
  };

  return (
    <div
      className="min-h-screen w-full bg-slate-50"
    >
      <div className="min-h-screen w-full">
        {/* Encabezado principal */}
        <header
          className="bg-linear-to-r from-[#29205f]
                     via-[#3b2b7a] to-[#5843a3]
                     w-full px-5 sm:px-8 lg:px-12
                     py-5 text-white"
        >
          <div
            className="flex flex-col lg:flex-row
                       lg:items-center
                       justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div
                className="bg-white/10 rounded-2xl
                           p-3"
              >
                <Plane size={30} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  La Aurora
                </h1>
                <p className="text-white/70">
                  Selecciona tus asientos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {[
                "Asientos",
                "Pasajeros",
                "Pago",
                "Confirmación",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`w-8 h-8 rounded-full
                      flex items-center justify-center
                      text-sm font-bold border
                      ${
                        index === 0
                          ? "bg-white text-[#3b2b7a] border-white"
                          : "border-white/40 text-white/60"
                      }`}
                  >
                    {index + 1}
                  </span>

                  <span
                    className={`text-xs sm:text-sm ${
                      index === 0
                        ? "text-white"
                        : "text-white/50"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}

              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Volver"
                className="ml-2 p-2 hover:bg-white/10
                           rounded-full cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </header>

        {/* Distribución de dos columnas */}
        <div
          className="min-h-[calc(100vh-104px)] bg-white
                     px-3 py-5 sm:px-6 lg:px-12
                     grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px]
                     gap-5 lg:gap-8"
        >
          {/* Columna izquierda */}
          <main className="min-w-0 space-y-2">
            <FlightInfo flight={flight} />

            <section
              className="bg-violet-50 p-4 sm:p-6 lg:p-8"
            >
              <div
                className="flex flex-col lg:flex-row
                           lg:items-center justify-between
                           gap-5 mb-7"
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

              {/* Mapa y filtros */}
              <div
                className="grid grid-cols-1
                           lg:grid-cols-[minmax(0,1fr)_1px]
                           gap-4 items-start"
              >
                <div
                  className="bg-slate-50
                             overflow-x-auto p-4 sm:p-6"
                >
                  <div className="min-w-max">
                    <div className="flex items-start gap-15">
                      {sections.map((section) => (
                        <CabinSection
                          key={section.id}
                          section={section}
                          seats={MOCK_SEATS}
                          selectedSeats={selectedSeats}
                          onSeatClick={handleSeatClick}
                        />
                      ))}
                    </div>
                  </div>
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

              {/* Referencias de la cabina */}
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
              </div>
            </section>
          </main>

          {/* Columna derecha */}
          <aside className="bg-violet-50 p-5 sm:p-6 lg:p-8 flex flex-col min-w-0">
            <div className="flex items-center justify-between gap-2 pb-5 border-b border-slate-400">
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

              <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
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
                        className="border border-slate-400 rounded-2xl
                                  p-4 flex items-center gap-3"
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
              className="border-t border-slate-200
                         mt-7 pt-7"
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
                className="bg-violet-50 rounded-2xl
                           px-5 py-6 mt-6
                           flex items-center justify-between"
              >
                <p className="font-bold text-[#3b2b7a]">
                  Total a pagar
                </p>

                <div className="text-right">
                  <p
                    className="text-3xl font-extrabold
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
                disabled={
                  selectedSeats.length !== passengerCount
                }
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
                Continuar con pasajeros
                <ArrowRight size={20} />
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
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
