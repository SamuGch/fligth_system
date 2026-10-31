import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  Download,
  FileCheck2,
  LoaderCircle,
  Plane,
  QrCode,
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
import {
  formatFlightLocation,
  formatFlightOperator,
  getFlightMetadata,
} from "../tools/flightFormatting";

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/70 bg-slate-50/75 p-4 backdrop-blur-sm">
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

function getDisplayRoute(trip) {
  const firstSegment = trip?.tramos?.[0];
  const metadata = getFlightMetadata(firstSegment);
  return {
    origin: metadata.origin.codigo_iata ? metadata.origin : trip?.origen ?? {},
    destination: metadata.destination.codigo_iata ? metadata.destination : trip?.destino ?? {},
  };
}

function ticketSeed(value) {
  return String(value ?? "AIRFLY")
    .split("")
    .reduce((hash, character, index) => ((hash * 31 + character.charCodeAt(0) + index) >>> 0), 2166136261);
}

function TicketQr({ value }) {
  const seed = ticketSeed(value);
  const modules = 21;
  const cells = [];
  const finder = (originRow, originColumn) => {
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const edge = row === 0 || row === 6 || column === 0 || column === 6;
        const center = row >= 2 && row <= 4 && column >= 2 && column <= 4;
        cells.push(
          <rect
            key={`finder-${originRow}-${originColumn}-${row}-${column}`}
            x={(originColumn + column) * 4}
            y={(originRow + row) * 4}
            width="4"
            height="4"
            fill={edge || center ? "#21194d" : "white"}
          />,
        );
      }
    }
  };
  finder(0, 0);
  finder(0, 14);
  finder(14, 0);
  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      const inFinder =
        (row < 8 && column < 8) ||
        (row < 8 && column > 12) ||
        (row > 12 && column < 8);
      if (!inFinder && ((seed + row * 17 + column * 23 + row * column) % 7 < 3)) {
        cells.push(
          <rect key={`cell-${row}-${column}`} x={column * 4} y={row * 4} width="4" height="4" fill="#21194d" />,
        );
      }
    }
  }
  return (
    <svg viewBox="0 0 84 84" role="img" aria-label="Código QR de la reserva" className="h-28 w-28 rounded-xl bg-white p-2">
      <rect width="84" height="84" fill="white" />
      {cells}
    </svg>
  );
}

async function downloadTicket(trip) {
  const route = getDisplayRoute(trip);
  const origin = route.origin?.codigo_iata || "---";
  const destination = route.destination?.codigo_iata || "---";
  const segments = (trip.tramos || []).slice(0, 4);
  const segmentStart = 535;
  const segmentGap = 105;
  const detailsTop = segmentStart + Math.max(segments.length, 1) * segmentGap + 35;
  const qrTop = segmentStart - 15;
  const imageHeight = detailsTop + 220;
  const escapeXml = (value) => String(value ?? "").replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;",
  }[character]));
  const segmentLines = segments.map((segment, index) => {
    const metadata = getFlightMetadata(segment);
    const origin = formatFlightLocation(metadata.origin);
    const destination = formatFlightLocation(metadata.destination);
    const y = segmentStart + index * segmentGap;
    return `<text x="95" y="${y}" font-family="Arial" font-size="22" font-weight="700" fill="#21194d">TRAMO ${index + 1} · ${escapeXml(origin.code)} → ${escapeXml(destination.code)}</text><text x="95" y="${y + 30}" font-family="Arial" font-size="15" fill="#667085">${escapeXml(metadata.number || "Vuelo")} · ${escapeXml(formatFlightOperator(segment))}</text><text x="95" y="${y + 55}" font-family="Arial" font-size="15" fill="#667085">Salida: ${escapeXml(formatDateTime(metadata.departure))}   ·   Llegada: ${escapeXml(formatDateTime(metadata.arrival))} · Terminal ${escapeXml(metadata.terminal || "pendiente")} · Puerta ${escapeXml(metadata.gate || "pendiente")}</text>`;
  }).join("");
  const qrSvg = new XMLSerializer().serializeToString(document.querySelector(`[aria-label="Código QR de la reserva"]`));
  const qrData = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(qrSvg)))}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="${imageHeight}" viewBox="0 0 1400 ${imageHeight}"><rect width="100%" height="100%" fill="#f7f5ff"/><rect x="55" y="45" width="1290" height="110" rx="28" fill="#21194d"/><text x="95" y="95" font-family="Arial" font-size="28" font-weight="700" fill="white">AIR TRAVEL</text><text x="95" y="130" font-family="Arial" font-size="17" fill="#d9d4ff">BOLETO ELECTRÓNICO · RESERVA #${escapeXml(trip.reserva_id)}</text><rect x="55" y="155" width="1290" height="270" rx="28" fill="white"/><text x="95" y="225" font-family="Arial" font-size="22" font-weight="700" fill="#667085">RUTA PRINCIPAL</text><text x="95" y="320" font-family="Arial" font-size="68" font-weight="800" fill="#21194d">${escapeXml(origin)}</text><text x="700" y="320" text-anchor="middle" font-family="Arial" font-size="45" fill="#7455df">✈</text><text x="1240" y="320" text-anchor="end" font-family="Arial" font-size="68" font-weight="800" fill="#21194d">${escapeXml(destination)}</text><text x="95" y="370" font-family="Arial" font-size="18" fill="#667085">${escapeXml(route.origin?.ciudad || "Origen")}</text><text x="1240" y="370" text-anchor="end" font-family="Arial" font-size="18" fill="#667085">${escapeXml(route.destination?.ciudad || "Destino")}</text><rect x="55" y="445" width="1290" height="${imageHeight - 490}" rx="28" fill="white"/>${segmentLines}<image href="${qrData}" x="1080" y="${qrTop}" width="190" height="190"/><text x="95" y="${detailsTop}" font-family="Arial" font-size="20" font-weight="700" fill="#21194d">Resumen de reserva</text><text x="95" y="${detailsTop + 38}" font-family="Arial" font-size="17" fill="#667085">Estado: ${escapeXml(tripStatus(trip).label)}</text><text x="95" y="${detailsTop + 68}" font-family="Arial" font-size="17" fill="#667085">Total: ${escapeXml(money(trip.total))}   ·   Pago: ${escapeXml(trip.metodo_pago || "Pago registrado")}</text><text x="95" y="${detailsTop + 98}" font-family="Arial" font-size="17" fill="#667085">Referencia: ${escapeXml(trip.pago?.referencia || "Sin referencia")}</text><text x="95" y="${detailsTop + 155}" font-family="Arial" font-size="15" fill="#667085">Presenta este boleto junto con un documento de identificación.</text></svg>`;
  const image = new Image();
  image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = imageHeight;
  canvas.getContext("2d").drawImage(image, 0, 0);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `boleto-airfly-${trip.reserva_id}.png`;
  link.click();
}

export default function ReservationDetailPage() {
  const { reservaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
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

  const handleDownloadTicket = async () => {
    if (downloadingTicket) return;
    setDownloadingTicket(true);
    try {
      await downloadTicket(trip);
    } finally {
      setDownloadingTicket(false);
    }
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
  const displayRoute = getDisplayRoute(trip);
  return (
    <AccountLayout>
      <button
        type="button"
        onClick={() => navigate("/reservas")}
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-violet-700"
      >
        <ArrowLeft size={19} /> Volver a mis viajes
      </button>
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/20 bg-slate-950/85 p-5 text-white shadow-[0_20px_55px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
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
              <button type="button" disabled={downloadingTicket} onClick={() => void handleDownloadTicket()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition hover:bg-white/25 disabled:cursor-wait disabled:opacity-70">
                {downloadingTicket ? <><LoaderCircle className="animate-spin" size={18} /> Generando boleto...</> : <><Download size={18} /> Descargar boleto</>}
              </button>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-5">
            <div>
              <p className="text-3xl font-black text-white sm:text-4xl">
                {displayRoute.origin?.codigo_iata || "---"}
              </p>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                {displayRoute.origin?.ciudad || "Origen"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#7455df]">
              <span className="hidden h-px w-10 bg-[#7455df]/30 sm:block" />
              <Plane size={25} />
              <span className="hidden h-px w-10 bg-[#7455df]/30 sm:block" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-white sm:text-4xl">
                {displayRoute.destination?.codigo_iata || "---"}
              </p>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                {displayRoute.destination?.ciudad || "Destino"}
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <div className="grid gap-5 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur-md sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Boleto electrónico</p>
              <h2 className="mt-2 text-xl font-black text-slate-900">Tu viaje está listo para consultar</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Guarda este comprobante y presenta el código junto con tu identificación al momento de viajar.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-violet-800">
                <span className="rounded-full bg-white/80 px-3 py-1.5">Reserva #{trip.reserva_id}</span>
                <span className="rounded-full bg-white/80 px-3 py-1.5">{trip.tramos?.length ?? 0} tramo(s)</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <TicketQr value={`${trip.reserva_id}-${trip.fecha_salida}`} />
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-700"><QrCode size={13} /> Código de embarque</span>
            </div>
          </div>
          {(action === "payment" || trip.debe_registrar_pago) && (
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm sm:flex-row sm:items-center">
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
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm sm:flex-row sm:items-center">
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

          <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur-md sm:p-6">
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
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur-md sm:p-6">
          <h2 className="text-lg font-extrabold text-slate-900">
            Itinerario
          </h2>
          <div className="mt-4 space-y-3">
            {(trip.tramos || []).map((segment, index) => (
              (() => {
                const metadata = getFlightMetadata(segment);
                const origin = formatFlightLocation(metadata.origin);
                const destination = formatFlightLocation(metadata.destination);
                return (
              <div
                key={`${segment.vuelo_id}-${segment.orden}`}
                className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                    Tramo {segment.orden || index + 1}
                  </p>
                  <p className="text-sm font-extrabold text-slate-800">
                    {metadata.number || "Vuelo"} · {formatFlightOperator(segment)}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div>
                    <p className="text-xl font-black text-slate-900">
                      {origin.code}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{origin.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(metadata.departure)}
                    </p>
                  </div>
                  <ArrowRight className="text-violet-500" size={20} />
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">
                      {destination.code}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{destination.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(metadata.arrival)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-500">
                  Terminal {metadata.terminal || "pendiente"} · Puerta {metadata.gate || "pendiente"}
                </p>
              </div>
                );
              })()
            ))}
          </div>
          </div>
          {trip.pago && (
            <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
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
      </div>

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
