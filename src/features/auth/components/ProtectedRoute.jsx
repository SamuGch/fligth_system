import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { loading, isAuthenticated, syncStatus } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center text-slate-700">
        Cargando tu sesión…
      </main>
    );
  }

    const backgroundLocation = {
      pathname: "/",
    };

    const redirectState = {
      from: location,
      backgroundLocation,
      returnTo: location.pathname,
    };

    if (location.pathname === "/seleccion-asientos") {
      redirectState.seatSelectionData = location.state;
    }

    if (location.pathname === "/checkout") {
      redirectState.checkoutData = location.state;
    }

    if (!isAuthenticated) {
      return (
        <Navigate
          to="/login"
          replace
          state={redirectState}
        />
      );
    }

  if (syncStatus === "error") {
    return (
      <Navigate
        to="/auth/callback"
        replace
        state={redirectState}
      />
    );
  }
  return <Outlet />;
}
