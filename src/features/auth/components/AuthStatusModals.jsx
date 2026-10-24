import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ModalShell from "./ModalShell";

function useModalNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const backgroundLocation = useMemo(
    () => location.state?.backgroundLocation || { pathname: "/" },
    [location.state?.backgroundLocation],
  );
  const close = useCallback(() => {
    navigate(
      {
        pathname: backgroundLocation.pathname || "/",
        search: backgroundLocation.search || "",
        hash: backgroundLocation.hash || "",
      },
      { replace: true, state: backgroundLocation.state },
    );
  }, [backgroundLocation, navigate]);
  return { location, navigate, backgroundLocation, close };
}



export function AuthCallbackModal() {
  const { loading, session, syncStatus, error, syncProfile } = useAuth();
  const { navigate } = useModalNavigation();

  const [redirectData] = useState(() => {
    try {
      const saved = sessionStorage.getItem("authRedirect");

      if (!saved) {
        return {
          backgroundLocation: { pathname: "/" },
        };
      }

      const parsed = JSON.parse(saved);

      // Compatibilidad con el formato anterior.
      if (parsed.pathname) {
        return {
          backgroundLocation: parsed,
        };
      }

      return parsed;
    } catch {
      return {
        backgroundLocation: { pathname: "/" },
      };
    }
  });

  const completed =
    !loading &&
    Boolean(session) &&
    syncStatus === "synced";

  const continueAfterGoogle = useCallback(() => {
    if (!completed) return;

    const { backgroundLocation, returnTo, checkoutData, seatSelectionData } =
      redirectData;

    sessionStorage.removeItem("authRedirect");

    // Nuevo flujo
    if (
      returnTo === "/seleccion-asientos" &&
      seatSelectionData?.flight
    ) {
      navigate("/seleccion-asientos", {
        replace: true,
        state: seatSelectionData,
      });
      return;
    }

    if (returnTo === "/checkout" && checkoutData) {
      navigate("/checkout", {
        replace: true,
        state: checkoutData,
      });

      return;
    }

    navigate(
      {
        pathname: backgroundLocation?.pathname || "/",
        search: backgroundLocation?.search || "",
        hash: backgroundLocation?.hash || "",
      },
      {
        replace: true,
        state: backgroundLocation?.state,
      }
    );
  }, [completed, redirectData, navigate]);

  const returnToCheckout =
    redirectData.returnTo === "/checkout" &&
    Boolean(redirectData.checkoutData);

  const returnToSeats =
  redirectData.returnTo === "/seleccion-asientos" &&
  Boolean(redirectData.seatSelectionData?.flight);

  return (
    <ModalShell
      onClose={continueAfterGoogle}
      titleId="auth-status-title"
    >
      <div className="py-8 text-center">
        <h1
          id="auth-status-title"
          className="text-2xl font-bold text-slate-900"
        >
          {error
            ? "No pudimos completar el acceso"
            : completed
              ? "Sesión iniciada correctamente"
              : "Completando inicio de sesión"}
        </h1>

        <p
          className={`mt-3 ${
            error ? "text-red-700" : "text-slate-600"
          }`}
        >
          {error ||
            (completed
              ? "Ya puedes continuar."
              : "Estamos verificando tu cuenta y preparando tu perfil…")}
        </p>

        {completed && (
          <button
            type="button"
            onClick={continueAfterGoogle}
            className="mt-5 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
          >
            {returnToSeats
              ? "Seleccionar mis asientos"
              :returnToCheckout
              ? "Continuar al pago"
              : "Continuar"}
          </button>
        )}

        {session && syncStatus === "error" && (
          <button
            type="button"
            onClick={() => void syncProfile(session)}
            className="mt-5 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
          >
            Reintentar sincronización
          </button>
        )}
      </div>
    </ModalShell>
  );
}


export function ConfirmEmailModal() {
  const { location, navigate, backgroundLocation, close } = useModalNavigation();
  return (
    <ModalShell onClose={close} titleId="confirm-email-title">
      <div className="py-8 text-center">
        <h1 id="confirm-email-title" className="text-2xl font-bold text-slate-900">
          Revisa tu correo
        </h1>
        <p className="mt-3 text-slate-600">
          Enviamos un enlace de confirmación a {location.state?.email || "tu correo"}.
          Después de confirmarlo podrás iniciar sesión.
        </p>
        <button
          type="button"
          onClick={() =>
            navigate("/login", {
              replace: true,
              state: {
                ...location.state,
                backgroundLocation,
              },
            })
          }
          className="mt-5 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
        >
          Ir a iniciar sesión
        </button>
      </div>
    </ModalShell>
  );
}
