import {
  ChevronRight,
  CreditCard,
  FileCheck2,
  Plane,
  Ticket,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  formatDate,
  formatTime,
  money,
  requiresPassengerConfirmation,
  tripStatus,
} from "../../tools/tripFormatting";

export default function TripCard({ trip }) {
  const navigate = useNavigate();
  const status = tripStatus(trip);
  const direct =
    String(trip.tipo_viaje).toUpperCase() === "DIRECTO" ||
    Number(trip.cantidad_escalas) === 0;
  const flightNumbers = (trip.tramos || [])
    .map((segment) => segment.numero_vuelo)
    .filter(Boolean)
    .join(" · ");
  const goToReservationPage = (path = "") => {
    navigate(`/reservas/${trip.reserva_id}${path}`, { state: { trip } });
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(51,45,120,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(51,45,120,0.13)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
            <Ticket size={21} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400">
              Reserva #{trip.reserva_id}
            </p>
            <p className="truncate text-sm font-bold text-slate-700">
              {flightNumbers || "Air Travel"}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${status.classes}`}
        >
          {status.label}
        </span>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <p className="text-3xl font-black tracking-tight text-slate-900">
              {trip.origen?.codigo_iata || "---"}
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-700">
              {trip.origen?.ciudad || trip.origen?.nombre || "Origen"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {formatTime(trip.fecha_salida)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-violet-500 sm:flex-col sm:gap-1">
            <span className="h-px flex-1 bg-violet-200 sm:h-9 sm:w-px" />
            <Plane size={22} className="rotate-90 sm:rotate-0" />
            <span className="h-px flex-1 bg-violet-200 sm:h-9 sm:w-px" />
          </div>
          <div className="sm:text-right">
            <p className="text-3xl font-black tracking-tight text-slate-900">
              {trip.destino?.codigo_iata || "---"}
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-700">
              {trip.destino?.ciudad || trip.destino?.nombre || "Destino"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {formatTime(trip.fecha_llegada)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-slate-400">
              Salida
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {formatDate(trip.fecha_salida)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wide text-slate-400">
              Trayecto
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {direct
                ? "Directo"
                : `${trip.cantidad_escalas} escala${Number(trip.cantidad_escalas) === 1 ? "" : "s"}`}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wide text-slate-400">
              Método de pago
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-700">
              {trip.metodo_pago || "Por definir"}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-bold tracking-wide text-slate-400">
              Total
            </p>
            <p className="mt-1 text-sm font-black text-violet-700">
              {money(trip.total)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {trip.debe_registrar_pago && (
            <button
              type="button"
              onClick={() => goToReservationPage("/registrar-pago")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-bold text-white transition hover:bg-amber-600"
            >
              <CreditCard size={18} /> Registrar pago
            </button>
          )}
          {requiresPassengerConfirmation(trip) && (
            <button
              type="button"
              onClick={() => goToReservationPage("/confirmar-datos")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <FileCheck2 size={18} /> Confirmar datos
            </button>
          )}
          <button
            type="button"
            onClick={() => goToReservationPage()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 px-5 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
          >
            Ver detalles <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
