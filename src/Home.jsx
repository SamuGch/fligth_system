import {
  Plane,
  ShieldCheck,
  Headphones,
  User,
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import Earth from './components/Earth';
import Airplane from './components/Airplane';
import FlightSearch from './components/FlightSearch';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './features/auth/context/AuthContext';


function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountMenuError, setAccountMenuError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountMenuOpen]);

  const openAccountDestination = (path) => {
    setAccountMenuOpen(false);
    setAccountMenuError('');
    navigate(path);
  };

  const leaveAccount = async () => {
    setSigningOut(true);
    setAccountMenuError('');
    try {
      await signOut();
      setAccountMenuOpen(false);
    } catch (signOutError) {
      setAccountMenuError(
        signOutError.message || 'No fue posible cerrar la sesión.',
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col bg-cover bg-center bg-no-repeat bg-fixed font-sans relative overflow-x-hidden"
      style={{
        backgroundImage:
          'linear-gradient(to bottom, rgba(200, 210, 255, 0.0), rgba(80, 70, 150, 0.0)), url("/font.jpeg")',
      }} >

      {/* Navbar */}
      {/* <nav className="mx-4 sm:mx-6 lg:mx-12 xl:mx-25 mt-3 sm:mt-5 bg-[#3b2b7a] backdrop-blur-md rounded-full px-3 sm:px-5 lg:px-7 xl:px-5 py-2 flex items-center justify-between shadow-xl text-white relative z-50"> */}
      <nav 
className=" relative z-50 mx-4 sm:mx-6 lg:mx-12 xl:mx-25 mt-3 sm:mt-5 flex items-center justify-between rounded-full px-3 sm:px-5 lg:px-7 xl:px-5 py-2 bg-[linear-gradient(100deg,#292570_0%,#403A91_50%,#292570_100%)] border border-white/25 backdrop-blur-md shadow-[0_10px_30px_rgba(30,25,105,0.28),0_0_20px_rgba(140,155,255,0.20)] text-white before:pointer-events-none before:absolute before:inset-x-10 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent">
      
        {/* Left Links */}
        <div className="flex items-center gap-3 lg:gap-15 lg:w-1/3">
          <div className="bg-white text-blue-900 w-9 h-9 sm:w-9 sm:h-9 rounded-full shrink-0 flex items-center justify-center xl:-ml-2.5">
            <img src="/icono.jpg" alt="Logo" className="w-8 h-8 sm:w-8 sm:h-8 object-contain rounded-full" />
          </div>
          <div className="hidden md:flex items-center gap-4 text-base font-medium leading-none relative -top-[2px]">
            <a href="#" className="text-base  text-white hover:text-white/80 transition-colors no-underline">Vuelos</a>
            <span className="text-white/40">|</span>
            <a href="#" className="text-white/80 hover:text-white transition-colors">Hoteles</a>
          </div>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center whitespace-nowrap">
          <h1 className="text-[16px] sm:text-[18px] lg:text-[20px] font-extrabold tracking-[0.02em] uppercase leading-none text-white">Air Travel</h1>
          <p className="hidden sm:block mt-1 text-[9px] lg:text-[8px] font-medium tracking-normal uppercase text-white">Vuelos que te llevan más lejos</p>
        </div>

        {/* Right Links */}
        <div className="flex items-center justify-end gap-3 lg:gap-15 lg:w-1/3">
          <div className="hidden md:flex items-center gap-4 text-base font-medium leading-none relative -top-[2px]">
            {/* <a href="#" className="text-white/80 hover:text-white transition-colors">Ofertas</a> */}
            <span className="text-white/40">|</span>
            <a href="#" className="text-white/80 hover:text-white transition-colors">Ayuda</a>
          </div>
          <div ref={accountMenuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label={isAuthenticated ? 'Abrir menú de cuenta' : 'Iniciar sesión'}
              aria-expanded={isAuthenticated ? accountMenuOpen : undefined}
              onClick={() => {
                if (isAuthenticated) {
                  setAccountMenuOpen((current) => !current);
                } else {
                  navigate('/login', { state: { backgroundLocation: location } });
                }
              }}
              className="w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center border border-white/40 p-1.5 rounded-full mr-0 sm:-mr-2.5 cursor-pointer hover:bg-white/10 transition-colors"> 
              <User className="w-6 h-6" />
            </button>

            {isAuthenticated && accountMenuOpen && (
              <div
                role="dialog"
                aria-label="Opciones de cuenta"
                className="absolute right-0 top-12 z-60 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => openAccountDestination('/perfil')}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold hover:bg-violet-50 hover:text-violet-700"
                >
                  Mi perfil
                </button>
                <button
                  type="button"
                  onClick={() => openAccountDestination('/reservas')}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold hover:bg-violet-50 hover:text-violet-700"
                >
                  Mis viajes
                </button>
                <div className="my-1 border-t border-slate-100" />
                {accountMenuError && (
                  <p role="alert" className="px-4 py-2 text-xs text-red-600">
                    {accountMenuError}
                  </p>
                )}
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => void leaveAccount()}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-4 sm:mx-6 lg:mx-12 xl:mx-25 px-4 sm:px-8 lg:px-10 pt-6 sm:pt-6 md:pt-0 md:-mt-10 lg:-mt-25 flex flex-col md:flex-row items-center *:justify-between">
        <div className="w-full md:w-1/2 md:pr-8 z-10 text-center md:text-left">
          <p className="text-[11px] sm:text-[13px] lg:text-[15px] text-slate-900 font-semibold mb-1 sm:mb-3 uppercase tracking-[0.22em] sm:tracking-[0.35em] leading-normal">Explora el mundo</p>
          <h2 className="text-[clamp(1.75rem,7vw,2.25rem)] md:text-3xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-4 leading-none  tracking-[-0.015em]">
            Tu próxima aventura <br />
            <span className="text-violet-100" style={{ color: '#3333CC' }}>comienza aquí</span>
          </h2>
          <p className="max-w-[490px] mx-auto md:mx-0 text-[13px] sm:text-[15px] lg:text-[17px] font-normal leading-[1.65] tracking-normal text-slate-800">
            Encuentra los mejores vuelos a los destinos que desees, rápido, fácil y seguro.
          </p>
        </div>

        {/* 3D Globe Section (Reemplazo del Placeholder) */}
        <div className="w-full md:w-1/2 flex justify-center relative -mt-16 sm:mt-4 md:mt-0 z-0 h-[300px] sm:h-[360px] md:h-[460px] lg:h-[512px]">
          {/* Efecto de resplandor de fondo (opcional, para mantener estética del diseño original) */}
          <div className="absolute w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-[26rem] lg:h-[26rem] bg-white/25 lg:bg-white/35 rounded-full blur-[30px] lg:blur-[70px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"></div>
          {/* capa adicional resplandor */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-[16rem] lg:h-[16rem] -translate-x-1/2 -translate-y-1/2 bg-white/95 lg:bg-white/65 rounded-full blur-[12px]">
          </div>
          {/* Escena 3D */}
          <Canvas camera={{ position: [0, 0, 9] }} className="relative z-10 w-full h-full">
            {/*<SpaceBackground />*/}
            <ambientLight intensity={1.9} />
            <directionalLight position={[5, 3, 5]} intensity={2.5} />
            <group scale={.8}>
              <Earth />
            </group>

            <group scale={.9}>
              <Airplane />
            </group>
            {/* Nota: En landing pages, a veces es mejor poner enableZoom={false} para evitar que el usuario se atasque al hacer scroll hacia abajo, pero lo he dejado en true como en tu código original */}
            <OrbitControls enableZoom={false} />
          </Canvas>
        </div>
      </main>

      {/* Search Widget */}
      <FlightSearch />

      {/* Footer Features */}
      {/* <div className="mx-4 sm:mx-6 lg:mx-12 xl:mx-25 relative z-20 mt-5"> */}
      <div className="mx-4 sm:mx-6 lg:mx-12 xl:mx-25 relative z-20 mt-auto mb-3 sm:mb-6 pt-5">
        <div className=" bg-white/5 backdrop-blur-[6px] border border-white/30 rounded-4xl px-3 sm:px-6 lg:px-10 xl:px-16 py-5 sm:py-6 lg:py-5 grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-5 sm:gap-4 lg:gap-0 items-center text-white shadow-[0_12px_30px_rgba(23,20,80,0.20)] xl:min-h-[150px] ">

          <div className=" flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-4 px-1 sm:px-2 lg:px-4 lg:border-r lg:border-white/20 ">
            <div className="bg-white/20 p-2 rounded-full shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Compra Segura</p>
              <p className="text-xs sm:text-sm text-white/70">Tus datos protegidos</p>
            </div>
          </div>

          <div className=" flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-4 px-1 sm:px-2 lg:px-4 lg:border-r lg:border-white/20 ">
            <div className="bg-white/20 p-2 rounded-full shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Mejores precios</p>
              <p className="text-xs sm:text-sm text-white/70">Compra y ahorra</p>
            </div>
          </div>

          <div className=" flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-4 px-1 sm:px-2 lg:px-4 lg:border-r lg:border-white/20 ">
            <div className="bg-white/20 p-2 rounded-full shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Atención 24/7</p>
              <p className="text-xs sm:text-sm text-white/70">Siempre contigo</p>
            </div>
          </div>

          <div className=" flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-4 px-1 sm:px-2 lg:px-4  ">
            <div className="bg-white/20 p-2 rounded-full shrink-0">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Miles de destinos</p>
              <p className="text-xs sm:text-sm text-white/70">Al alcance de un click</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Home;
