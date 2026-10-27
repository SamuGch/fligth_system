import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCachedPendingSeats, loadPendingSeats } from "../services/pendingSeatsCache";

export default function usePendingSeats(reservationId) {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const cached = getCachedPendingSeats(reservationId, accessToken);
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      setData(await loadPendingSeats(reservationId, accessToken, { force: true }));
    } catch (requestError) {
      setError(requestError.message || "No pudimos obtener los asientos pendientes.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, reservationId]);

  useEffect(() => {
    if (!accessToken) return undefined;
    let active = true;
    loadPendingSeats(reservationId, accessToken)
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError("No pudimos obtener los asientos pendientes.");
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
