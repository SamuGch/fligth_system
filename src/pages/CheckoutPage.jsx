
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

  if (!flight || seats.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
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
    <div className="min-h-screen bg-[#f5f6fb] font-sans">

      {/* NAVBAR */}
    <header className="sticky top-0 z-50 bg-[#3b2b7a] text-white shadow-lg">
        <div className="mx-auto flex px-5 sm:px-8 lg:px-12 items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white p-2">
              <img
                src="/icono.jpg"
                alt="Air Travel"
                className="h-9 w-9 object-contain"
              />
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-widest">
                AIR TRAVEL
              </h1>
              <p className="text-xs text-white/70">
                Vuelos que te llevan más lejos
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-sm font-medium sm:flex">
            <ShieldCheck size={19} />
            Compra segura
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-3">

        {/* REGRESAR */}
        <button
          type="button"
          onClick={goBack}
          className="mb-7 flex items-center gap-2 font-semibold text-[#3b2b7a] transition hover:text-violet-600"
        >
          <ArrowLeft size={20} />
          Volver a selección de asientos
        </button>

        {/* TÍTULO */}
        <div className="mb-3">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-bold text-violet-700">
            <LockKeyhole size={15} />
            PROCESO DE COMPRA
          </div>

          <p className="mt-2 text-slate-500">
            Revisa los detalles de tu vuelo y selecciona tu método de pago.
          </p>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[1.5fr_1fr]">

          {/* COLUMNA DE PAGO */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8">

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
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex items-center gap-3 rounded-2xl border-2 p-5 text-left transition ${
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
                className={`flex items-center gap-3 rounded-2xl border-2 p-5 text-left transition ${
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
                <div className="space-y-5">
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                    <div className="flex items-start gap-3">
                      <LockKeyhole
                        size={22}
                        className="shrink-0 text-violet-700"
                      />
                      <div>
                        <h4 className="font-bold text-violet-900">
                          Pago con tarjeta
                        </h4>
                        <p className="mt-1 text-sm text-violet-700">
                          Aquí se integrará el formulario seguro
                          de la pasarela de pago.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                    <CreditCard
                      size={42}
                      className="mx-auto mb-4 text-violet-600"
                    />

                    <h4 className="font-bold text-slate-800">
                      Formulario de pago seguro
                    </h4>

                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                      Cuando conectemos la pasarela de pago,
                      aquí aparecerán los campos seguros para
                      ingresar la tarjeta.
                    </p>
                  </div>
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
                disabled
                title="Los pagos reales todavía no están habilitados"
                className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#3b2b7a] px-6 py-4 font-bold text-white opacity-60"
              >
                <LockKeyhole size={19} />
                Pagar {money(total)}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              El procesamiento de pagos se habilitará cuando
              integremos una pasarela de pago segura.
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
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="font-bold text-slate-900">
                {flight.airline ?? "Aerolínea"}
              </p>
              <p className="text-sm text-slate-500">
                Vuelo {flight.flightNumber ?? flight.id}
              </p>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold text-[#3b2b7a]">
                    {flight.origin}
                  </p>
                  <p className="text-xs text-slate-500">
                    {flight.originCity}
                  </p>
                </div>

                <Plane className="shrink-0 text-violet-500" />

                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#3b2b7a]">
                    {flight.destination}
                  </p>
                  <p className="text-xs text-slate-500">
                    {flight.destinationCity}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm text-slate-600">
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
