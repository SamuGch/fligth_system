import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Armchair,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  LockKeyhole,
  Plane,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PAYMENT_METHOD_IDS } from "../config/paymentMethods";
import { purchaseReservation } from "../services/apiClient";
import { reservationErrorMessage } from "../services/reservationErrors";
import { limpiarSeleccion } from "../services/seatSelectionStorage";
import { invalidateTripsCache } from "../services/tripsCache";

const money = (value) => `Q ${Number(value || 0).toFixed(2)}`;

const emptyPassenger = {
  nombre_pasajero: "",
  apellido_pasajero: "",
  tipo_documento: "",
  numero_documento: "",
};

const passengerFields = Object.keys(emptyPassenger);

function seatKey(seat) {
  return String(seat.databaseId ?? seat.selectionId ?? seat.id);
}

function formatExpiration(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { client } = useAuth();

  const flight = state?.flight;
  const seats = useMemo(() => state?.selectedSeats ?? [], [state?.selectedSeats]);
  const reservation = state?.reservation;
  const subtotal = Number(state?.subtotal ?? 0);
  const serviceFee = Number(state?.serviceFee ?? 0);
  const total = Number(reservation?.total ?? state?.total ?? subtotal + serviceFee);

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeSeat, setActiveSeat] = useState(() =>
    seats[0] ? seatKey(seats[0]) : "",
  );
  const [passengers, setPassengers] = useState(() =>
    Object.fromEntries(seats.map((seat) => [seatKey(seat), { ...emptyPassenger }])),
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [paymentDeadline] = useState(() => {
    const storedDeadline = Number(state?.paymentDeadline);
    return Number.isFinite(storedDeadline) && storedDeadline > 0
      ? storedDeadline
      : Date.now() + 5 * 60 * 1000;
  });
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((paymentDeadline - Date.now()) / 1000)),
  );
  const [expired, setExpired] = useState(() => paymentDeadline <= Date.now());

  const clienteId = client?.id ?? client?.cliente_id ?? client?.clienteId;
  const selectedSeat = seats.find((seat) => seatKey(seat) === activeSeat) ?? seats[0];
  const selectedPassenger = passengers[activeSeat] ?? emptyPassenger;
  const paymentMethodId = PAYMENT_METHOD_IDS[paymentMethod];

  useEffect(() => {
    if (purchaseResult) return undefined;

    const updateCountdown = () => {
      const seconds = Math.max(
        0,
        Math.ceil((paymentDeadline - Date.now()) / 1000),
      );
      setRemainingSeconds(seconds);
      if (seconds === 0) setExpired(true);
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [paymentDeadline, purchaseResult]);

  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  const updatePassenger = (field, value) => {
    setPassengers((previous) => ({
      ...previous,
      [activeSeat]: {
        ...(previous[activeSeat] ?? emptyPassenger),
        [field]: value,
      },
    }));
    setError("");
  };

  const passengerPayload = () => {
    const payload = [];

    for (const seat of seats) {
      const key = seatKey(seat);
      const values = passengers[key] ?? emptyPassenger;
      const normalized = Object.fromEntries(
        passengerFields.map((field) => [field, values[field].trim()]),
      );
      const filled = passengerFields.filter((field) => normalized[field]);

      if (filled.length === 0) continue;
      if (filled.length !== passengerFields.length) {
        setActiveSeat(key);
        throw new Error(
          `Completa todos los datos del pasajero del asiento ${seat.id}, o deja todos sus campos vacíos.`,
        );
      }

      payload.push({
        vuelo_asiento_id: seat.databaseId,
        ...normalized,
      });
    }

    return payload;
  };

  const completePurchase = async () => {
    if (processing || !acceptedTerms || expired) return;
    if (clienteId == null || reservation?.id == null) {
      setError("No pudimos recuperar tu compra. Vuelve a iniciar el proceso.");
      return;
    }
    if (paymentMethodId == null) {
      setError("Este método de pago no está disponible por el momento. Selecciona otro o inténtalo más tarde.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const result = await purchaseReservation({
        reservationId: reservation.id,
        clienteId,
        paymentMethodId,
        passengers: passengerPayload(),
      });
      invalidateTripsCache();
      setPurchaseResult(result);
    } catch (purchaseError) {
      if (Number(purchaseError?.status) === 410) {
        setRemainingSeconds(0);
        setExpired(true);
      } else {
        setError(reservationErrorMessage(purchaseError));
      }
    } finally {
      setProcessing(false);
    }
  };

  const goBack = () => {
    navigate("/seleccion-asientos", {
      replace: true,
      state: {
        flight,
        avionId: flight?.avionId ?? flight?.avion_id,
      },
    });
  };

  const chooseSeatsAgain = () => {
    navigate("/seleccion-asientos", {
      replace: true,
      state: {
        flight,
        avionId: flight?.avionId ?? flight?.avion_id,
      },
    });
  };

  const goHome = () => {
    limpiarSeleccion();
    navigate("/", { replace: true });
  };

  if (!flight || seats.length === 0 || reservation?.id == null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-5 text-center shadow-xl sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">No hay una compra pendiente</h1>
          <p className="mt-2 text-slate-500">
            Selecciona un vuelo y reserva sus asientos para continuar.
          </p>
          <button
            type="button"
            onClick={goHome}
            className="mt-5 rounded-xl bg-[#3b2b7a] px-6 py-3 font-semibold text-white"
          >
            Buscar vuelos
          </button>
        </div>
      </div>
    );
  }

  const resultStatus = String(purchaseResult?.estado ?? "").toUpperCase();
  const confirmed = resultStatus === "CONFIRMADA";

  return (
    <div className="min-h-dvh bg-[#f5f6fb] font-sans">
      <header className="sticky top-0 z-50 bg-[#3b2b7a] text-white shadow-lg">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-2">
              <img src="/icono.jpg" alt="Air Travel" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-widest sm:text-lg">AIR TRAVEL</h1>
              <p className="text-xs text-white/70">Vuelos que te llevan más lejos</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition hover:bg-white/10 sm:px-3"
            >
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>
            <div className="hidden items-center gap-2 text-sm font-medium md:flex">
              <ShieldCheck size={19} /> Compra segura
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,1fr)] lg:gap-7">
          <section className="order-2 min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-8 lg:order-1">
            <div className="mb-7 flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <CreditCard size={25} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Método de pago</h2>
                <p className="text-sm text-slate-500">Selecciona cómo deseas realizar tu compra.</p>
              </div>
            </div>

            <div
              className={`mb-7 flex items-center justify-between gap-4 rounded-2xl border p-4 ${
                remainingSeconds <= 60
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
              role="timer"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <Clock3 size={25} />
                <div>
                  <p className="text-sm font-bold">Tiempo para confirmar el pago</p>
                  <p className="text-xs opacity-80">La reserva se liberará cuando termine.</p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-2xl font-extrabold">{countdown}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 p-4 text-left transition sm:p-5 ${
                  paymentMethod === "card"
                    ? "border-violet-600 bg-violet-50 text-violet-800"
                    : "border-slate-200 hover:border-violet-300"
                }`}
              >
                <CreditCard size={26} />
                <span className="text-sm font-bold">Tarjeta de crédito o débito</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("deposit")}
                className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 p-4 text-left transition sm:p-5 ${
                  paymentMethod === "deposit"
                    ? "border-violet-600 bg-violet-50 text-violet-800"
                    : "border-slate-200 hover:border-violet-300"
                }`}
              >
                <Landmark size={26} />
                <span className="text-sm font-bold">Depósito bancario</span>
              </button>
            </div>

            <div className="mt-7 rounded-2xl border border-violet-200 bg-violet-50 p-5">
              {paymentMethod === "card" ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-violet-900">
                    <LockKeyhole size={20} /> Pago simulado por el servidor
                  </div>
                  <p className="mt-2 text-sm text-violet-700">
                    No necesitas ingresar número de tarjeta, CVV, vencimiento ni nombre del titular.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 font-bold text-violet-900">
                    <Landmark size={20} /> Reserva pendiente de depósito
                  </div>
                  <p className="mt-2 text-sm text-violet-700">
                    Al continuar, conservaremos la reserva pendiente y mostraremos las instrucciones para realizar el depósito.
                  </p>
                </>
              )}
            </div>

            <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 h-4 w-4 accent-violet-700"
              />
              <span>He revisado los datos de mi compra y acepto las condiciones aplicables.</span>
            </label>

            {error && (
              <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <ArrowLeft size={19} /> Regresar
              </button>
              <button
                type="button"
                onClick={completePurchase}
                disabled={processing || !acceptedTerms || expired}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3b2b7a] px-6 py-4 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Procesando...
                  </>
                ) : paymentMethod === "card" ? (
                  <><LockKeyhole size={19} /> Simular pago de {money(total)}</>
                ) : (
                  <><Landmark size={19} /> Continuar con depósito</>
                )}
              </button>
            </div>
          </section>

          <aside className="order-1 space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-7 lg:order-2 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-3 text-violet-700"><Plane size={23} /></div>
              <h2 className="text-xl font-bold text-slate-900">Resumen de compra</h2>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
              <p className="font-bold text-slate-900">{flight.airline ?? "Aerolínea"}</p>
              <p className="text-sm text-slate-500">Vuelo {flight.flightNumber ?? flight.id}</p>
              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                <div>
                  <p className="text-2xl font-extrabold text-[#3b2b7a]">{flight.origin}</p>
                  <p className="break-words text-xs text-slate-500">{flight.originCity}</p>
                </div>
                <Plane className="shrink-0 text-violet-500" />
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#3b2b7a]">{flight.destination}</p>
                  <p className="break-words text-xs text-slate-500">{flight.destinationCity}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                  <Armchair size={20} className="text-violet-600" /> Asientos seleccionados
                </h3>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                  {seats.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pasajeros por asiento">
                {seats.map((seat, index) => {
                  const key = seatKey(seat);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={activeSeat === key}
                      onClick={() => setActiveSeat(key)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        activeSeat === key
                          ? "bg-violet-700 text-white"
                          : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                      }`}
                    >
                      {seat.id} · P{index + 1}
                    </button>
                  );
                })}
              </div>

              {selectedSeat && (
                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <UserRound size={19} className="text-violet-600" />
                    Datos opcionales · asiento {selectedSeat.id}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={selectedPassenger.nombre_pasajero}
                      onChange={(event) => updatePassenger("nombre_pasajero", event.target.value)}
                      placeholder="Nombre"
                      className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-600"
                    />
                    <input
                      value={selectedPassenger.apellido_pasajero}
                      onChange={(event) => updatePassenger("apellido_pasajero", event.target.value)}
                      placeholder="Apellido"
                      className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-600"
                    />
                    <select
                      value={selectedPassenger.tipo_documento}
                      onChange={(event) => updatePassenger("tipo_documento", event.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-600"
                    >
                      <option value="">Tipo de documento</option>
                      <option value="DPI">DPI</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                    <input
                      value={selectedPassenger.numero_documento}
                      onChange={(event) => updatePassenger("numero_documento", event.target.value)}
                      placeholder="Número de documento"
                      className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-600"
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Puedes dejar los cuatro campos vacíos. Si ingresas uno, completa los demás.
                    Para que una compra con tarjeta quede confirmada, completa los datos de todos los pasajeros.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-slate-200 pt-5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tarifa base</span><span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Cargos adicionales</span><span>{money(serviceFee)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-violet-100 p-5">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-extrabold text-violet-700">{money(total)}</span>
              </div>
              {reservation.fecha_expiracion && (
                <p className="text-center text-xs text-slate-500">
                  Reserva temporal hasta {formatExpiration(reservation.fecha_expiracion)}
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>

      {purchaseResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
            {!confirmed && (
              <button
                type="button"
                onClick={() => setPurchaseResult(null)}
                aria-label="Cerrar"
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            )}
            {confirmed ? (
              <>
                <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
                <h2 className="mt-4 text-2xl font-extrabold text-slate-900">¡Compra exitosa!</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Tu reserva #{purchaseResult.id} fue confirmada y los asientos quedaron asegurados.
                </p>
              </>
            ) : paymentMethod === "deposit" ? (
              <>
                <Landmark size={56} className="mx-auto text-violet-600" />
                <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Reserva pendiente</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Tu reserva #{purchaseResult.id} quedó pendiente. Realiza el depósito antes de la fecha de expiración y conserva el comprobante.
                </p>
                {purchaseResult.fecha_expiracion && (
                  <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                    Fecha límite: {formatExpiration(purchaseResult.fecha_expiracion)}
                  </p>
                )}
              </>
            ) : (
              <>
                <UserRound size={56} className="mx-auto text-amber-600" />
                <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Reserva pendiente</h2>
                <p className="mt-2 text-sm text-slate-600">
                  La reserva #{purchaseResult.id} aún no fue confirmada. Completa los datos de todos los pasajeros antes de que expire para poder confirmar la compra.
                </p>
                {purchaseResult.fecha_expiracion && (
                  <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                    Fecha límite: {formatExpiration(purchaseResult.fecha_expiracion)}
                  </p>
                )}
              </>
            )}
            <button
              type="button"
              onClick={goHome}
              className="mt-6 w-full rounded-xl bg-[#3b2b7a] px-6 py-3 font-bold text-white hover:bg-violet-800"
            >
              Buscar un nuevo vuelo
            </button>
          </div>
        </div>
      )}

      {expired && !purchaseResult && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expired-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
            <Clock3 size={56} className="mx-auto text-red-600" />
            <h2 id="expired-title" className="mt-4 text-2xl font-extrabold text-slate-900">
              La reserva expiró
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              El tiempo disponible para confirmar la compra terminó. Debes iniciar nuevamente la selección.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={goHome}
                className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 hover:bg-slate-200"
              >
                Ir al inicio
              </button>
              <button
                type="button"
                onClick={chooseSeatsAgain}
                className="rounded-xl bg-[#3b2b7a] px-5 py-3 font-bold text-white hover:bg-violet-800"
              >
                Elegir asientos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
