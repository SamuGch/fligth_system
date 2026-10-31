import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Clock3,
  Globe2,
  HelpCircle,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MainNavbar({ className = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountMenuError, setAccountMenuError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  const openAccountDestination = (path) => {
    setAccountMenuOpen(false);
    setAccountMenuError("");
    navigate(path);
  };

  const leaveAccount = async () => {
    setSigningOut(true);
    setAccountMenuError("");
    try {
      await signOut();
      setAccountMenuOpen(false);
      navigate("/", { replace: true, state: { signOutSuccess: true } });
    } catch (signOutError) {
      setAccountMenuError(
        signOutError.message || "No fue posible cerrar la sesión.",
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <nav className={`sticky top-3 z-50 mx-4 rounded-2xl border border-white/15 bg-slate-950/80 font-sans text-white shadow-[0_12px_30px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:top-5 sm:mx-6 sm:rounded-full lg:mx-12 xl:mx-25 ${className}`}>
      <div className="relative flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-7">
        <Link
          to="/"
          aria-label="Ir al inicio"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-900 transition-transform hover:scale-105"
        >
          <img src="/icono.jpg" alt="Air Travel" className="h-8 w-8 rounded-md object-contain" />
        </Link>
        <div className="hidden items-center gap-6 text-base font-medium tracking-wide md:flex">
          <Link
            to="/"
            className="text-slate-300 transition-colors hover:text-white"
          >
            Vuelos
          </Link>
        </div>
        </div>

      <Link
        to="/"
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center whitespace-nowrap text-center no-underline"
      >
        <span className="text-base font-bold uppercase leading-none tracking-[0.2em] sm:text-lg">
          Air Travel
        </span>
        <span className="mt-1 hidden text-[8px] font-medium uppercase tracking-[0.18em] text-slate-400 sm:block">
          Vuelos que te llevan más lejos
        </span>
      </Link>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium tracking-wide text-slate-300 transition-colors hover:bg-white/10 hover:text-white sm:flex"
          aria-label="Idioma: Español"
        >
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          <span>ES</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hidden max-w-48 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium tracking-wide text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:flex"
          aria-label="Zona horaria: America/Guatemala"
        >
          <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">America/Guatemala</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
        </button>
        <Link
          to="/"
          className="hidden items-center gap-1.5 px-2 py-2 text-sm font-medium tracking-wide text-slate-300 transition-colors hover:text-white sm:flex"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          Ayuda
        </Link>
        <div ref={accountMenuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label={isAuthenticated ? "Abrir menú de cuenta" : "Iniciar sesión"}
            aria-expanded={isAuthenticated ? accountMenuOpen : undefined}
            onClick={() => {
              if (isAuthenticated) setAccountMenuOpen((current) => !current);
              else navigate("/login", { state: { backgroundLocation: location } });
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/5 text-slate-200 transition-colors hover:border-white/40 hover:bg-white/15 hover:text-white"
          >
            <User className="h-5 w-5" />
          </button>

          {isAuthenticated && accountMenuOpen && (
            <div role="dialog" aria-label="Opciones de cuenta" className="absolute right-0 top-12 z-60 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl">
              <button type="button" onClick={() => openAccountDestination("/perfil")} className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold hover:bg-violet-50 hover:text-violet-700">Mi perfil</button>
              <button type="button" onClick={() => openAccountDestination("/reservas")} className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold hover:bg-violet-50 hover:text-violet-700">Mis viajes</button>
              <div className="my-1 border-t border-slate-100" />
              {accountMenuError && <p role="alert" className="px-4 py-2 text-xs text-red-600">{accountMenuError}</p>}
              <button type="button" disabled={signingOut} onClick={() => void leaveAccount()} className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </nav>
  );
}
