import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ModalShell from "./ModalShell";

import {
  Mail,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";

const inputClass = `
  w-full
  rounded-2xl
  border border-[#DCE3EF]
  bg-white
  pl-12 pr-12 py-3 sm:py-3.5
  text-[14px] sm:text-[15px]
  font-normal
  text-[#101936]
  placeholder:text-[#94A3B8]
  outline-none
  transition-all duration-200
  hover:border-[#B8C3DB]
  focus:border-[#3333CC]
  focus:ring-4 focus:ring-[#3333CC]/10
`;

export default function AuthModal({ mode, onClose, onAuthenticated }) {
  const isRegister = mode === "register";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const sessionNotice = isRegister
    ? ""
    : sessionStorage.getItem("airtravel_auth_notice") || "";

  const { signIn, signUp, signInWithGoogle, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmation: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: false,
  });
  const backgroundLocation = useMemo(
    () => location.state?.backgroundLocation || { pathname: "/" },
    [location.state?.backgroundLocation],
  );

  const close = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    sessionStorage.removeItem("airtravel_auth_notice");
    navigate(
      {
        pathname: backgroundLocation.pathname || "/",
        search: backgroundLocation.search || "",
        hash: backgroundLocation.hash || "",
      },
      { replace: true, state: backgroundLocation.state },
    );
  }, [backgroundLocation, navigate, onClose]);

  const continueAfterAuth = useCallback(() => {
    const returnTo = location.state?.returnTo;
    const checkoutData = location.state?.checkoutData;
    const seatSelectionData = location.state?.seatSelectionData;

     // Nuevo flujo: autenticación antes de seleccionar asientos
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

    close();
  }, [location.state, navigate, close]);

  const switchMode = () => {
    navigate(isRegister ? "/login" : "/registro", {
      replace: true,
      state: {
        ...location.state,
        backgroundLocation,
      },
    });
  };

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    sessionStorage.removeItem("airtravel_auth_notice");
    if (isRegister && form.password !== form.confirmation) {
      setStatus({ loading: false, error: "Las contraseñas no coinciden.", success: false });
      return;
    }
    if (form.password.length < 6) {
      setStatus({
        loading: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
        success: false,
      });
      return;
    }

    setStatus({ loading: true, error: "", success: false });
    try {
      if (isRegister) {
        const data = await signUp(form);
        if (!data.session) {
          navigate("/auth/confirm-email", {
            replace: true,
            state: {
              ...location.state,
              email: form.email,
              backgroundLocation,
            },
          });
          return;
        }
      } else {
        await signIn(form.email, form.password);
      }
      if (onAuthenticated) {
        onAuthenticated();
        return;
      }
      setStatus({ loading: false, error: "", success: true });
    } catch (authError) {
      setStatus({
        loading: false,
        error: authError.message || "No fue posible completar la solicitud.",
        success: false,
      });
    }
  };

  const continueWithGoogle = async () => {
    setStatus({ loading: true, error: "", success: false });
    try {
      sessionStorage.setItem(
        "authRedirect",
        JSON.stringify({
          backgroundLocation,
          returnTo: location.state?.returnTo,
          checkoutData: location.state?.checkoutData,
          seatSelectionData: location.state?.seatSelectionData,
        }),
      );
      await signInWithGoogle();
    } catch (authError) {
      setStatus({ loading: false, error: authError.message, success: false });
    }
  };

  if (status.success) {
    return (
      <ModalShell onClose={close} titleId="auth-success-title">
        <div className="py-8 text-center">
          <h1 id="auth-success-title" className="text-2xl font-bold text-slate-900">
            Sesión iniciada correctamente
          </h1>
          <button
            type="button"
            onClick={continueAfterAuth}
            className="mt-5 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
          >
            {location.state?.returnTo === "/seleccion-asientos" && location.state?.seatSelectionData?.flight
              ? "Seleccionar mis asientos"
              : location.state?.returnTo === "/checkout"
              ? "Continuar al pago"
              : "Continuar"}
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={close} titleId="auth-modal-title">
      <h1 id="auth-modal-title" className=" pr-10 text-[26px] sm:text-[32px] font-bold tracking-[-0.03em] leading-tight  text-[#101936] " >
        {isRegister ? "Crea tu cuenta" : "Bienvenido"}
      </h1>
      <p className=" mt-2 text-[14px] sm:text-[15px] font-normal leading-relaxed text-[#64748B] ">
        {isRegister
          ? "Regístrate para administrar tus viajes."
          : "Inicia sesión para continuar."}
      </p>

      {!isSupabaseConfigured && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Falta configurar Supabase en este entorno.
        </p>
      )}
      {sessionNotice && !status.error && (
        <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {sessionNotice}
        </p>
      )}
      {status.error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {status.error}
        </p>
      )}

      <form
        className="mt-5 sm:mt-7 space-y-3 sm:space-y-4"
        onSubmit={submit}
      >
        {isRegister && (
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 sm:gap-3">

            {/* Nombre */}
            <div className="relative group min-w-0">
              <UserRound
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] group-focus-within:text-[#3333CC] pointer-events-none transition-colors" />

              <input
                required
                type="text"
                name="firstName"
                autoComplete="given-name"
                value={form.firstName}
                onChange={update}
                placeholder="Nombre"
                className={inputClass}
              />
            </div>

            {/* Apellido */}
            <div className="relative group min-w-0">
              <UserRound
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] group-focus-within:text-[#3333CC] pointer-events-none transition-colors" />

              <input
                required
                type="text"
                name="lastName"
                autoComplete="family-name"
                value={form.lastName}
                onChange={update}
                placeholder="Apellido"
                className={inputClass}
              />
            </div>

          </div>
        )}

        <div className="relative group">
          <Mail
            className=" absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]  group-focus-within:text-[#3333CC] pointer-events-none transition-colors "
          />

          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={update}
            placeholder="Correo electrónico"
            className={inputClass}
          />
        </div>

        <div className="relative group">
          <LockKeyhole
            className=" absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] group-focus-within:text-[#3333CC]  pointer-events-none transition-colors " />

          <input
            required
            minLength="6"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete={
              isRegister ? "new-password" : "current-password"
            }
            value={form.password}
            onChange={update}
            placeholder="Contraseña"
            className={`${inputClass} pr-12`}
          />


          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword
                ? "Ocultar contraseña"
                : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            className="
                      absolute right-4 top-1/2
                      -translate-y-1/2
                      flex items-center justify-center
                      text-[#64748B]
                      hover:text-[#3333CC]
                      transition-colors
                      cursor-pointer
                    ">
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>

        </div>



        {isRegister && (

          <div className="relative group">
            <LockKeyhole
              className=" absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]  group-focus-within:text-[#3333CC] pointer-events-none transition-colors "
            />

            <input required type={showConfirmation ? "text" : "password"} name="confirmation" autoComplete="new-password" value={form.confirmation} onChange={update} placeholder="Confirmar contraseña" className={`${inputClass} pr-12`} />


            <button
              type="button"
              onClick={() => setShowConfirmation(!showConfirmation)}
              aria-label={
                showConfirmation
                  ? "Ocultar confirmación de contraseña"
                  : "Mostrar confirmación de contraseña"
              }
              aria-pressed={showConfirmation}
              className="
                          absolute right-4 top-1/2
                          -translate-y-1/2
                          flex items-center justify-center
                          text-[#64748B]
                          hover:text-[#3333CC]
                          transition-colors
                          cursor-pointer ">
              {showConfirmation ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>


          </div>
        )}

        <button
          type="submit"
          disabled={status.loading || !isSupabaseConfigured}
          className="
                      group
                      w-full
                      flex items-center justify-center gap-3
                      rounded-2xl
                      px-5 py-3.5
                      bg-gradient-to-r
                      from-[#7500F5]
                      to-[#333399]
                      text-white
                      text-[15px]
                      font-semibold
                      shadow-[0_8px_22px_rgba(51,51,153,0.25)]
                      transition-all duration-300
                      hover:from-[#6900DE]
                      hover:to-[#28287F]
                      hover:shadow-[0_10px_26px_rgba(51,51,153,0.35)]
                      active:scale-[0.99]
                      focus-visible:outline-none
                      focus-visible:ring-4
                      focus-visible:ring-indigo-400/30
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                    ">
          <span>
            {status.loading
              ? "Procesando…"
              : isRegister
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </span>

          <ArrowRight
            aria-hidden="true"
            className="
                      w-5 h-5
                      transition-transform duration-300
                      group-hover:translate-x-1
                    "/>
        </button>

      </form>

      <div className="my-4 sm:my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />o<span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={status.loading || !isSupabaseConfigured}
        className="
                    w-full
                    flex items-center justify-center gap-3
                    rounded-2xl
                    border border-[#DCE3EF]
                    bg-white
                    px-5 py-3.5
                    text-[14px] sm:text-[15px]
                    font-semibold
                    text-[#101936]
                    transition-all duration-200
                    hover:bg-[#F5F4FF]
                    hover:border-[#A5A5E8]
                    hover:shadow-sm
                    active:scale-[0.99]
                    focus-visible:outline-none
                    focus-visible:ring-4
                    focus-visible:ring-indigo-400/20
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    cursor-pointer
                  " >
        {/* Google multicolor */}
        <svg
          className="w-5 h-5 shrink-0"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.85 46.98 24.55z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.96-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>

        <span>Continuar con Google</span>
      </button>

      <p className="mt-4 sm:mt-6 text-center text-[13px] sm:text-sm text-slate-600">
        {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes una cuenta?"}{" "}
        <button type="button" onClick={switchMode} className="font-semibold text-[#3333CC] hover:text-[#7500F5] hover:underline underline-offset-4 transition-colors cursor-pointer">
          {isRegister ? "Inicia sesión" : "Crear cuenta"}
        </button>
      </p>
    </ModalShell>
  );
}
