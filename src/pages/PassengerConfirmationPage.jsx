import { useState } from "react";
import { Armchair, CircleAlert, FileCheck2, LoaderCircle, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";
import ActionResultModal from "../components/account/ActionResultModal";
import ReservationActionLayout from "../components/account/ReservationActionLayout";
import { useAuth } from "../context/AuthContext";
import usePendingSeats from "../hooks/usePendingSeats";
import useReservationTrip from "../hooks/useReservationTrip";
import { confirmReservationPassengers } from "../services/apiClient";
import { invalidatePendingSeats } from "../services/pendingSeatsCache";
import { invalidateTripsCache } from "../services/tripsCache";

const passengerFields = ["nombre_pasajero", "apellido_pasajero", "tipo_documento", "numero_documento"];

const fieldLabels = {
  nombre_pasajero: "nombre",
  apellido_pasajero: "apellido",
  tipo_documento: "tipo de documento",
  numero_documento: "número de documento",
};

function pendingSeatDetails(response) {
  return (response?.asientos || [])
    .filter((detail) => detail.vuelo_asiento_id != null)
    .map((detail, index) => ({
      vuelo_asiento_id: detail.vuelo_asiento_id,
      asiento: detail.numero_asiento ?? detail.asiento?.numero ?? detail.asiento ?? `Asiento ${index + 1}`,
      nombre_pasajero: detail.nombre_pasajero || "",
      apellido_pasajero: detail.apellido_pasajero || "",
      tipo_documento: detail.tipo_documento || "",
      numero_documento: detail.numero_documento || "",
    }));
}

function friendlyConfirmationError(error) {
  if (Number(error?.status) === 409) return "La reserva ya no admite cambios o alguno de los datos ya fue confirmado.";
  if (Number(error?.status) === 404) return "No encontramos esta reserva. Vuelve a Mis viajes e inténtalo nuevamente.";
  return "No pudimos confirmar los datos en este momento. Revisa la información e inténtalo nuevamente.";
}

export default function PassengerConfirmationPage() {
  const { reservaId } = useParams();
  const { client } = useAuth();
  const { trip, loading, error } = useReservationTrip(reservaId);
  const { data: pendingSeatData, loading: loadingSeats, error: seatsError } = usePendingSeats(reservaId);
  const pendingDetails = pendingSeatDetails(pendingSeatData);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [resultModal, setResultModal] = useState(null);

  if (loading || loadingSeats) return <ReservationActionLayout trip={trip || { reserva_id: reservaId }} title="Confirmar pasajeros" eyebrow="Datos"><div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-violet-700" size={36} /></div></ReservationActionLayout>;
  if (!trip) return <ReservationActionLayout trip={{ reserva_id: reservaId }} title="Confirmar pasajeros" eyebrow="Datos"><div className="rounded-2xl bg-red-50 p-6 text-center text-red-700"><CircleAlert className="mx-auto" /><p className="mt-3 font-bold">{error || "No encontramos la reserva."}</p></div></ReservationActionLayout>;

  const valuesFor = (detail) => ({ ...detail, ...(form[String(detail.vuelo_asiento_id)] || {}) });
  const updatePassenger = (seatId, field, value) => {
    setForm((current) => ({ ...current, [String(seatId)]: { ...(current[String(seatId)] || {}), [field]: value } }));
    setFormError("");
  };

  const submitPassengers = async (event) => {
    event.preventDefault();
    const clienteId = client?.id ?? client?.cliente_id ?? client?.clienteId;
    const passengers = pendingDetails.map((detail) => {
      const values = valuesFor(detail);
      return Object.fromEntries([
        ["vuelo_asiento_id", detail.vuelo_asiento_id],
        ...passengerFields.map((field) => [field, String(values[field] || "").trim()]),
      ]);
    });

    const firstIncompleteIndex = passengers.findIndex((passenger) =>
      passengerFields.some((field) => !passenger[field]),
    );
    if (firstIncompleteIndex >= 0) {
      const missingFields = passengerFields
        .filter((field) => !passengers[firstIncompleteIndex][field])
        .map((field) => fieldLabels[field]);
      setFormError(`En el asiento ${pendingDetails[firstIncompleteIndex].asiento} falta completar: ${missingFields.join(", ")}.`);
      return;
    }
    if (clienteId == null) {
      setFormError("No pudimos identificar tu cuenta. Inicia sesión nuevamente.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const result = await confirmReservationPassengers({ reservationId: trip.reserva_id, clienteId, passengers });
      invalidatePendingSeats(trip.reserva_id);
      invalidateTripsCache();
      setResultModal({
        title: String(result?.estado || "").toUpperCase() === "CONFIRMADA" ? "Reserva confirmada" : "Datos guardados",
        message: result?.mensaje || result?.message || (String(result?.estado || "").toUpperCase() === "CONFIRMADA" ? "Los datos fueron confirmados y tu reserva está lista." : "Guardamos correctamente la información de los pasajeros."),
      });
    } catch (requestError) {
      setFormError(friendlyConfirmationError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReservationActionLayout trip={trip} title="Confirmar datos de pasajeros" eyebrow="Información de viaje">
      <div className="mb-6 flex gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-violet-800"><UserRound className="shrink-0" size={22} /><div><p className="font-extrabold">Un formulario por asiento</p><p className="mt-1 text-sm">Completa los datos del pasajero que utilizará cada asiento. Todos los campos son obligatorios.</p></div></div>
      {seatsError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><CircleAlert className="mx-auto" size={36} /><h2 className="mt-4 text-xl font-extrabold">No pudimos consultar los asientos</h2><p className="mt-2 text-sm">Vuelve a intentarlo en unos minutos.</p></div>
      ) : pendingDetails.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 p-8 text-center"><FileCheck2 className="mx-auto text-emerald-600" size={38} /><h2 className="mt-4 text-xl font-extrabold text-slate-900">No hay datos pendientes</h2><p className="mt-2 text-sm text-slate-500">Los pasajeros de esta reserva ya tienen su información completa o la reserva no incluye el detalle de asientos.</p></div>
      ) : (
        <form onSubmit={submitPassengers} className="space-y-5">
          {pendingDetails.map((detail, index) => {
            const values = valuesFor(detail);
            return (
              <section key={detail.vuelo_asiento_id} className="overflow-hidden rounded-3xl border border-slate-200">
                <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Armchair size={21} /></span><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pasajero {index + 1}</p><h2 className="font-extrabold text-slate-900">{detail.asiento}</h2></div></header>
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <label className="text-sm font-bold text-slate-700">Nombre<input value={values.nombre_pasajero} onChange={(event) => updatePassenger(detail.vuelo_asiento_id, "nombre_pasajero", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" /></label>
                  <label className="text-sm font-bold text-slate-700">Apellido<input value={values.apellido_pasajero} onChange={(event) => updatePassenger(detail.vuelo_asiento_id, "apellido_pasajero", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" /></label>
                  <label className="text-sm font-bold text-slate-700">Tipo de documento<select value={values.tipo_documento} onChange={(event) => updatePassenger(detail.vuelo_asiento_id, "tipo_documento", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-violet-500"><option value="">Selecciona un tipo</option><option value="PASAPORTE">Pasaporte</option><option value="DPI">DPI</option><option value="OTRO">Otro</option></select></label>
                  <label className="text-sm font-bold text-slate-700">Número de documento<input value={values.numero_documento} onChange={(event) => updatePassenger(detail.vuelo_asiento_id, "numero_documento", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" /></label>
                </div>
              </section>
            );
          })}
          {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{formError}</p>}
          <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">{submitting ? <><LoaderCircle className="animate-spin" size={19} /> Confirmando…</> : <><FileCheck2 size={19} /> Confirmar datos</>}</button>
        </form>
      )}
      <ActionResultModal open={Boolean(resultModal)} title={resultModal?.title} message={resultModal?.message} reservationId={trip.reserva_id} onClose={() => setResultModal(null)} />
    </ReservationActionLayout>
  );
}
