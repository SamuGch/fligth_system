import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { loading, isAuthenticated, syncStatus } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="min-h-dvh grid place-items-center text-slate-700">Cargando tu sesión…</main>;
  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, backgroundLocation: { pathname: "/" } }}
      />
    );
  }
  if (syncStatus === "error") {
    return (
      <Navigate
        to="/auth/callback"
        replace
        state={{ from: location, backgroundLocation: { pathname: "/" } }}
      />
    );
  }
  return <Outlet />;
}
