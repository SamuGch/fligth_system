import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ModalShell from "./ModalShell";
import { getAuthErrorMessage } from "../../lib/authErrorMessage";

const PENDING_AUTH_REDIRECT_KEY = "airtravel_pending_auth_redirect";
const PENDING_AUTH_REDIRECT_MAX_AGE = 24 * 60 * 60 * 1000;

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
  const { location, navigate, backgroundLocation, close } = useModalNavigation();
  const [isOAuthCallback] = useState(() =>
    Boolean(sessionStorage.getItem("authRedirect")),
  );
  const callbackParams = new URLSearchParams(
    `${location.search.slice(1)}&${location.hash.slice(1)}`,
  );
  const linkError = callbackParams.has("error")
    || callbackParams.has("error_code")
    || callbackParams.has("error_description");

  const [redirectData] = useState(() => {
    try {
      const savedSessionRedirect = sessionStorage.getItem("authRedirect");
      const savedEmailRedirect = localStorage.getItem(PENDING_AUTH_REDIRECT_KEY);
      if (savedSessionRedirect && savedEmailRedirect) {
        localStorage.removeItem(PENDING_AUTH_REDIRECT_KEY);
      }
      const saved = savedSessionRedirect || savedEmailRedirect;

      if (!saved) {
        return {
          backgroundLocation: { pathname: "/" },
        };
      }

      const parsed = JSON.parse(saved);
      if (
        !savedSessionRedirect &&
        parsed.createdAt &&
        Date.now() - parsed.createdAt > PENDING_AUTH_REDIRECT_MAX_AGE
      ) {
        localStorage.removeItem(PENDING_AUTH_REDIRECT_KEY);
        return { backgroundLocation: { pathname: "/" } };
      }

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
  const continueAfterAuth = useCallback(() => {
    if (!completed) return;

    const { backgroundLocation, returnTo, checkoutData, seatSelectionData } =
      redirectData;

    sessionStorage.removeItem("authRedirect");

    // Nuevo flujo
    if (
      returnTo === "/seleccion-asientos" &&
      (seatSelectionData?.flight || seatSelectionData?.outboundFlight)
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

  const verificationFailed =
    (linkError && !session) ||
    (!loading && !session) ||
    (session && syncStatus === "error");
  const requestNewLink = useCallback(() => {
    navigate("/auth/confirm-email", {
      replace: true,
      state: { backgroundLocation },
    });
  }, [backgroundLocation, navigate]);

  const returnToCheckout =
    redirectData.returnTo === "/checkout" &&
    Boolean(redirectData.checkoutData);

  const returnToSeats =
  redirectData.returnTo === "/seleccion-asientos" &&
  Boolean(
    redirectData.seatSelectionData?.flight ||
    redirectData.seatSelectionData?.outboundFlight
  );

  useEffect(() => {
    if (
      completed &&
      redirectData.flow === "email-signup" &&
      returnToSeats
    ) {
      try {
        localStorage.removeItem(PENDING_AUTH_REDIRECT_KEY);
      } catch (storageError) {
        console.error(
          "No se pudo limpiar el viaje guardado tras verificar el correo.",
          storageError,
        );
      }
      continueAfterAuth();
    }
  }, [completed, continueAfterAuth, redirectData.flow, returnToSeats]);

  return (
    <ModalShell
      onClose={completed ? continueAfterAuth : close}
      titleId="auth-status-title"
    >
      <div className="py-8 text-center">
        <h1
          id="auth-status-title"
          className="text-2xl font-bold text-slate-900"
        >
          {verificationFailed
            ? session
              ? "No pudimos preparar tu cuenta"
              : "No pudimos completar la verificación"
            : completed
              ? isOAuthCallback
                ? "Sesión iniciada correctamente"
                : "Correo verificado"
              : "Verificando tu cuenta"}
        </h1>

        <p
          className={`mt-3 ${
            verificationFailed ? "text-red-700" : "text-slate-600"
          }`}
        >
          {session && syncStatus === "error"
            ? error || "Tu correo está verificado, pero no pudimos preparar tu cuenta."
            : verificationFailed
              ? isOAuthCallback
                ? "No pudimos completar el inicio de sesión. Inténtalo de nuevo."
                : "El enlace no es válido o ha caducado. Solicita un nuevo enlace de confirmación."
              : completed
                ? isOAuthCallback
                  ? "Tu cuenta está lista y ya puedes continuar."
                  : "Tu correo está verificado y tu cuenta está lista."
                : "Estamos verificando el enlace y preparando tu cuenta…"}
        </p>

        {completed && (
          <button
            type="button"
            onClick={continueAfterAuth}
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

        {verificationFailed && !session && (
          <button
            type="button"
            onClick={
              isOAuthCallback
                ? () => navigate("/login", { replace: true, state: { backgroundLocation } })
                : requestNewLink
            }
            className="mt-5 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
          >
            {isOAuthCallback ? "Volver a iniciar sesión" : "Solicitar nuevo enlace"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}


export function ConfirmEmailModal() {
  const { location, navigate, backgroundLocation, close } = useModalNavigation();
  const { resendConfirmation } = useAuth();
  const [email, setEmail] = useState(location.state?.email || "");
  const [status, setStatus] = useState({ sending: false, sent: false, error: "" });

  const resend = async (event) => {
    event.preventDefault();
    setStatus({ sending: true, sent: false, error: "" });
    try {
      await resendConfirmation(email.trim());
      setStatus({ sending: false, sent: true, error: "" });
    } catch (resendError) {
      setStatus({
        sending: false,
        sent: false,
        error: getAuthErrorMessage(resendError),
      });
    }
  };

  return (
    <ModalShell onClose={close} titleId="confirm-email-title">
      <div className="py-8 text-center">
        <h1 id="confirm-email-title" className="text-2xl font-bold text-slate-900">
          Confirma tu correo electrónico
        </h1>
        <p className="mt-3 text-slate-600">
          Enviamos un enlace de confirmación
          {location.state?.email ? <> a <strong>{location.state.email}</strong></> : ""}.
          Ábrelo para verificar tu cuenta y completar el registro.
        </p>
        <form className="mt-6 text-left" onSubmit={resend}>
          <label htmlFor="confirmation-email" className="mb-2 block text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <input
            id="confirmation-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setStatus({ sending: false, sent: false, error: "" });
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-violet-700 focus:ring-4 focus:ring-violet-700/10"
          />
          {status.sent && (
            <p role="status" className="mt-3 text-sm text-green-700">
              Si la cuenta está pendiente de confirmación, enviaremos un nuevo enlace.
            </p>
          )}
          {status.error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {status.error}
            </p>
          )}
          <button
            type="submit"
            disabled={status.sending}
            className="mt-4 w-full rounded-xl border border-violet-700 px-5 py-3 font-semibold text-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status.sending ? "Enviando…" : "Reenviar enlace"}
          </button>
        </form>
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
          className="mt-3 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
        >
          Ir a iniciar sesión
        </button>
      </div>
    </ModalShell>
  );
}
