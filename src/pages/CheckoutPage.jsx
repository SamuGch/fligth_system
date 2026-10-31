import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  Plane,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PAYMENT_METHOD_IDS } from "../config/paymentMethods";
import {
  purchaseReservation,
  releaseTemporaryReservationSeats,
} from "../services/apiClient";
import { reservationErrorMessage } from "../services/reservationErrors";
import { limpiarSeleccion } from "../services/seatSelectionStorage";
import { invalidateTripsCache } from "../services/tripsCache";
import MainNavbar from "../components/MainNavbar";
import {
  formatFlightLocation,
  formatFlightOperator,
  getFlightMetadata,
} from "../tools/flightFormatting";

const CHECKOUT_STORAGE_KEY = "airtravel_checkout_state";
const emptyPassenger = {
  nombre_pasajero: "",
  apellido_pasajero: "",
  tipo_documento: "",
  numero_documento: "",
};
const passengerFields = Object.keys(emptyPassenger);
const passengerFieldLabels = {
  nombre_pasajero: "nombre",
  apellido_pasajero: "apellido",
  tipo_documento: "tipo de documento",
  numero_documento: "número de documento",
};

const money = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;

function seatKey(seat) {
  return String(seat.databaseId ?? seat.vueloAsientoId ?? seat.selectionId ?? seat.id);
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

function readStoredCheckout() {
  try {
    const stored = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getPassengerCount(searchData) {
  const count = Number(searchData?.totalPassengers);
  return Number.isInteger(count) && count > 0
    ? count
    : 1;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, session } = useAuth();
  const initialCheckout = useMemo(
    () => location.state?.reservation ? location.state : readStoredCheckout(),
    [location.state],
  );
  const checkout = initialCheckout ?? {};
  const {
    flight,
    reservation,
    selectedSeats = [],
    selectedSeatsByFlight = {},
    searchData = {},
    paymentDeadline: storedDeadline,
  } = checkout;
  const seats = useMemo(() => selectedSeats, [selectedSeats]);
  const passengerCount = getPassengerCount(searchData);
  const [checkoutStep, setCheckoutStep] = useState(3);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiration: "",
    cvv: "",
  });
  const [showChallenge, setShowChallenge] = useState(false);
  const [challenge, setChallenge] = useState({ a: 0, b: 0, answer: "" });
  const [challengeError, setChallengeError] = useState("");
  const [challengePurpose, setChallengePurpose] = useState("payment");
  const [paymentDeadline] = useState(() =>
    Number(storedDeadline) > 0
      ? Number(storedDeadline)
      : Date.now() + 5 * 60 * 1000,
  );
  const [passengers, setPassengers] = useState(() =>
    Object.fromEntries(
      Array.from({ length: passengerCount }, (_, index) => [
        index,
        { ...emptyPassenger },
      ]),
    ),
  );
  const [processing, setProcessing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((paymentDeadline - Date.now()) / 1000)),
  );
  const [expired, setExpired] = useState(() => paymentDeadline <= Date.now());
  const purchaseCompletedRef = useRef(false);
  const releaseCompletedRef = useRef(false);
  const backGuardInstalledRef = useRef(false);
  const browserBackInProgressRef = useRef(false);
  const allowBrowserNavigationRef = useRef(false);

  const clienteId = client?.id ?? client?.cliente_id ?? client?.clienteId;
  const paymentMethodId = PAYMENT_METHOD_IDS.card;
  const cardIsComplete =
    /^\d{16}$/.test(cardData.number) &&
    cardData.name.trim().length > 0 &&
    /^\d{4}$/.test(cardData.expiration) &&
    /^\d{3}$/.test(cardData.cvv);
  const reservationId = reservation?.id;
  const accessToken = session?.access_token;
  const subtotal = reservation?.subtotal ?? reservation?.Subtotal;
  const taxes = reservation?.impuestos ?? reservation?.Impuestos ?? 0;
  const total = reservation?.total ?? reservation?.Total;

  useEffect(() => {
    if (!location.state?.reservation) return;
    try {
      sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({
          reservation: location.state.reservation,
          flight: location.state.flight,
          selectedSeats: location.state.selectedSeats,
          selectedSeatsByFlight: location.state.selectedSeatsByFlight,
          paymentDeadline: location.state.paymentDeadline,
          searchData: location.state.searchData,
        }),
      );
    } catch (storageError) {
      console.error("No fue posible guardar temporalmente los datos de tu compra.", storageError);
    }
  }, [location.state]);

  useEffect(() => {
    if (purchaseResult) return undefined;
    const updateCountdown = () => {
      const seconds = Math.max(0, Math.ceil((paymentDeadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) setExpired(true);
    };
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [paymentDeadline, purchaseResult]);

  useEffect(() => {
    if (reservationId == null || !location.state?.reservation) return undefined;
    if (!backGuardInstalledRef.current) {
      backGuardInstalledRef.current = true;
      navigate(location.pathname, {
        state: { ...location.state, checkoutBackGuard: String(reservationId) },
        replace: true,
      });
    }
    return undefined;
  }, [location.pathname, location.state, navigate, reservationId]);

  const releaseTemporarySeats = useCallback(
    async ({ keepalive = false } = {}) => {
      if (
        reservationId == null ||
        purchaseCompletedRef.current ||
        releaseCompletedRef.current
      ) return;
      await releaseTemporaryReservationSeats(reservationId, accessToken, { keepalive });
      releaseCompletedRef.current = true;
      limpiarSeleccion();
    },
    [accessToken, reservationId],
  );

  useEffect(() => {
    if (reservationId == null) return undefined;
    const releaseOnAbandon = () => {
      void releaseTemporarySeats({ keepalive: true }).catch(() => undefined);
    };
    const releaseBeforeBrowserBack = () => {
      if (allowBrowserNavigationRef.current) {
        allowBrowserNavigationRef.current = false;
        browserBackInProgressRef.current = false;
        return;
      }
      if (browserBackInProgressRef.current) return;
      browserBackInProgressRef.current = true;
      setLeaving(true);
      void releaseTemporarySeats()
        .then(() => {
          allowBrowserNavigationRef.current = true;
          window.history.back();
        })
        .catch((releaseError) => {
          setError(releaseError instanceof Error
            ? releaseError.message
            : "No se pudieron liberar los asientos. Inténtalo nuevamente.");
          setLeaving(false);
          allowBrowserNavigationRef.current = true;
          window.history.forward();
        });
    };
    window.addEventListener("popstate", releaseBeforeBrowserBack);
    window.addEventListener("pagehide", releaseOnAbandon);
    return () => {
      window.removeEventListener("popstate", releaseBeforeBrowserBack);
      window.removeEventListener("pagehide", releaseOnAbandon);
    };
  }, [releaseTemporarySeats, reservationId]);

  const updatePassenger = (passengerIndex, field, value) => {
    setPassengers((previous) => ({
      ...previous,
      [passengerIndex]: { ...previous[passengerIndex], [field]: value },
    }));
    setError("");
  };

  const passengerPayload = () => {
    const normalizedPassengers = Array.from({ length: passengerCount }, (_, index) => {
      const values = passengers[index] ?? emptyPassenger;
      return Object.fromEntries(
        passengerFields.map((field) => [field, values[field].trim()]),
      );
    });
    const incompleteIndex = normalizedPassengers.findIndex((values) =>
      passengerFields.some((field) => !values[field]),
    );
    if (incompleteIndex !== -1) {
      const missingFields = passengerFields
        .filter((field) => !normalizedPassengers[incompleteIndex][field])
        .map((field) => passengerFieldLabels[field]);
      throw new Error(
        `Completa los datos de Pasajero ${incompleteIndex + 1}: ${missingFields.join(", ")}.`,
      );
    }

    return seats.map((seat, seatIndex) => {
      const flightSeats = selectedSeatsByFlight[seat.vueloId] ?? [];
      const position = flightSeats.findIndex((item) => seatKey(item) === seatKey(seat));
      const passengerIndex = position >= 0
        ? position % passengerCount
        : seatIndex % passengerCount;
      return {
        vuelo_asiento_id: seat.databaseId ?? seat.vueloAsientoId,
        ...normalizedPassengers[passengerIndex],
      };
    });
  };

  const completePurchase = async () => {
    if (processing || !acceptedTerms || expired) return;
    if (clienteId == null || reservationId == null) {
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
        reservationId,
        clienteId,
        paymentMethodId,
        passengers: passengerPayload(),
      });
      purchaseCompletedRef.current = true;
      invalidateTripsCache();
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      setPurchaseResult(result);
    } catch (purchaseError) {
      if (Number(purchaseError?.status) === 410) {
        setRemainingSeconds(0);
        setExpired(true);
      } else {
        setError(purchaseError instanceof Error
          ? purchaseError.message
          : reservationErrorMessage(purchaseError));
      }
    } finally {
      setProcessing(false);
    }
  };

  const generateChallenge = (purpose = "payment") => {
    setChallenge({
      a: Math.floor(Math.random() * 10) + 1,
      b: Math.floor(Math.random() * 10) + 1,
      answer: "",
    });
    setChallengePurpose(purpose);
    setChallengeError("");
    setShowChallenge(true);
  };

  const fillDemoCard = () => {
    const digits = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 10),
    ).join("");
    const expirationMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const expirationYear = String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 1).slice(-2);
    const names = ["USUARIO DEMO", "PASAJERO AIRFLY", "CLIENTE PRUEBA"];

    setCardData({
      number: digits,
      name: names[Math.floor(Math.random() * names.length)],
      expiration: `${expirationMonth}${expirationYear}`,
      cvv: String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
    });
  };

  const handleFinalPayment = () => {
    if (!cardIsComplete) return;
    void completePurchase();
  };

  const confirmChallenge = () => {
    if (parseInt(challenge.answer, 10) !== challenge.a * challenge.b) {
      setChallengeError("La respuesta no coincide. Inténtalo nuevamente.");
      return;
    }
    setChallengeError("");
    setShowChallenge(false);
    if (challengePurpose === "card") {
      fillDemoCard();
      return;
    }
    void completePurchase();
  };

  const continueToPayment = () => {
    try {
      passengerPayload();
      setError("");
      setCheckoutStep(4);
    } catch (validationError) {
      setError(validationError instanceof Error
        ? validationError.message
        : "Completa los datos de los pasajeros para continuar.");
    }
  };

  const goBack = async () => {
    if (leaving || processing) return;
    setLeaving(true);
    setError("");
    try {
      await releaseTemporarySeats();
      allowBrowserNavigationRef.current = true;
      navigate(backGuardInstalledRef.current ? -2 : "/seleccion-asientos", {
        replace: !backGuardInstalledRef.current,
        state: backGuardInstalledRef.current ? undefined : {
          flight,
          avionId: flight?.avionId ?? flight?.avion_id,
        },
      });
    } catch (releaseError) {
      setError(releaseError instanceof Error
        ? releaseError.message
        : "No se pudieron liberar los asientos. Inténtalo nuevamente.");
      setLeaving(false);
    }
  };

  const goHome = () => {
    limpiarSeleccion();
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
    navigate("/", { replace: true });
  };

  const viewPurchaseDetail = () => {
    const detailId = purchaseResult?.id ?? reservation?.id;
    if (detailId == null) return;
    limpiarSeleccion();
    navigate(`/reservas/${detailId}`, { replace: true });
  };

  if (!flight || seats.length === 0 || reservationId == null) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center bg-cover bg-center bg-fixed p-4 font-sans sm:p-6" style={{ backgroundImage: 'url("/font.jpeg")' }}>
        <div className="fixed inset-0 z-0 bg-white/45 backdrop-blur-md" />
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-5 text-center shadow-[0_16px_45px_rgba(47,43,122,0.12)] backdrop-blur-md sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">No hay una compra pendiente</h1>
          <p className="mt-2 text-slate-500">Selecciona un vuelo y reserva sus asientos para continuar.</p>
          <button type="button" onClick={goHome} className="mt-5 rounded-xl bg-[#3b2b7a] px-6 py-3 font-semibold text-white">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const resultStatus = String(purchaseResult?.estado ?? "").toUpperCase();
  const confirmed = resultStatus === "CONFIRMADA";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cover bg-center bg-fixed px-4 pb-16 pt-3 font-sans text-slate-800 sm:px-6" style={{ backgroundImage: 'url("/font.jpeg")' }}>
      <div className="fixed inset-0 z-0 bg-white/45 backdrop-blur-md pointer-events-none" />
      <MainNavbar className="!fixed !left-4 !right-4 !top-3 !mx-0 sm:!left-6 sm:!right-6 sm:!top-5 lg:!left-12 lg:!right-12 xl:!left-25 xl:!right-25" />
      <main className="relative z-10 mx-auto w-full max-w-[1600px] pt-20 sm:pt-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={goBack} disabled={leaving || processing} className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-[#3b2b7a]">
            <ArrowLeft size={17} /> Volver a selección de asientos
          </button>
          <ol aria-label="Progreso de compra" className="flex items-center gap-2 overflow-x-auto rounded-full border border-white/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md sm:gap-3">
            {["Vuelos", "Asientos", "Pasajeros", "Pago"].map((label, index) => {
              const step = index + 1;
              const complete = step < checkoutStep;
              const active = step === checkoutStep;
              return (
                <li key={label} className={`flex shrink-0 items-center gap-2 ${active ? "text-[#3b2b7a]" : complete ? "text-emerald-700" : "text-slate-400"}`}>
                  <span className={`grid h-7 w-7 place-items-center rounded-full ${complete ? "bg-emerald-500 text-white" : active ? "bg-[#3b2b7a] text-white shadow-md" : "bg-slate-100 text-slate-500"}`}>
                    {complete ? <Check size={15} /> : step}
                  </span>
                  {label}
                  {step < 4 && <ArrowRight size={14} className="text-slate-300" />}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <section className="min-w-0 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_16px_45px_rgba(47,43,122,0.12)] backdrop-blur-md sm:p-7 lg:col-span-8">
            {checkoutStep === 3 ? (
              <>
                <div className="mb-7 flex items-center gap-3">
                  <div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><UserRound size={25} /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Paso 3 · Pasajeros</p>
                    <h1 className="text-xl font-extrabold text-slate-900">Información de pasajeros</h1>
                    <p className="text-sm text-slate-500">Ingresa los datos exactamente como aparecen en el documento.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: passengerCount }, (_, index) => {
                    const passenger = passengers[index] ?? emptyPassenger;
                    return (
                      <article key={index} className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm sm:p-5">
                        <h2 className="mb-4 font-bold text-slate-900">Pasajero {index + 1} (Adulto)</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input aria-label={`Nombre del pasajero ${index + 1}`} value={passenger.nombre_pasajero} onChange={(event) => updatePassenger(index, "nombre_pasajero", event.target.value)} placeholder="Nombre"                           className="rounded-xl border border-slate-300 bg-white/90 px-3 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100" />
                          <input aria-label={`Apellido del pasajero ${index + 1}`} value={passenger.apellido_pasajero} onChange={(event) => updatePassenger(index, "apellido_pasajero", event.target.value)} placeholder="Apellido" className="rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100" />
                          <select aria-label={`Tipo de documento del pasajero ${index + 1}`} value={passenger.tipo_documento} onChange={(event) => updatePassenger(index, "tipo_documento", event.target.value)} className="rounded-xl border border-slate-300 bg-white/90 px-3 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100">
                            <option value="">Tipo de documento</option>
                            <option value="DPI">DPI</option>
                            <option value="PASAPORTE">Pasaporte</option>
                          </select>
                          <input aria-label={`Número de documento del pasajero ${index + 1}`} value={passenger.numero_documento} onChange={(event) => updatePassenger(index, "numero_documento", event.target.value)} placeholder="Número de documento" className="rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100" />
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <Clock3 size={21} /><span>Tiempo restante para completar la compra: <strong>{countdown}</strong></span>
                </div>
                {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
              </>
            ) : (
              <>
                <div className="mb-7 flex items-center gap-3">
                  <div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><CreditCard size={25} /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Paso 4 · Pago</p>
                    <h1 className="text-xl font-extrabold text-slate-900">Selecciona tu método de pago</h1>
                    <p className="text-sm text-slate-500">Elige cómo deseas completar tu compra.</p>
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-violet-600 bg-violet-50 p-5">
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-violet-700" size={25} />
                    <div>
                      <strong className="block text-slate-900">Tarjeta de crédito o débito</strong>
                      <span className="text-sm text-slate-500">Formulario simulado para este entorno de pruebas.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => generateChallenge("card")}
                    className="mt-4 inline-flex items-center justify-center rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:border-violet-500 hover:bg-violet-100"
                  >
                    Resolver minijuego y autocompletar tarjeta
                  </button>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-bold text-slate-700 sm:col-span-2" htmlFor="card-number">
                      Número de tarjeta
                      <input
                        id="card-number"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        maxLength={16}
                        value={cardData.number}
                        onChange={(event) => setCardData({
                          ...cardData,
                          number: event.target.value.replace(/\D/g, "").slice(0, 16),
                        })}
                        placeholder="1234123412341234"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700 sm:col-span-2" htmlFor="card-name">
                      Nombre en la tarjeta
                      <input
                        id="card-name"
                        type="text"
                        autoComplete="cc-name"
                        value={cardData.name}
                        onChange={(event) => setCardData({ ...cardData, name: event.target.value })}
                        placeholder="NOMBRE DEL TITULAR"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700" htmlFor="card-expiration">
                      Fecha de expiración
                      <input
                        id="card-expiration"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={4}
                        value={cardData.expiration}
                        onChange={(event) => setCardData({
                          ...cardData,
                          expiration: event.target.value.replace(/\D/g, "").slice(0, 4),
                        })}
                        placeholder="MM/AA"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700" htmlFor="card-cvv">
                      Código de seguridad / CVV
                      <input
                        id="card-cvv"
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        maxLength={3}
                        value={cardData.cvv}
                        onChange={(event) => setCardData({
                          ...cardData,
                          cvv: event.target.value.replace(/\D/g, "").slice(0, 3),
                        })}
                        placeholder="123"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      />
                    </label>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    Estos datos son únicamente visuales y no se envían al servidor.
                  </p>
                </div>
                <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                  <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-violet-700" />
                  <span>He revisado los datos de mi compra y acepto las condiciones aplicables.</span>
                </label>
                {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
              </>
            )}
          </section>

          <aside className="space-y-5 lg:col-span-4 lg:sticky lg:top-5">
            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(47,43,122,0.12)] backdrop-blur-md sm:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-100 p-3 text-violet-700"><Plane size={23} /></div>
                <h2 className="text-xl font-extrabold text-slate-900">Resumen de compra</h2>
              </div>
              <div className="mt-5 border-b border-slate-200 pb-5">
                {checkoutStep === 3 ? (
                  <button type="button" onClick={continueToPayment} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b2b7a] px-5 py-4 font-bold text-white transition hover:bg-[#2b205c]">
                    <span>Continuar al pago</span><ArrowRight size={19} />
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => setCheckoutStep(3)} disabled={processing} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700">
                      <ArrowLeft size={18} /> Revisar pasajeros
                    </button>
                    <button type="button" onClick={handleFinalPayment} disabled={processing || !acceptedTerms || expired || !cardIsComplete} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b2b7a] px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                      {processing ? "Procesando..." : <><LockKeyhole size={18} /> Pagar {money(total)}</>}
                    </button>
                    {!cardIsComplete && !processing && (
                      <p className="mt-2 text-center text-xs text-amber-700">Completa los datos de la tarjeta para habilitar el pago.</p>
                    )}
                  </>
                )}
                {expired && <p className="mt-3 text-center text-sm font-semibold text-red-600">La reserva temporal expiró.</p>}
              </div>
              <div className="mt-5 rounded-2xl border border-white/80 bg-white/65 p-4">
                {(() => {
                  const metadata = getFlightMetadata(flight);
                  const origin = formatFlightLocation(metadata.origin, flight.origin);
                  const destination = formatFlightLocation(metadata.destination, flight.destination);
                  return (
                    <>
                      <p className="font-bold text-slate-900">{formatFlightOperator(flight)}</p>
                      <p className="text-sm text-slate-500">Vuelo {metadata.number ?? flight.id}</p>
                      <div className="mt-4 flex items-center justify-between gap-3 font-extrabold text-violet-800"><span>{origin.code}</span><Plane size={18} /><span>{destination.code}</span></div>
                      <p className="mt-2 text-xs text-slate-500">Terminal {metadata.terminal ?? "pendiente"} · Puerta {metadata.gate ?? "pendiente"}</p>
                    </>
                  );
                })()}
              </div>
              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between text-slate-600"><span>Precio de tiquetes</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Impuestos y cargos</span><span>{money(taxes)}</span></div>
                <div className="flex justify-between rounded-2xl bg-[#f0ecfa] p-4 text-base font-extrabold text-[#3b2b7a]"><span>Total a pagar</span><span>{money(total)}</span></div>
              </div>
              {reservation.fecha_expiracion && <p className="mt-4 text-center text-xs text-slate-500">Reserva temporal hasta {formatExpiration(reservation.fecha_expiracion)}</p>}
            </div>
          </aside>
        </div>
      </main>

      {showChallenge && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="security-challenge-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <LockKeyhole size={25} />
              </div>
              <div>
                <h2 id="security-challenge-title" className="text-xl font-extrabold text-slate-900">
                  {challengePurpose === "card"
                    ? "Desbloquea la tarjeta demo"
                    : "¡Alto ahí! Modo Simulador"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {challengePurpose === "card"
                    ? "Resuelve el reto para rellenar los campos con datos ficticios de prueba. Nunca se enviarán al servidor."
                    : "Para evitar que uses tu tarjeta real en este entorno de pruebas, demuestra que eres humano resolviendo este complejo sistema de seguridad:"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Reto de seguridad
              </p>
              <p className="mt-2 text-3xl font-black tracking-wide text-violet-900">
                {challenge.a} × {challenge.b} = ?
              </p>
            </div>

            <label className="mt-5 block text-sm font-bold text-slate-700" htmlFor="security-answer">
              Tu respuesta
              <input
                id="security-answer"
                type="number"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={challenge.answer}
                onChange={(event) => {
                  setChallenge({ ...challenge, answer: event.target.value });
                  setChallengeError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") confirmChallenge();
                }}
                aria-invalid={Boolean(challengeError)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-center text-lg font-bold outline-none transition focus:ring-2 ${
                  challengeError
                    ? "border-red-400 bg-red-50 text-red-800 focus:ring-red-100"
                    : "border-slate-300 focus:border-violet-600 focus:ring-violet-100"
                }`}
              />
            </label>
            {challengeError && (
              <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                {challengeError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowChallenge(false);
                  setChallengeError("");
                  setChallengePurpose("payment");
                }}
                className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmChallenge}
                className="rounded-xl bg-[#3b2b7a] px-5 py-3 font-bold text-white transition hover:bg-[#2b205c]"
              >
                {challengePurpose === "card" ? "Autocompletar tarjeta" : "Confirmar Pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {purchaseResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
            {!confirmed && <button type="button" onClick={() => setPurchaseResult(null)} aria-label="Cerrar" className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>}
            {confirmed ? <><CheckCircle2 size={56} className="mx-auto text-emerald-600" /><h2 className="mt-4 text-2xl font-extrabold text-slate-900">¡Compra exitosa!</h2><p className="mt-2 text-sm text-slate-600">Tu reserva #{purchaseResult.id} fue confirmada y los asientos quedaron asegurados.</p></> : <><UserRound size={56} className="mx-auto text-amber-600" /><h2 className="mt-4 text-2xl font-extrabold text-slate-900">Reserva pendiente</h2><p className="mt-2 text-sm text-slate-600">Tu reserva #{purchaseResult.id} quedó pendiente. Completa el proceso antes de que expire.</p></>}
            <button type="button" onClick={viewPurchaseDetail} className="mt-6 w-full rounded-xl border border-violet-300 px-4 py-3 font-bold text-violet-700">Ver detalle de reserva</button>
          </div>
        </div>
      )}
    </div>
  );
}
