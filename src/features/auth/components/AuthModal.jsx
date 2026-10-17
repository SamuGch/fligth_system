import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ModalShell from "./ModalShell";

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-violet-500";

export default function AuthModal({ mode }) {
  const isRegister = mode === "register";
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
    navigate(
      {
        pathname: backgroundLocation.pathname || "/",
        search: backgroundLocation.search || "",
        hash: backgroundLocation.hash || "",
      },
      { replace: true, state: backgroundLocation.state },
    );
  }, [backgroundLocation, navigate]);

  const switchMode = () => {
    navigate(isRegister ? "/login" : "/registro", {
      replace: true,
      state: { backgroundLocation },
    });
  };

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
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
              email: form.email,
              backgroundLocation,
            },
          });
          return;
        }
      } else {
        await signIn(form.email, form.password);
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
      sessionStorage.setItem("authRedirect", JSON.stringify(backgroundLocation));
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
            onClick={close}
            className="mt-5 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
          >
            Continuar
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={close} titleId="auth-modal-title">
      <h1 id="auth-modal-title" className="pr-10 text-2xl font-bold text-slate-900">
        {isRegister ? "Crea tu cuenta" : "Bienvenido"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {isRegister
          ? "Regístrate para administrar tus viajes."
          : "Inicia sesión para continuar."}
      </p>

      {!isSupabaseConfigured && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Falta configurar Supabase en este entorno.
        </p>
      )}
      {status.error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {status.error}
        </p>
      )}

      <form className="mt-5 space-y-4" onSubmit={submit}>
        {isRegister && (
          <div className="grid grid-cols-2 gap-3">
            <input required name="firstName" value={form.firstName} onChange={update} placeholder="Nombre" className={inputClass} />
            <input required name="lastName" value={form.lastName} onChange={update} placeholder="Apellido" className={inputClass} />
          </div>
        )}
        <input required type="email" name="email" autoComplete="email" value={form.email} onChange={update} placeholder="Correo electrónico" className={inputClass} />
        <input required minLength="6" type="password" name="password" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={update} placeholder="Contraseña" className={inputClass} />
        {isRegister && (
          <input required type="password" name="confirmation" autoComplete="new-password" value={form.confirmation} onChange={update} placeholder="Confirmar contraseña" className={inputClass} />
        )}
        <button disabled={status.loading || !isSupabaseConfigured} className="w-full rounded-xl bg-violet-700 py-3 font-semibold text-white disabled:opacity-60">
          {status.loading ? "Procesando…" : isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />o<span className="h-px flex-1 bg-slate-200" />
      </div>
      <button type="button" onClick={continueWithGoogle} disabled={status.loading || !isSupabaseConfigured} className="w-full rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 disabled:opacity-60">
        Continuar con Google
      </button>
      <p className="mt-6 text-center text-sm text-slate-600">
        {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes una cuenta?"}{" "}
        <button type="button" onClick={switchMode} className="font-semibold text-violet-700">
          {isRegister ? "Inicia sesión" : "Crear cuenta"}
        </button>
      </p>
    </ModalShell>
  );
}
