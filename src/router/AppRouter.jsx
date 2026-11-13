import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Home from "../Home";
import AuthModal from "../components/auth/AuthModal";
import {
  AuthCallbackModal,
  ConfirmEmailModal,
} from "../components/auth/AuthStatusModals";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import ProfilePage from "../pages/ProfilePage";
import ReservationDetailPage from "../pages/ReservationDetailPage";
import ReservationsPage from "../pages/ReservationsPage";
import SeatSelection from "../pages/SeatSelection";
import CheckoutPage from "../pages/CheckoutPage";
import DepositPaymentPage from "../pages/DepositPaymentPage";
import PassengerConfirmationPage from "../pages/PassengerConfirmationPage";
import FlightSelectionPage from "../pages/FlightSelectionPage";
import HelpPage from "../pages/HelpPage";

export default function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading: authLoading, syncStatus } = useAuth();
  const backgroundLocation = location.state?.backgroundLocation;

  useEffect(() => {
    if (authLoading || !session || syncStatus !== "synced") return;

    const pendingPath = sessionStorage.getItem("oauth_redirect_path");
    if (!pendingPath) return;

    let pendingState = {};
    try {
      pendingState = JSON.parse(
        sessionStorage.getItem("oauth_redirect_state") || "{}",
      );
    } catch (parseError) {
      console.error("No se pudo restaurar el contexto de OAuth.", parseError);
    }

    sessionStorage.removeItem("oauth_redirect_path");
    sessionStorage.removeItem("oauth_redirect_state");
    sessionStorage.removeItem("authRedirect");
    navigate(pendingPath, { state: pendingState, replace: true });
  }, [authLoading, navigate, session, syncStatus]);

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Home />} />
        <Route path="/seleccion-vuelos" element={<FlightSelectionPage />} />
        <Route path="/ayuda" element={<HelpPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/seleccion-asientos" element={<SeatSelection />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/reservas" element={<ReservationsPage />} />
          <Route path="/reservas/:reservaId" element={<ReservationDetailPage />} />
          <Route path="/reservas/:reservaId/registrar-pago" element={<DepositPaymentPage />} />
          <Route path="/reservas/:reservaId/confirmar-datos" element={<PassengerConfirmationPage />} />
          <Route path="/historial-compras" element={<ReservationsPage history />} />
        </Route>

        {/* Permite abrir directamente una URL modal conservando Home detrás. */}
        <Route path="/login" element={<Home />} />
        <Route path="/registro" element={<Home />} />
        <Route path="/auth/callback" element={<Home />} />
        <Route path="/auth/confirm-email" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>

      <Routes>
        <Route path="/login" element={<AuthModal mode="login" />} />
        <Route path="/registro" element={<AuthModal mode="register" />} />
        <Route path="/auth/callback" element={<AuthCallbackModal />} />
        <Route path="/auth/confirm-email" element={<ConfirmEmailModal />} />
      </Routes>
    </>
  );
}
