import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MainNavbar() {
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
    <nav className="relative z-50 mx-4 mt-3 flex items-center justify-between rounded-full border border-white/25 bg-[linear-gradient(100deg,#292570_0%,#403A91_50%,#292570_100%)] px-3 py-2 text-white shadow-[0_10px_30px_rgba(30,25,105,0.28),0_0_20px_rgba(140,155,255,0.20)] backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-10 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent sm:mx-6 sm:mt-5 sm:px-5 lg:mx-12 lg:px-7 xl:mx-25 xl:px-5">
      <div className="flex items-center gap-3 lg:w-1/3 lg:gap-15">
        <Link
          to="/"
          aria-label="Ir al inicio"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-900 xl:-ml-2.5"
        >
          <img src="/icono.jpg" alt="Air Travel" className="h-8 w-8 rounded-full object-contain" />
        </Link>
        <div className="relative -top-[2px] hidden items-center gap-4 text-base font-medium leading-none md:flex">
          <Link to="/" className="text-white no-underline transition-colors hover:text-white/80">Vuelos</Link>
          <span className="text-white/40">|</span>
          <span className="cursor-default text-white/70">Hoteles</span>
        </div>
      </div>

      <Link
        to="/"
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center whitespace-nowrap text-center text-white no-underline"
      >
        <span className="text-[16px] font-extrabold uppercase leading-none tracking-[0.02em] sm:text-[18px] lg:text-[20px]">Air Travel</span>
        <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-normal sm:block lg:text-[8px]">Vuelos que te llevan más lejos</span>
      </Link>

      <div className="flex items-center justify-end gap-3 lg:w-1/3 lg:gap-15">
        <div className="relative -top-[2px] hidden items-center gap-4 text-base font-medium leading-none md:flex">
          <span className="text-white/40">|</span>
          <span className="cursor-default text-white/80">Ayuda</span>
        </div>
        <div ref={accountMenuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label={isAuthenticated ? "Abrir menú de cuenta" : "Iniciar sesión"}
            aria-expanded={isAuthenticated ? accountMenuOpen : undefined}
            onClick={() => {
              if (isAuthenticated) setAccountMenuOpen((current) => !current);
              else navigate("/login", { state: { backgroundLocation: location } });
            }}
            className="mr-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/40 p-1.5 transition-colors hover:bg-white/10 sm:-mr-2.5 sm:h-auto sm:w-auto"
          >
            <User className="h-6 w-6" />
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
    </nav>
  );
}
