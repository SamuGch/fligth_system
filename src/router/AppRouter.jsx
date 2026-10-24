import { Route, Routes, useLocation } from "react-router-dom";
import Home from "../Home";
import AuthModal from "../features/auth/components/AuthModal";
import {
  AuthCallbackModal,
  ConfirmEmailModal,
} from "../features/auth/components/AuthStatusModals";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import {
  ProfilePage,
  ReservationsPage,
} from "../features/account/pages/AccountPages";
import SeatSelection from "../pages/SeatSelection";
import CheckoutPage from "../pages/CheckoutPage";

export default function AppRouter() {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Home />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/reservas" element={<ReservationsPage />} />
          <Route path="/historial-compras" element={<ReservationsPage history />} />
          <Route path="/seleccion-asientos" element={<SeatSelection />} />
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
