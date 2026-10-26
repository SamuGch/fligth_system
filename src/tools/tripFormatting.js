const tripDateFormatter = new Intl.DateTimeFormat("es-GT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("es-GT", {
  hour: "2-digit",
  minute: "2-digit",
});

const moneyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

const statusOptions = {
  PENDIENTE_PAGO: { label: "Pendiente de pago", classes: "bg-amber-50 text-amber-700 ring-amber-200" },
  PAGO_EN_REVISION: { label: "Pago en revisión", classes: "bg-blue-50 text-blue-700 ring-blue-200" },
  PENDIENTE_DATOS: { label: "Datos pendientes", classes: "bg-orange-50 text-orange-700 ring-orange-200" },
  PENDIENTE_CANCELACION: { label: "Cancelación en revisión", classes: "bg-orange-50 text-orange-700 ring-orange-200" },
  CONFIRMADO: { label: "Viaje confirmado", classes: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  COMPLETADO: { label: "Viaje completado", classes: "bg-slate-100 text-slate-700 ring-slate-200" },
  CANCELADO: { label: "Reserva cancelada", classes: "bg-red-50 text-red-700 ring-red-200" },
  EXPIRADA: { label: "Reserva expirada", classes: "bg-red-50 text-red-700 ring-red-200" },
};

export function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parseDate(value);
  return date ? tripDateFormatter.format(date) : "Fecha pendiente";
}

export function formatTime(value) {
  const date = parseDate(value);
  return date ? timeFormatter.format(date) : "--:--";
}

export function formatDateTime(value) {
  const date = parseDate(value);
  return date ? `${tripDateFormatter.format(date)}, ${timeFormatter.format(date)}` : "No disponible";
}

export function money(value) {
  const number = Number(value);
  return moneyFormatter.format(Number.isFinite(number) ? number : 0);
}

export function tripStatus(trip) {
  const value = String(trip?.estado_resumen || trip?.estado_reserva || "PENDIENTE").toUpperCase();
  return statusOptions[value] || {
    label: value.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()),
    classes: "bg-violet-50 text-violet-700 ring-violet-200",
  };
}

export function requiresPassengerConfirmation(trip) {
  const status = String(trip?.estado_resumen || "").toUpperCase();
  return Boolean(
    trip?.debe_confirmar_datos ??
    trip?.requiere_confirmacion_datos ??
    trip?.debe_completar_pasajeros ??
    status === "PENDIENTE_DATOS",
  );
}

export function tripPhase(trip) {
  const status = String(trip?.estado_resumen || trip?.estado_reserva || "").toUpperCase();
  if (["CANCELADA", "CANCELADO", "EXPIRADA"].includes(status)) return "past";
  const arrival = parseDate(trip?.fecha_llegada);
  return arrival && arrival.getTime() < Date.now() ? "past" : "upcoming";
}
