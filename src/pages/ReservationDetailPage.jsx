import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  FileCheck2,
  LoaderCircle,
  Plane,
  Route,
  X,
  XCircle,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { cancelReservation } from "../services/apiClient";
import AccountLayout from "../components/account/AccountLayout";
import useTrips from "../hooks/useTrips";
import { invalidateTripsCache } from "../services/tripsCache";
import {
  formatDateTime,
  money,
  requiresPassengerConfirmation,
  tripStatus,
} from "../tools/tripFormatting";

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <Icon className="mt-0.5 shrink-0 text-violet-600" size={20} />
      <div>
        <p className="text-xs font-bold tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function cancellationErrorMessage(requestError) {
  const message = String(requestError?.message || "").toLowerCase();
  if (Number(requestError?.status) === 404)
    return "No encontramos esta reserva. Actualiza la página o vuelve a Mis viajes.";
  if (Number(requestError?.status) === 403)
    return "No pudimos cancelar esta reserva desde tu cuenta. Si necesitas ayuda, comunícate con nuestro equipo de atención.";
  if (Number(requestError?.status) === 409 && message.includes("tramo"))
    return "Este viaje ya comenzó y no puede cancelarse desde aquí. Comunícate con nuestro equipo de atención para recibir ayuda.";
  if (Number(requestError?.status) === 409)
    return "Esta reserva ya no admite cancelación o tiene una solicitud en revisión.";
  if (Number(requestError?.status) === 401)
    return "Tu sesión terminó. Inicia sesión nuevamente para continuar.";
  return "No pudimos procesar la cancelación en este momento. Inténtalo nuevamente en unos minutos.";
}

export default function ReservationDetailPage() {
  const { reservaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(null);
  const [updatedTrip, setUpdatedTrip] = useState(null);
  const stateTrip = location.state?.trip;
  const needsFetch = String(stateTrip?.reserva_id) !== String(reservaId);
  const { trips, loading, error, reload } = useTrips(needsFetch);
  const fetchedTrip = needsFetch
    ? trips.find((item) => String(item.reserva_id) === String(reservaId))
    : stateTrip;
  const trip = updatedTrip || fetchedTrip;
  const action = location.state?.action;

  const openCancellationModal = () => {
    setCancelFeedback(null);
    setCancelModalOpen(true);
  };

  const closeCancellationModal = () => {
    if (!cancelling) setCancelModalOpen(false);
  };

  const confirmCancellation = async () => {
    setCancelling(true);
    setCancelFeedback(null);
    try {
      const result = await cancelReservation(trip.reserva_id);
      const nextStatus = String(result?.estado || "CANCELADA").toUpperCase();
      invalidateTripsCache();
      setUpdatedTrip({
        ...trip,
        estado_reserva: nextStatus,
        estado_resumen: nextStatus,
        puede_cancelar: false,
        debe_registrar_pago: false,
        debe_confirmar_datos: false,
        requiere_confirmacion_datos: false,
        debe_completar_pasajeros: false,
      });
      setCancelFeedback({
        type: "success",
        title:
          nextStatus === "PENDIENTE_CANCELACION"
            ? "Solicitud recibida"
            : "Reserva cancelada",
        message:
          nextStatus === "PENDIENTE_CANCELACION"
            ? "Nuestro equipo revisará la solicitud. Tus asientos continuarán reservados hasta que finalice la revisión."
            : "Tu reserva fue cancelada y los asientos quedaron disponibles nuevamente.",
      });
    } catch (requestError) {
      setCancelFeedback({
        type: "error",
        title: "No pudimos cancelar la reserva",
        message: cancellationErrorMessage(requestError),
      });
    } finally {
      setCancelling(false);
    }
  };

  if ((needsFetch && loading) || (!trip && loading))
    return (
      <AccountLayout>
        <div className="grid min-h-72 place-items-center">
          <LoaderCircle className="animate-spin text-violet-700" size={36} />
        </div>
      </AccountLayout>
    );

  if (!trip) {
    return (
      <AccountLayout>
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <CircleAlert className="mx-auto text-red-500" size={36} />
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">
            No encontramos esta reserva
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {error || "Es posible que ya no esté disponible."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/reservas")}
              className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white"
            >
              Volver a mis viajes
            </button>
            {error && (
              <button
                type="button"
                onClick={() => void reload()}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </AccountLayout>
    );
  }

  const status = tripStatus(trip);
  return (
    <AccountLayout>
      <button
        type="button"
        onClick={() => navigate("/reservas")}
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-600 transition hover:text-violet-700"
      >
        <ArrowLeft size={19} /> Volver a mis viajes
      </button>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(51,45,120,0.10)]">
        <div className="bg-[linear-gradient(120deg,#292570,#5147b8)] p-5 text-white sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">
                Reserva #{trip.reserva_id}
              </p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                Detalles de tu viaje
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span
                className={`rounded-full bg-white px-3 py-1.5 text-xs font-bold ${status.classes
                  .split(" ")
                  .filter((value) => value.startsWith("text-"))
                  .join(" ")}`}
              >
                {status.label}
              </span>
              {trip.puede_cancelar === true && (
                <button
                  type="button"
                  onClick={openCancellationModal}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <XCircle size={18} /> Cancelar reserva
                </button>
              )}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="text-3xl font-black sm:text-4xl">
                {trip.origen?.codigo_iata || "---"}
              </p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">
                {trip.origen?.ciudad || "Origen"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <span className="hidden h-px w-10 bg-white/35 sm:block" />
              <Plane size={25} />
              <span className="hidden h-px w-10 bg-white/35 sm:block" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-black sm:text-4xl">
                {trip.destino?.codigo_iata || "---"}
              </p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">
                {trip.destino?.ciudad || "Destino"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          {(action === "payment" || trip.debe_registrar_pago) && (
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 sm:flex-row sm:items-center">
              <CreditCard className="shrink-0" size={22} />
              <div className="flex-1">
                <p className="font-extrabold">
                  Esta reserva necesita registrar el pago
                </p>
                <p className="mt-1 text-sm leading-5">
                  Revisa la reserva y conserva la referencia o boleta del
                  depósito. El registro se realiza sobre esta reserva.
                </p>
              </div>
              <button type="button" onClick={() => navigate(`/reservas/${trip.reserva_id}/registrar-pago`, { state: { trip } })} className="min-h-11 shrink-0 rounded-xl bg-amber-500 px-5 text-sm font-bold text-white hover:bg-amber-600">Registrar pago</button>
            </div>
          )}
          {requiresPassengerConfirmation(trip) && (
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 sm:flex-row sm:items-center">
              <FileCheck2 className="shrink-0" size={22} />
              <div className="flex-1">
                <p className="font-extrabold">
                  Confirma los datos de los pasajeros
                </p>
                <p className="mt-1 text-sm leading-5">
                  Verifica nombres y documentos antes de confirmar la
                  información de la reserva.
                </p>
              </div>
              <button type="button" onClick={() => navigate(`/reservas/${trip.reserva_id}/confirmar-datos`, { state: { trip } })} className="min-h-11 shrink-0 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">Confirmar datos</button>
            </div>
          )}

          <h2 className="text-lg font-extrabold text-slate-900">
            Información general
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailItem
              icon={CalendarDays}
              label="Salida"
              value={formatDateTime(trip.fecha_salida)}
            />
            <DetailItem
              icon={Clock3}
              label="Llegada"
              value={formatDateTime(trip.fecha_llegada)}
            />
            <DetailItem
              icon={Route}
              label="Tipo de viaje"
              value={
                Number(trip.cantidad_escalas) === 0
                  ? "Vuelo directo"
                  : `${trip.cantidad_escalas} escala${Number(trip.cantidad_escalas) === 1 ? "" : "s"}`
              }
            />
            <DetailItem
              icon={CreditCard}
              label="Total"
              value={`${money(trip.total)} · ${trip.metodo_pago || "Pago por definir"}`}
            />
          </div>

          <h2 className="mt-8 text-lg font-extrabold text-slate-900">
            Itinerario
          </h2>
          <div className="mt-4 space-y-3">
            {(trip.tramos || []).map((segment, index) => (
              <div
                key={`${segment.vuelo_id}-${segment.orden}`}
                className="rounded-2xl border border-slate-200 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                    Tramo {segment.orden || index + 1}
                  </p>
                  <p className="text-sm font-extrabold text-slate-800">
                    {segment.numero_vuelo || "Vuelo"} ·{" "}
                    {segment.aerolinea || "Air Travel"}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div>
                    <p className="text-xl font-black text-slate-900">
                      {segment.origen?.codigo_iata || "---"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(segment.fecha_salida)}
                    </p>
                  </div>
                  <ArrowRight className="text-violet-500" size={20} />
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">
                      {segment.destino?.codigo_iata || "---"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(segment.fecha_llegada)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {trip.pago && (
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center gap-2 font-extrabold text-blue-900">
                <CheckCircle2 size={20} /> Pago registrado
              </div>
              <div className="mt-3 grid gap-2 text-sm text-blue-800 sm:grid-cols-3">
                <p>
                  <span className="font-bold">Estado:</span> {trip.pago.estado}
                </p>
                <p>
                  <span className="font-bold">Referencia:</span>{" "}
                  {trip.pago.referencia || "Sin referencia"}
                </p>
                <p>
                  <span className="font-bold">Fecha:</span>{" "}
                  {formatDateTime(trip.pago.fecha_pago)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {cancelModalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-reservation-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCancellationModal();
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            {!cancelling && (
              <button
                type="button"
                onClick={closeCancellationModal}
                aria-label="Cerrar"
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            )}

            {cancelFeedback?.type === "success" ? (
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={34} />
                </div>
                <h2
                  id="cancel-reservation-title"
                  className="mt-5 text-2xl font-extrabold text-slate-900"
                >
                  {cancelFeedback.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {cancelFeedback.message}
                </p>
                <button
                  type="button"
                  onClick={closeCancellationModal}
                  className="mt-7 min-h-12 w-full rounded-xl bg-violet-700 px-5 font-bold text-white transition hover:bg-violet-800"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <div className="grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
                  <XCircle size={30} />
                </div>
                <h2
                  id="cancel-reservation-title"
                  className="mt-5 pr-8 text-2xl font-extrabold text-slate-900"
                >
                  ¿Cancelar esta reserva?
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Esta acción puede liberar tus asientos. Si tu reserva ya está
                  confirmada, nuestro equipo deberá revisar la solicitud antes
                  de completar la cancelación.
                </p>

                {cancelFeedback?.type === "error" && (
                  <div
                    role="alert"
                    className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
                  >
                    <p className="font-bold">{cancelFeedback.title}</p>
                    <p className="mt-1 text-sm leading-5">
                      {cancelFeedback.message}
                    </p>
                  </div>
                )}

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={closeCancellationModal}
                    className="min-h-12 flex-1 rounded-xl border border-slate-200 px-5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Conservar viaje
                  </button>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => void confirmCancellation()}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {cancelling ? (
                      <>
                        <LoaderCircle className="animate-spin" size={19} />{" "}
                        Cancelando…
                      </>
                    ) : (
                      <>
                        <XCircle size={19} /> Sí, cancelar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
