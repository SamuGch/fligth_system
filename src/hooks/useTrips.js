import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getCachedTrips,
  loadTrips,
} from "../services/tripsCache";

export default function useTrips(enabled = true) {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [trips, setTrips] = useState(() => getCachedTrips(accessToken) || []);
  const [loading, setLoading] = useState(
    () => enabled && Boolean(accessToken) && !getCachedTrips(accessToken),
  );
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      setTrips(await loadTrips(accessToken, { force: true }));
    } catch (requestError) {
      setError(requestError.message || "No pudimos cargar tus viajes.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!enabled || !accessToken) return undefined;
    let active = true;
    loadTrips(accessToken)
      .then((payload) => {
        if (active) setTrips(payload);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "No pudimos cargar tus viajes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accessToken, enabled]);

  return { trips, loading, error, reload: load };
}
