import { ArrowLeft, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccountLayout from "./AccountLayout";

export default function ReservationActionLayout({
  trip,
  title,
  eyebrow,
  children,
}) {
  const navigate = useNavigate();

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
        <header className="bg-[linear-gradient(120deg,#292570,#5147b8)] p-5 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">
            {eyebrow} · Reserva #{trip.reserva_id}
          </p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h1>
          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="text-3xl font-black sm:text-4xl">
                {trip.origen?.codigo_iata || "---"}
              </p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">
                {trip.origen?.ciudad || "Origen"}
              </p>
            </div>
            <Plane size={26} className="text-white/75" />
            <div className="text-right">
              <p className="text-3xl font-black sm:text-4xl">
                {trip.destino?.codigo_iata || "---"}
              </p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">
                {trip.destino?.ciudad || "Destino"}
              </p>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-8">{children}</div>
      </section>
    </AccountLayout>
  );
}
