
import { mockFlights } from "../data/mockFlights";

export function searchFlights({
  origin,
  destination,
  departureDate,
  returnDate,
  tripType,
  passengers,
  seatClass,
}) {
  const findFlights = (from, to, date) => {
    return mockFlights.filter((flight) => {
      const seats = flight.seats[seatClass];

      return (
        flight.origin === from &&
        flight.destination === to &&
        flight.departureDate === date &&
        seats !== undefined &&
        seats.available >= passengers
      );
    });
  };

  return {
    outbound: findFlights(origin, destination, departureDate),
    inbound:
      tripType === "round"
        ? findFlights(destination, origin, returnDate)
        : [],
  };
}
