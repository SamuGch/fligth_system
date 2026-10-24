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
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  );

  useEffect(() => {
    const mobileMediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobileViewport = (event) =>
      setIsMobileViewport(event.matches);

    mobileMediaQuery.addEventListener('change', updateMobileViewport);
    return () =>
      mobileMediaQuery.removeEventListener('change', updateMobileViewport);
  }, []);

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
    className="relative min-h-dvh overflow-x-hidden bg-cover bg-center bg-no-repeat bg-scroll font-sans md:bg-fixed"
    style={{ backgroundImage:
      'linear-gradient(to bottom, rgba(200, 210, 255, 0.0), rgba(80, 70, 150, 0.0)), url("/font.jpeg")', }} >
      
      {/* Navbar */}
      <nav className="relative z-50 mx-3 mt-3 flex items-center justify-between rounded-full bg-[#3b2b7a]/90 px-4 py-3 text-white shadow-xl backdrop-blur-md sm:mx-6 sm:mt-5 sm:px-5 lg:mx-12 lg:px-7 xl:mx-25 xl:px-5">
        {/* Left Links */}
        <div className="flex items-center gap-3 lg:gap-8 lg:w-1/3">
          <div className="bg-white text-blue-900 p-1.5 sm:p-2 rounded-full shrink-0">
            <img src="/icono.jpg" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain"/>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <a href="#" className="relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-white">Vuelos</a>
            <span className="text-white/40">|</span>
            {/* <a href="#" className="text-white/80 hover:text-white transition-colors">Hoteles</a> */}
          </div>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center whitespace-nowrap">
          <h1 className="text-sm sm:text-base lg:text-xl font-bold tracking-widest uppercase">Air Travel</h1>
          <p className="hidden sm:block text-[0.5rem] lg:text-[0.55rem] tracking-widest text-white/70">Vuelos que te llevan más lejos</p>
        </div>

        {/* Right Links */}
        <div className="flex items-center justify-end gap-3 lg:gap-8 lg:w-1/3">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
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
              className="border border-white/40 p-1.5 rounded-full
                        cursor-pointer hover:bg-white/10
                        transition-colors">
              <User className="w-5 h-5" />
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
      <main className="mx-4 flex flex-col items-center px-2 pt-8 *:justify-between sm:mx-6 sm:px-8 sm:pt-10 md:mx-6 md:-mt-10 md:flex-row md:pt-0 lg:mx-12 lg:-mt-16 lg:px-10 xl:mx-35">
        <div className="w-full md:w-1/2 md:pr-8 z-10 text-center md:text-left">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-800 sm:text-base sm:tracking-[0.3em]">Explora el mundo</p>
          <h2 className="mb-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Tu próxima aventura <br />
            <span className="text-violet-100 " style={{ color: '#6d28d9' }}>comienza aquí</span>
          </h2>
          <p className="mx-auto max-w-md text-base text-slate-700 md:mx-0 lg:text-lg xl:text-xl">
            Encuentra los mejores vuelos a los destinos que desees, rápido, fácil y seguro.
          </p>
        </div>
        
        {/* 3D Globe Section (Reemplazo del Placeholder) */}
        <div className="relative z-0 mt-2 flex h-64 w-full justify-center sm:mt-4 sm:h-80 md:mt-0 md:h-100 md:w-1/2 lg:h-115 xl:h-128">
          {/* Efecto de resplandor de fondo (opcional, para mantener estética del diseño original) */}
          <div className="absolute w-55 h-55 sm:w-70 sm:h-70 lg:w-80 lg:h-80 bg-blue-400/30 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10"></div>
          
          {/* Escena 3D */}
          <Canvas camera={{ position: [0, 0, 9] }} className="h-full w-full" dpr={[1, 1.5]}>
            {/*<SpaceBackground />*/}
            <ambientLight intensity={1.9} />
            <directionalLight position={[5, 3, 5]} intensity={2.5} />
            <Earth />
            <Airplane />
            
            <OrbitControls enabled={!isMobileViewport} enableZoom={false} />
          </Canvas>
        </div>
      </main>

      {/* Search Widget */}
      <FlightSearch /> 

      {/* Footer Features */}
      <div className="relative z-20 mx-4 mt-5 px-2 sm:mx-6 sm:px-6 lg:mx-12 lg:px-0 xl:mx-30">
        <div className="grid grid-cols-1 items-center justify-between rounded-4xl border border-white/20 bg-white/5 px-4 py-3 text-white shadow-lg backdrop-blur-[3px] sm:grid-cols-2 sm:px-6 sm:py-4 lg:flex lg:px-10 lg:py-8 xl:px-20">
          
          <div className="mb-0 flex flex-1 items-center gap-4 border-b border-white/20 px-4 py-3 last:border-0 sm:border-0 sm:py-4 lg:mb-0 lg:border-r lg:px-4 lg:py-0 lg:last:border-0">
            <div className="bg-white/20 p-2 rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Compra Segura</p>
              <p className="text-sm text-white/70">Tus datos protegidos</p>
            </div>
          </div>

          <div className="mb-0 flex flex-1 items-center gap-4 border-b border-white/20 px-4 py-3 last:border-0 sm:border-0 sm:py-4 lg:mb-0 lg:border-r lg:px-4 lg:py-0 lg:last:border-0">
            <div className="bg-white/20 p-2 rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Mejores precios</p>
              <p className="text-xs text-white/70">Compra y ahorra</p>
            </div>
          </div>

          <div className="mb-0 flex flex-1 items-center gap-4 border-b border-white/20 px-4 py-3 last:border-0 sm:border-0 sm:py-4 lg:mb-0 lg:border-r lg:px-4 lg:py-0 lg:last:border-0">
            <div className="bg-white/20 p-2 rounded-full">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Atención 24/7</p>
              <p className="text-xs text-white/70">Siempre contigo</p>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-4 px-4 py-3 sm:py-4 lg:px-4 lg:py-0">
            <div className="bg-white/20 p-2 rounded-full">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Miles de destinos</p>
              <p className="text-xs text-white/70">Al alcance de un click</p>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}

export default Home;
