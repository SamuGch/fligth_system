import { CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ActionResultModal({
  open,
  title,
  message,
  reservationId,
  onClose,
}) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-result-title"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={34} />
        </div>
        <h2
          id="action-result-title"
          className="mt-5 text-2xl font-extrabold text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              navigate(`/reservas/${reservationId}`, { replace: true })
            }
            className="min-h-12 rounded-xl border border-violet-200 px-4 font-bold text-violet-700 hover:bg-violet-50"
          >
            Ver detalles
          </button>
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="min-h-12 rounded-xl bg-violet-700 px-4 font-bold text-white hover:bg-violet-800"
          >
            Buscar otro vuelo
          </button>
        </div>
      </div>
    </div>
  );
}
