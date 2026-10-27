import { useMemo, useState } from "react";
import { CircleAlert, CreditCard, Landmark, LoaderCircle, ReceiptText } from "lucide-react";
import { useParams } from "react-router-dom";
import ActionResultModal from "../components/account/ActionResultModal";
import ReservationActionLayout from "../components/account/ReservationActionLayout";
import { GUATEMALAN_BANKS } from "../config/banks";
import { PAYMENT_METHOD_IDS } from "../config/paymentMethods";
import { useAuth } from "../context/AuthContext";
import useReservationPayments from "../hooks/useReservationPayments";
import useReservationTrip from "../hooks/useReservationTrip";
import { registerDepositPayment } from "../services/apiClient";
import { invalidateTripsCache } from "../services/tripsCache";
import { formatDateTime, money } from "../tools/tripFormatting";

function paymentRecords(trip) {
  const records = trip?.depositos ?? trip?.pagos;
  if (Array.isArray(records)) return records;
  return trip?.pago ? [trip.pago] : [];
}

function friendlyPaymentError(error) {
  if (Number(error?.status) === 409) return "Este depósito ya fue registrado o la reserva ya no admite nuevos pagos.";
  if (Number(error?.status) === 404) return "No encontramos esta reserva. Vuelve a Mis viajes e inténtalo nuevamente.";
  return "No pudimos registrar el depósito en este momento. Revisa la referencia e inténtalo nuevamente.";
}

export default function DepositPaymentPage() {
  const { reservaId } = useParams();
  const { client } = useAuth();
  const { trip, loading, error } = useReservationTrip(reservaId);
  const { data: paymentSummary, loading: loadingPayments, error: paymentsError, reload: reloadPayments } = useReservationPayments(reservaId);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [resultModal, setResultModal] = useState(null);

  const records = useMemo(() => paymentSummary?.pagos ?? paymentRecords(trip), [paymentSummary, trip]);
  const calculatedApproved = records
    .filter((payment) => ["APROBADO", "CONFIRMADO"].includes(String(payment.estado).toUpperCase()))
    .reduce((sum, payment) => sum + Number(payment.monto || 0), 0);
  const approvedTotal = Number(paymentSummary?.monto_pagado ?? trip?.monto_aprobado ?? calculatedApproved);
  const pendingReviewTotal = records
    .filter((payment) => String(payment.estado).toUpperCase() === "PENDIENTE")
    .reduce((sum, payment) => sum + Number(payment.monto || 0), 0);
  const reservationTotal = Number(paymentSummary?.total_reserva ?? trip?.total ?? 0);
  const remaining = Math.max(0, Number(paymentSummary?.saldo_pendiente ?? trip?.saldo_pendiente ?? reservationTotal - approvedTotal));
  const paymentComplete = Boolean(paymentSummary?.pago_completo ?? (reservationTotal > 0 && remaining === 0));

  if (loading || loadingPayments) return <ReservationActionLayout trip={trip || { reserva_id: reservaId }} title="Registrar depósito" eyebrow="Pago"><div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-violet-700" size={36} /></div></ReservationActionLayout>;
  if (!trip) return <ReservationActionLayout trip={{ reserva_id: reservaId }} title="Registrar depósito" eyebrow="Pago"><div className="rounded-2xl bg-red-50 p-6 text-center text-red-700"><CircleAlert className="mx-auto" /><p className="mt-3 font-bold">{error || "No encontramos la reserva."}</p></div></ReservationActionLayout>;

  const clienteId = client?.id ?? client?.cliente_id ?? client?.clienteId;
  const paymentMethodId = trip.metodo_pago_id ?? PAYMENT_METHOD_IDS.deposit;

  const submitDeposit = async (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!reference.trim() || !bank || !Number.isFinite(numericAmount) || numericAmount <= 0 || submitting) return;
    if (clienteId == null) {
      setFormError("No pudimos identificar tu cuenta. Inicia sesión nuevamente.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await registerDepositPayment({ reservationId: trip.reserva_id, clienteId, paymentMethodId, amount: numericAmount, reference: reference.trim() });
      setReference("");
      setAmount("");
      invalidateTripsCache();
      try {
        const updatedSummary = await reloadPayments();
        if (updatedSummary?.pago_completo) {
          setResultModal({
            title: "Pago completado",
            message: "El monto pagado ya cubre el total de tu reserva. Puedes consultar todos los detalles de tu compra.",
          });
        }
      } catch {
        setFormError("El depósito fue registrado, pero no pudimos actualizar el resumen. Recarga la página para consultar el saldo actual.");
      }
    } catch (requestError) {
      setFormError(friendlyPaymentError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReservationActionLayout trip={trip} title="Registrar depósito" eyebrow="Pago bancario">
      {paymentsError && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">{paymentsError}</p>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
        <form onSubmit={submitDeposit} className="rounded-3xl border border-slate-200 p-5 sm:p-7">
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><Landmark size={24} /></div><div><h2 className="text-xl font-extrabold text-slate-900">Boleta de depósito</h2><p className="text-sm text-slate-500">Ingresa la referencia exactamente como aparece en tu comprobante.</p></div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Banco<select required value={bank} onChange={(event) => setBank(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-violet-500"><option value="">Selecciona un banco</option>{GUATEMALAN_BANKS.map((bankName) => <option key={bankName} value={bankName}>{bankName}</option>)}</select></label>
            <label className="text-sm font-bold text-slate-700">Monto depositado<input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" /></label>
          </div>
          <label className="mt-4 block text-sm font-bold text-slate-700">Número de referencia<input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ej. BOLETA-BANRURAL-987654" className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100" /></label>
          <p className="mt-3 text-xs leading-5 text-slate-500">Los depósitos pendientes de revisión todavía no reducen el saldo. El saldo se actualiza cuando un depósito es aprobado.</p>
          {formError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{formError}</p>}
          <button type="submit" disabled={submitting || !reference.trim() || !bank || Number(amount) <= 0 || paymentComplete} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><LoaderCircle className="animate-spin" size={19} /> Registrando…</> : paymentComplete ? <><CreditCard size={19} /> Pago completado</> : <><CreditCard size={19} /> Registrar depósito</>}</button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-3xl border-2 border-violet-300 bg-white p-5 shadow-sm shadow-violet-100 sm:p-6"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Resumen</p><div className="mt-4 space-y-3 text-sm text-slate-600"><div className="flex justify-between gap-3"><span>Total de la reserva</span><strong className="text-blue-700">{money(reservationTotal)}</strong></div><div className="flex justify-between gap-3"><span>Depósitos aprobados</span><strong className="text-blue-700">{money(approvedTotal)}</strong></div><div className="flex justify-between gap-3"><span>En revisión</span><strong className="text-blue-700">{money(pendingReviewTotal)}</strong></div><div className="flex justify-between gap-3 border-t border-violet-200 pt-3 font-bold text-violet-800"><span>Saldo pendiente</span><strong className="text-blue-700">{money(remaining)}</strong></div></div></div>
          <div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center gap-2 font-extrabold text-slate-900"><ReceiptText size={20} className="text-violet-600" /> Depósitos registrados</div>{records.length === 0 ? <p className="mt-4 text-sm text-slate-500">Todavía no hay depósitos registrados.</p> : <div className="mt-4 space-y-3">{records.map((payment, index) => <div key={payment.id ?? `${payment.referencia}-${index}`} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="break-all text-sm font-bold text-slate-700">{payment.referencia || `Depósito ${index + 1}`}</p><span className="text-sm font-black text-violet-700">{money(payment.monto)}</span></div>{payment.banco && <p className="mt-1 text-xs font-medium text-slate-500">{payment.banco}</p>}<p className="mt-1 text-xs text-slate-400">{formatDateTime(payment.fecha_pago)} · {payment.estado || "En revisión"}</p></div>)}</div>}</div>
        </aside>
      </div>
      <ActionResultModal open={Boolean(resultModal)} title={resultModal?.title} message={resultModal?.message} reservationId={trip.reserva_id} onClose={() => setResultModal(null)} />
    </ReservationActionLayout>
  );
}
