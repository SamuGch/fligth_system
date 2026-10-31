
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
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
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

      navigate("/", {
        replace: true,
        state: { signOutSuccess: true },
      });
    } catch (signOutError) {
      setAccountMenuError(
        signOutError.message || "No fue posible cerrar la sesión."
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <nav
      className={`
        sticky top-3 sm:top-5
        z-50

        mx-4 sm:mx-6 lg:mx-12 xl:mx-25

        rounded-full
        border border-white/25

        bg-[linear-gradient(100deg,#292570_0%,#403A91_50%,#292570_100%)]

        font-sans
        text-white
        backdrop-blur-md

        shadow-[0_10px_30px_rgba(30,25,105,0.28),0_0_20px_rgba(140,155,255,0.20)]

        ${className}
      `}
    >
      <div
        className="
          relative
          flex min-h-[60px] sm:min-h-[64px]
          w-full
          items-center justify-between
          gap-3

          px-3 sm:px-4 lg:px-5
        "
      >
        {/* ======================= */}
        {/* LOGO Y NAVEGACIÓN       */}
        {/* ======================= */}

        <div className="flex min-w-0 items-center gap-5 lg:gap-7">

          {/* Logo circular */}
          <Link
            to="/"
            aria-label="Ir al inicio"
            className="
              flex
              w-10 h-10
              sm:w-11 sm:h-11

              shrink-0
              items-center justify-center

              rounded-full
              bg-white
              text-blue-900

              shadow-[0_2px_8px_rgba(20,20,80,0.15)]

              transition-transform duration-200
              hover:scale-105
            "
          >
            <img
              src="/icono.jpg"
              alt="Air Travel"
              className="
                w-9 h-9
                sm:w-10 sm:h-10
                rounded-full
                object-contain
              "
            />
          </Link>

          {/* Enlaces de navegación */}
          <div
            className="
              hidden md:flex
              items-center gap-6

              text-[15px] lg:text-[16px]
              font-normal
              tracking-[0.01em]
            "
          >
            <Link
              to="/"
              className="
                font-medium
                text-white
                hover:text-white/80
                transition-colors duration-200
              "
            >
              Vuelos
            </Link>
          </div>
        </div>

        {/* ======================= */}
        {/* MARCA CENTRAL           */}
        {/* ======================= */}

        <Link
          to="/"
          className="
            absolute
            left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2

            flex flex-col
            items-center justify-center

            whitespace-nowrap
            text-center
            no-underline
          "
        >
          <span
            className="
              text-[16px]
              sm:text-[18px]
              lg:text-[22px]

              font-extrabold
              uppercase
              leading-none
              tracking-[0.035em]

              text-white
            "
          >
            AIR TRAVEL
          </span>

          <span
            className="
              hidden sm:block
              mt-1

              text-[8px]
              font-medium
              uppercase
              tracking-[0.10em]

              text-white/90
            "
          >
            Vuelos que te llevan más lejos
          </span>
        </Link>

        {/* ======================= */}
        {/* NAVEGACIÓN DERECHA      */}
        {/* ======================= */}

        <div
          className="
            flex items-center justify-end
            gap-1 sm:gap-2 lg:gap-3
          "
        >
          {/* Idioma */}
          <button
            type="button"
            aria-label="Idioma: Español"
            className="
              hidden sm:flex
              items-center gap-1.5

              rounded-lg
              px-2 py-2

              text-[13px]
              font-normal
              tracking-normal

              text-white/80

              hover:bg-white/10
              hover:text-white

              transition-colors duration-200
              cursor-pointer
            "
          >
            <Globe2
              className="w-4 h-4"
              aria-hidden="true"
            />

            <span>ES</span>

            <ChevronDown
              className="w-3.5 h-3.5 text-white/50"
              aria-hidden="true"
            />
          </button>

          {/* Zona horaria */}
          <button
            type="button"
            aria-label="Zona horaria: America/Guatemala"
            className="
              hidden xl:flex
              max-w-48
              items-center gap-1.5

              rounded-lg
              px-2 py-2

              text-[13px]
              font-normal
              tracking-normal

              text-white/80

              hover:bg-white/10
              hover:text-white

              transition-colors duration-200
              cursor-pointer
            "
          >
            <Clock3
              className="w-4 h-4 shrink-0"
              aria-hidden="true"
            />

            <span className="truncate">
              America/Guatemala
            </span>

            <ChevronDown
              className="w-3.5 h-3.5 shrink-0 text-white/50"
              aria-hidden="true"
            />
          </button>

          {/* Separador */}
          <span
            aria-hidden="true"
            className="
              hidden sm:block
              h-5 w-px
              mx-1
              bg-white/35
            "
          />

          {/* Ayuda */}
          <Link
            to="/ayuda"
            className="
              hidden sm:flex
              items-center gap-1.5

              px-2 py-2

              text-[14px] lg:text-[15px]
              font-normal
              tracking-normal

              text-white/85

              hover:text-white
              transition-colors duration-200
            "
          >
            <HelpCircle
              className="w-4 h-4"
              aria-hidden="true"
            />

            Ayuda
          </Link>

          {/* ======================= */}
          {/* MENÚ DE USUARIO         */}
          {/* ======================= */}

          <div
            ref={accountMenuRef}
            className="relative shrink-0"
          >
            <button
              type="button"
              aria-label={
                isAuthenticated
                  ? "Abrir menú de cuenta"
                  : "Iniciar sesión"
              }
              aria-expanded={
                isAuthenticated
                  ? accountMenuOpen
                  : undefined
              }
              onClick={() => {
                if (isAuthenticated) {
                  setAccountMenuOpen((current) => !current);
                } else {
                  navigate("/login", {
                    state: { backgroundLocation: location },
                  });
                }
              }}
              className="
                flex
                w-10 h-10
                sm:w-11 sm:h-11

                shrink-0
                items-center justify-center

                rounded-full

                border border-white/50
                bg-white/5

                text-white

                hover:bg-white/15
                hover:border-white/80

                transition-all duration-200
                cursor-pointer
              "
            >
              <User
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
            </button>

            {/* Menú de cuenta */}
            {isAuthenticated && accountMenuOpen && (
              <div
                role="dialog"
                aria-label="Opciones de cuenta"
                className="
                  absolute right-0 top-12
                  z-60 w-52
                  overflow-hidden

                  rounded-2xl
                  border border-[#DCE3EF]
                  bg-white
                  p-2

                  text-[#101936]

                  shadow-[0_15px_40px_rgba(30,25,105,0.22)]
                "
              >
                <button
                  type="button"
                  onClick={() => openAccountDestination("/perfil")}
                  className="
                    w-full
                    rounded-xl
                    px-4 py-2.5

                    text-left text-sm font-semibold

                    hover:bg-[#F0EDFF]
                    hover:text-[#3333CC]

                    transition-colors
                  "
                >
                  Mi perfil
                </button>

                <button
                  type="button"
                  onClick={() => openAccountDestination("/reservas")}
                  className="
                    w-full
                    rounded-xl
                    px-4 py-2.5

                    text-left text-sm font-semibold

                    hover:bg-[#F0EDFF]
                    hover:text-[#3333CC]

                    transition-colors
                  "
                >
                  Mis viajes
                </button>

                <div className="my-1 border-t border-slate-100" />

                {accountMenuError && (
                  <p
                    role="alert"
                    className="px-4 py-2 text-xs text-red-600"
                  >
                    {accountMenuError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => void leaveAccount()}
                  className="
                    w-full
                    rounded-xl
                    px-4 py-2.5

                    text-left text-sm font-semibold
                    text-red-600

                    hover:bg-red-50
                    disabled:opacity-60

                    transition-colors
                  "
                >
                  {signingOut
                    ? "Cerrando sesión…"
                    : "Cerrar sesión"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
