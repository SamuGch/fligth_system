
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Armchair,
  CheckCircle2,
  CreditCard,
  Landmark,
  LockKeyhole,
  Plane,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const money = (value) =>
  `Q ${Number(value || 0).toFixed(2)}`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const flight = state?.flight;
  const seats = state?.selectedSeats ?? [];

  const subtotal = Number(state?.subtotal ?? 0);
  const serviceFee = Number(state?.serviceFee ?? 0);
  const total = Number(state?.total ?? subtotal + serviceFee);

  const goBack = () => {
    navigate("/seleccion-asientos", {
      replace: true,
      state: {
        flight,
        avionId: flight?.avionId ?? flight?.avion_id,
      },
    });
  };

  const [card, setCard] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvv: "",
  });

  const [cardErrors, setCardErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const TEST_CARDS = {
    "4242424242424242": "approved",
    "4000000000000002": "declined",
  };

  const updateCard = (field, value) => {
    setCard((previous) => ({
      ...previous,
      [field]: value,
    }));

    setCardErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : digits;
  };

  const validateCard = () => {
    const errors = {};
    const number = card.number.replace(/\s/g, "");

    if (!card.holder.trim()) {
      errors.holder = "Ingresa el nombre del titular.";
    }

    if (!Object.hasOwn(TEST_CARDS, number)) {
      errors.number = "Utiliza una tarjeta de prueba válida.";
    }

    const match = card.expiry.match(/^(\d{2})\/(\d{2})$/);

    if (!match) {
      errors.expiry = "Ingresa una fecha válida MM/AA.";
    } else {
      const month = Number(match[1]);
      const year = 2000 + Number(match[2]);
      const now = new Date();

      if (
        month < 1 ||
        month > 12 ||
        year < now.getFullYear() ||
        (year === now.getFullYear() &&
          month < now.getMonth() + 1)
      ) {
        errors.expiry = "La fecha de vencimiento no es válida.";
      }
    }

    if (!/^\d{3,4}$/.test(card.cvv)) {
      errors.cvv = "Ingresa un CVV de 3 o 4 dígitos.";
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const simulatePayment = async () => {
    if (processing || !acceptedTerms || !validateCard()) return;

    setProcessing(true);
    setPaymentResult(null);

    // Simulación local: no se envían datos a ningún servidor.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const number = card.number.replace(/\s/g, "");
    const approved = TEST_CARDS[number] === "approved";

    // Eliminamos los datos ingresados después de la prueba.
    setCard({
      holder: "",
      number: "",
      expiry: "",
      cvv: "",
    });

    setProcessing(false);
    setPaymentResult(approved ? "approved" : "declined");
  };

  if (!flight || seats.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-5 text-center shadow-xl sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">
            No hay una compra pendiente
          </h1>

          <p className="mt-2 text-slate-500">
            Selecciona un vuelo y sus asientos para continuar.
          </p>

          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="mt-5 rounded-xl bg-[#3b2b7a] px-6 py-3 font-semibold text-white"
          >
            Buscar vuelos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f5f6fb] font-sans">

      {/* NAVBAR */}
    <header className="sticky top-0 z-50 bg-[#3b2b7a] text-white shadow-lg">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-2">
              <img
                src="/icono.jpg"
                alt="Air Travel"
                className="h-9 w-9 object-contain"
              />
            </div>

            <div>
              <h1 className="text-base font-extrabold tracking-widest sm:text-lg">
                AIR TRAVEL
              </h1>
              <p className="text-xs text-white/70">
                Vuelos que te llevan más lejos
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Volver a selección de asientos"
              className="flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-3"
            >
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>
            <div className="hidden items-center gap-2 text-sm font-medium md:flex">
              <ShieldCheck size={19} />
              Compra segura
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8 lg:py-3">

        {/* TÍTULO */}
        <div className="mb-3">
        </div>

        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)] lg:gap-7">

          {/* COLUMNA DE PAGO */}
          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-8">

            <div className="mb-7 flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <CreditCard size={25} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Método de pago
                </h3>
                <p className="text-sm text-slate-500">
                  Selecciona cómo deseas realizar tu compra.
                </p>
              </div>
            </div>

            {/* MÉTODOS */}
            <div className="grid gap-3 md:grid-cols-2 sm:gap-4">
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
                <span className="text-sm font-bold">
                  Tarjeta de crédito o débito
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 p-4 text-left transition sm:p-5 ${
                  paymentMethod === "transfer"
                    ? "border-violet-600 bg-violet-50 text-violet-800"
                    : "border-slate-200 hover:border-violet-300"
                }`}
              >
                <Landmark size={26} />
                <span className="text-sm font-bold">
                  Transferencia bancaria
                </span>
              </button>
            </div>

            {/* CONTENIDO DEL MÉTODO */}
            <div className="mt-7">
              {paymentMethod === "card" ? (
                <div className="space-y-6">
                  {/*<div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <div className="flex items-center gap-2 text-violet-800">
                      <LockKeyhole size={20} />
                      <span className="font-bold">
                        Entorno de pruebas
                      </span>
                    </div> 
                    <p className="mt-2 text-sm text-violet-700">
                      Este formulario simula pagos. No ingreses
                      información de tarjetas reales.
                    </p>
                  </div>*/}


                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nombre del titular
                    </label>

                    <input
                      type="text"
                      value={card.holder}
                      onChange={(e) => updateCard("holder", e.target.value)}
                      placeholder="Como aparece en la tarjeta"
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600"
                    />

                    {cardErrors.holder && (
                      <p className="mt-1 text-xs text-red-600">
                        {cardErrors.holder}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Número de tarjeta de prueba
                    </label>

                    <div className="relative">
                      <CreditCard
                        size={21}
                        className="absolute left-4 top-3.5 text-violet-600"
                      />

                      <input
                        type="text"
                        inputMode="numeric"
                        value={card.number}
                        onChange={(e) =>
                          updateCard("number", formatCardNumber(e.target.value))
                        }
                        placeholder="0000 0000 0000 0000"
                        autoComplete="off"
                        maxLength={19}
                        className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none focus:border-violet-600"
                      />
                    </div>

                    {cardErrors.number && (
                      <p className="mt-1 text-xs text-red-600">
                        {cardErrors.number}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Vencimiento
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={card.expiry}
                        onChange={(e) =>
                          updateCard("expiry", formatExpiry(e.target.value))
                        }
                        placeholder="MM/AA"
                        maxLength={5}
                        autoComplete="off"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600"
                      />

                      {cardErrors.expiry && (
                        <p className="mt-1 text-xs text-red-600">
                          {cardErrors.expiry}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        CVV de prueba
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={card.cvv}
                        onChange={(e) =>
                          updateCard(
                            "cvv",
                            e.target.value.replace(/\D/g, "").slice(0, 4)
                          )
                        }
                        placeholder="123"
                        maxLength={4}
                        autoComplete="off"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600"
                      />

                      {cardErrors.cvv && (
                        <p className="mt-1 text-xs text-red-600">
                          {cardErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  {/*<div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">
                      Tarjetas para realizar pruebas
                    </p>

                    <p className="mt-2">
                      Aprobada: <strong>4242 4242 4242 4242</strong>
                    </p>

                    <p>
                      Rechazada: <strong>4000 0000 0000 0002</strong>
                    </p>

                    <p className="mt-2 text-xs">
                      Utiliza cualquier fecha futura válida y un CVV
                      ficticio de 3 dígitos.
                    </p>
                  </div>*/}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
                  <Landmark
                    size={35}
                    className="mb-4 text-violet-600"
                  />

                  <h4 className="font-bold text-slate-900">
                    Transferencia bancaria
                  </h4>

                  <p className="mt-2 text-sm text-slate-600">
                    Las instrucciones y los datos bancarios
                    estarán disponibles cuando configuremos
                    este método de pago.
                  </p>
                </div>
              )}
            </div>

            {/* TÉRMINOS */}
            <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) =>
                  setAcceptedTerms(event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-violet-700"
              />
              <span>
                He revisado los datos de mi compra y acepto
                las condiciones aplicables.
              </span>
            </label>

            {/* BOTONES */}
            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <ArrowLeft size={19} />
                Regresar
              </button>

              <button
                type="button"
                onClick={simulatePayment}
                disabled={
                  processing ||
                  !acceptedTerms ||
                  paymentMethod !== "card"
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3b2b7a] px-6 py-4 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Procesando pago...
                  </>
                ) : (
                  <>
                    <LockKeyhole size={19} />
                    Simular pago de {money(total)}
                  </>
                )}
              </button>
            </div>

            {paymentResult === "approved" && (
              <div
                role="status"
                className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5 text-center"
              >
                <CheckCircle2
                  size={42}
                  className="mx-auto mb-3 text-green-600"
                />

                <h3 className="text-xl font-bold text-green-800">
                  ¡Pago de prueba aprobado!
                </h3>

                <p className="mt-2 text-sm text-green-700">
                  La simulación se completó correctamente.
                  No se realizó ningún cobro ni se confirmó
                  una reserva real.
                </p>
              </div>
            )}

            {paymentResult === "declined" && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-center"
              >
                <h3 className="text-xl font-bold text-red-800">
                  Pago de prueba rechazado
                </h3>

                <p className="mt-2 text-sm text-red-700">
                  La transacción simulada fue rechazada.
                  Puedes intentar nuevamente con otra
                  tarjeta de prueba.
                </p>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-slate-400">
              Este entorno solo simula pagos; no se procesan
              cobros ni se confirman reservas reales.
            </p>
          </section>

          {/* RESUMEN */}
          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-7 lg:sticky lg:top-24">

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                <Plane size={23} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Resumen de compra
              </h3>
            </div>

            {/* VUELO */}
            <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
              <p className="font-bold text-slate-900">
                {flight.airline ?? "Aerolínea"}
              </p>
              <p className="text-sm text-slate-500">
                Vuelo {flight.flightNumber ?? flight.id}
              </p>

              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                <div>
                  <p className="text-2xl font-extrabold text-[#3b2b7a]">
                    {flight.origin}
                  </p>
                  <p className="break-words text-xs text-slate-500">
                    {flight.originCity}
                  </p>
                </div>

                <Plane className="shrink-0 text-violet-500" />

                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#3b2b7a]">
                    {flight.destination}
                  </p>
                  <p className="break-words text-xs text-slate-500">
                    {flight.destinationCity}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <span>
                  Salida: {flight.departureTime ?? "—"}
                </span>
                <span>
                  Llegada: {flight.arrivalTime ?? "—"}
                </span>
              </div>
            </div>

            {/* ASIENTOS */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-bold text-slate-900">
                  <Armchair size={20} className="text-violet-600" />
                  Asientos seleccionados
                </h4>

                <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                  {seats.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {seats.map((seat) => (
                  <span
                    key={seat.databaseId}
                    className="rounded-xl bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700"
                  >
                    {seat.id}
                  </span>
                ))}
              </div>
            </div>

            {/* PRECIO */}
            <div className="space-y-4 border-t border-slate-200 pt-5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tarifa base</span>
                <span>{money(subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Cargos adicionales</span>
                <span>{money(serviceFee)}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-violet-100 p-5">
                <span className="font-bold text-slate-900">
                  Total provisional
                </span>
                <span className="text-xl font-extrabold text-violet-700">
                  {money(total)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
              <CheckCircle2
                size={18}
                className="shrink-0 text-violet-600"
              />
              <span>
                Los asientos seleccionados todavía no
                representan una reserva confirmada.
              </span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
