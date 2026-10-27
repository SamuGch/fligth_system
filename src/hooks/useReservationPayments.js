import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getReservationPayments } from "../services/apiClient";

function paymentSummaryError(error) {
  if (Number(error?.status) === 403) return "No tienes permiso para consultar los pagos de esta reserva.";
  if (Number(error?.status) === 404) return "No encontramos el resumen de pagos de esta reserva.";
  return error?.message || "No pudimos actualizar el resumen de pagos.";
}

export default function useReservationPayments(reservationId) {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!accessToken) return null;
    setLoading(true);
    setError("");
    try {
      const result = await getReservationPayments(reservationId, accessToken);
      setData(result);
      return result;
    } catch (requestError) {
      setError(paymentSummaryError(requestError));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [accessToken, reservationId]);

  useEffect(() => {
    if (!accessToken) return undefined;

    let active = true;
    getReservationPayments(reservationId, accessToken)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setError(paymentSummaryError(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, reservationId]);

  return { data, loading, error, reload };
}
