import { supabase } from "../lib/supabase";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const { accessToken, preserveMessage = false, ...fetchOptions } = options;
  let token = accessToken;

  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token;
  }

  const headers = new Headers(fetchOptions.headers);
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (fetchOptions.body) headers.set("Content-Type", "application/json");

  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...fetchOptions, headers });
  } catch {
    throw new ApiError("No fue posible conectar con el servidor.");
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : null;
  if (!response.ok) {
    // A rejected/expired bearer token cannot authorize private screens. Let
    // Supabase clear its persisted session; AuthProvider reacts to the event.
    if (response.status === 401) {
      sessionStorage.setItem(
        "airtravel_auth_notice",
        "Tu sesión venció. Inicia sesión nuevamente para continuar.",
      );
      await supabase.auth.signOut();
    }
    throw new ApiError(
      payload?.message || payload?.error || "La solicitud no pudo completarse.",
      response.status,
    );
  }
  if (preserveMessage && payload?.data && !Array.isArray(payload.data)) {
    return {
      ...payload.data,
      message: payload.message ?? payload.data.message,
    };
  }
  return payload?.data ?? payload;
}

export const syncClient = (accessToken) =>
  request("/clientes/sync", { method: "POST", accessToken });
export const getMyProfile = (accessToken) =>
  request("/clientes/me", { accessToken });
export const updateMyProfile = (profile) =>
  request("/clientes/me", { method: "PUT", body: JSON.stringify(profile) });
export const getMyTrips = () => request("/clientes/mis-viajes");
export const cancelReservation = (reservationId) =>
  request(`/clientes/reserva/${reservationId}/cancelar`, { method: "PUT" });
export const registerDepositPayment = ({ reservationId, clienteId, paymentMethodId, amount, reference }) =>
  request(`/clientes/reserva/${reservationId}/pago-deposito`, {
    method: "POST",
    preserveMessage: true,
    body: JSON.stringify({
      cliente_id: clienteId,
      metodo_pago_id: paymentMethodId,
      monto: amount,
      referencia: reference,
    }),
  });

export const getReservationPayments = (reservationId, accessToken) =>
  request(`/clientes/reserva/${reservationId}/pagos`, { accessToken });

export const getPendingReservationSeats = (reservationId, accessToken) =>
  request(`/clientes/reserva/${reservationId}/asientos-pendientes`, { accessToken });

export const confirmReservationPassengers = ({ reservationId, clienteId, passengers }) =>
  request(`/clientes/reserva/${reservationId}/confirmar`, {
    method: "POST",
    preserveMessage: true,
    body: JSON.stringify({
      cliente_id: clienteId,
      pasajeros: passengers,
    }),
  });

export const createTemporaryReservation = ({ clienteId, seatIds }) =>
  request("/clientes/reserva/temporal", {
    method: "POST",
    body: JSON.stringify({
      cliente_id: clienteId,
      vuelos_asientos_id: seatIds,
    }),
  });

export const purchaseReservation = ({
  reservationId,
  clienteId,
  paymentMethodId,
  passengers,
}) => {
  const body = {
    cliente_id: clienteId,
    metodo_pago_id: paymentMethodId,
  };

  if (passengers.length > 0) body.pasajeros = passengers;

  return request(`/clientes/reserva/${reservationId}/compra`, {
    method: "POST",
    body: JSON.stringify(body),
  });
};
