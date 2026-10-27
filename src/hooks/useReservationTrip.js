import { useLocation } from "react-router-dom";
import useTrips from "./useTrips";

export default function useReservationTrip(reservationId) {
  const location = useLocation();
  const stateTrip = location.state?.trip;
  const needsFetch = String(stateTrip?.reserva_id) !== String(reservationId);
  const { trips, loading, error, reload } = useTrips(needsFetch);
  const trip = needsFetch
    ? trips.find((item) => String(item.reserva_id) === String(reservationId))
    : stateTrip;

  return { trip, loading: needsFetch && loading, error, reload };
}
