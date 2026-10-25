const DEFAULT_MESSAGE =
  "No pudimos completar la solicitud. Inténtalo nuevamente en unos momentos.";

export function reservationErrorMessage(error, operation = "purchase") {
  const status = Number(error?.status);

  if (status === 400) {
    return operation === "reserve"
      ? "Revisa los asientos seleccionados e inténtalo nuevamente."
      : "Revisa la información de la compra e inténtalo nuevamente.";
  }
  if (status === 401) {
    return "Tu sesión venció. Inicia sesión nuevamente para continuar.";
  }
  if (status === 403) {
    return "No podemos realizar esta operación con la reserva actual. Vuelve a iniciar el proceso.";
  }
  if (status === 404) {
    return operation === "reserve"
      ? "Uno de los asientos ya no está disponible. Selecciona tus asientos nuevamente."
      : "No encontramos la reserva solicitada. Vuelve a iniciar el proceso de compra.";
  }
  if (status === 409) {
    return operation === "reserve"
      ? "Uno o más asientos acaban de dejar de estar disponibles. Selecciona otros asientos."
      : "La reserva ya no permite este cambio o la operación ya fue realizada.";
  }
  if (status === 410) {
    return "La reserva expiró. Selecciona nuevamente tus asientos.";
  }
  if (error?.status == null && error?.message === "No fue posible conectar con el servidor.") {
    return "No pudimos conectarnos con el servidor. Revisa tu conexión e inténtalo nuevamente.";
  }

  return DEFAULT_MESSAGE;
}
