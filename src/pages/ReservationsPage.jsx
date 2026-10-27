import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CircleAlert, LoaderCircle, Plane, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import AccountLayout from "../components/account/AccountLayout";
import TripCard from "../components/account/TripCard";
import useTrips from "../hooks/useTrips";
import { tripCategory } from "../tools/tripFormatting";

function EmptyTrips() {
  return (
    <div className="rounded-3xl border border-dashed border-violet-200 bg-white/80 px-5 py-14 text-center shadow-sm sm:py-20">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-100 text-violet-700"><Plane size={30} /></div>
      <h2 className="mt-5 text-xl font-extrabold text-slate-900">Aún no tienes viajes</h2>
      <Link to="/" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 font-bold text-white transition hover:bg-violet-800">Buscar un vuelo, y reserva tu asiento :3 <ArrowRight size={18} /></Link>
    </div>
  );
}

export default function ReservationsPage() {
  const { trips, loading, error, reload } = useTrips();
  const [filter, setFilter] = useState("all");
  const visibleTrips = useMemo(() => {
    if (filter === "all") return trips;
    return trips.filter((trip) => tripCategory(trip) === filter);
  }, [filter, trips]);

  return (
    <AccountLayout>
      <div className="mb-7 flex flex-col justify-between gap-5 sm:mb-9 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Tu próxima aventura</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Mis viajes</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">Consulta tus reservas, revisa el estado de pago y encuentra los datos esenciales de cada vuelo.</p></div>
        <Link to="/" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white transition hover:bg-violet-800"><Plane size={18} /> Buscar vuelos</Link>
      </div>

      {!loading && !error && trips.length > 0 && <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar viajes">{[["all", "Todos"], ["confirmed", "Confirmados"], ["pending_confirmation", "Pendientes de confirmación"], ["cancelled", "Cancelados o expirados"]].map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-10 shrink-0 rounded-full px-5 text-sm font-bold transition ${filter === value ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300"}`}>{label}</button>)}</div>}
      {loading && <div className="grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white text-center shadow-sm"><div><LoaderCircle className="mx-auto animate-spin text-violet-700" size={34} /><p className="mt-3 text-sm font-semibold text-slate-500">Cargando tus viajes…</p></div></div>}
      {!loading && error && <div className="rounded-3xl border border-red-100 bg-white px-5 py-12 text-center shadow-sm"><CircleAlert className="mx-auto text-red-500" size={36} /><h2 className="mt-4 text-lg font-extrabold text-slate-900">No pudimos cargar tus viajes</h2><p role="alert" className="mt-2 text-sm text-slate-500">{error}</p><button type="button" onClick={() => void reload()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white"><RefreshCw size={17} /> Intentar de nuevo</button></div>}
      {!loading && !error && trips.length === 0 && <EmptyTrips />}
      {!loading && !error && trips.length > 0 && visibleTrips.length === 0 && <div className="rounded-3xl border border-slate-200 bg-white px-5 py-12 text-center"><CalendarDays className="mx-auto text-violet-400" size={34} /><p className="mt-3 font-bold text-slate-700">No hay viajes en esta categoría.</p></div>}
      {!loading && !error && visibleTrips.length > 0 && <div className="grid gap-5">{visibleTrips.map((trip) => <TripCard key={trip.reserva_id} trip={trip} />)}</div>}
    </AccountLayout>
  );
}
