import React from 'react';
import { 
  Plane, 
  ShieldCheck, 
  Headphones, 
  User,
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Earth from './components/Earth';
import Airplane from './components/Airplane';
import {useState} from 'react'; 
import LoginModal from './components/LoginModal';
import FlightSearchModal from './components/FlightSearchModal';
import FlightSearch from './components/FlightSearch'; 


function Home() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [flightSearchOpen, setFlightSearchOpen] = useState(false);
  const [searchData, setSearchData] = useState({
  tripType: "round",
  origin: "GUA",
  destination: "MIA",
  departureDate: "2026-10-15",
  returnDate: "2026-10-20",
  passengers: 1,
  seatClass: "Economica",
});

const updateSearch = (field, value) => {
  setSearchData((prev) => ({
    ...prev,
    [field]: value,
  }));
};

  return (
    <div
    className="h-dvh bg-cover bg-center bg-no-repeat font-sans relative overflow-hidden"
    style={{ backgroundImage:
      'linear-gradient(to bottom, rgba(200, 210, 255, 0.0), rgba(80, 70, 150, 0.0)), url("/font.jpeg")', }} >
      
      {/* Navbar */}
      <nav className="mx-4 sm:mx-6 lg:mx-12 xl:mx-25 mt-3 sm:mt-5 bg-[#3b2b7a]/90 backdrop-blur-md rounded-full px-4 sm:px-5 lg:px-7 py-3 flex items-center justify-between shadow-xl text-white relative z-50">
        {/* Left Links */}
        <div className="flex items-center gap-3 lg:gap-8 lg:w-1/3">
          <div className="bg-white text-blue-900 p-1.5 sm:p-2 rounded-full shrink-0">
            <img src="/icono.jpg" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain"/>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <a href="#" className="relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-white">Vuelos</a>
            <span className="text-white/40">|</span>
            <a href="#" className="text-white/80 hover:text-white transition-colors">Hoteles</a>
          </div>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center whitespace-nowrap">
          <h1 className="text-sm sm:text-base lg:text-xl font-bold tracking-widest uppercase">La Aurora</h1>
          <p className="hidden sm:block text-[0.5rem] lg:text-[0.55rem] tracking-widest text-white/70">Vuelos que te llevan más lejos</p>
        </div>

        {/* Right Links */}
        <div className="flex items-center justify-end gap-3 lg:gap-8 lg:w-1/3">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <a href="#" className="text-white/80 hover:text-white transition-colors">Ofertas</a>
            <span className="text-white/40">|</span>
            <a href="#" className="text-white/80 hover:text-white transition-colors">Ayuda</a>
          </div>
          <button
            onClick={() => setLoginOpen(true)}
            className="border border-white/40 p-1.5 rounded-full
                      cursor-pointer hover:bg-white/10
                      transition-colors shrink-0">
            <User className="w-5 h-5" />
          </button>
        </div>
      </nav>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <FlightSearchModal isOpen={flightSearchOpen} onClose={() => setFlightSearchOpen(false)} />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 pt-10 md:pt-0 md:-mt-10 lg:-mt-16 flex flex-col md:flex-row items-center *:justify-between">
        <div className="w-full md:w-1/2 md:pr-8 z-10 text-center md:text-left">
          <p className="text-xs sm:text-sm tracking-[0.3em] text-slate-800 font-semibold mb-4 uppercase">Explora el mundo</p>
          <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-3"> 
            Tu próxima aventura <br />
            <span className="text-violet-100 " style={{ color: '#6d28d9' }}>comienza aquí</span>
          </h2>
          <p className="text-slate-700 text-base sm:text-lg max-w-md mx-auto md:mx-0">
            Encuentra los mejores vuelos a los destinos que desees, rápido, fácil y seguro.
          </p>
        </div>
        
        {/* 3D Globe Section (Reemplazo del Placeholder) */}
        <div className="w-full md:w-1/2 flex justify-center relative mt-4 md:mt-0 z-0 h-80 sm:h-100 md:h-115 lg:h-125">
          {/* Efecto de resplandor de fondo (opcional, para mantener estética del diseño original) */}
          <div className="absolute w-55 h-55 sm:w-70 sm:h-70 lg:w-80 lg:h-80 bg-blue-400/30 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10"></div>
          
          {/* Escena 3D */}
          <Canvas camera={{ position: [0, 0, 9] }} className="w-full h-full">
            {/*<SpaceBackground />*/}
            <ambientLight intensity={1.9} />
            <directionalLight position={[5, 3, 5]} intensity={2.5} />
            <Earth />
            <Airplane />
            
            {/* Nota: En landing pages, a veces es mejor poner enableZoom={false} para evitar que el usuario se atasque al hacer scroll hacia abajo, pero lo he dejado en true como en tu código original */}
            <OrbitControls enableZoom={false} />
          </Canvas>
        </div>
      </main>

      {/* Search Widget */}
      <FlightSearch /> 

      {/* Footer Features */}
      <div className="max-w-7xl mx-auto relative z-20 mt-5 px-4 sm:px-6 lg:px-0">
        <div className="bg-white/5 backdrop-blur-[3px]  border border-white/20 rounded-4xl px-4 sm:px-6 lg:px-10 xl:px-20 py-3 sm:py-4 lg:py-8 grid grid-cols-2 sm:grid-cols-2 lg:flex justify-between items-center text-white shadow-lg">
          
          <div className="flex items-center gap-4 flex-1 mb-4 lg:mb-0 border-r border-white/20 px-4">
            <div className="bg-white/20 p-2 rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Compra Segura</p>
              <p className="text-sm text-white/70">Tus datos protegidos</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 mb-4 lg:mb-0 border-r border-white/20 px-4">
            <div className="bg-white/20 p-2 rounded-full">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Mejores precios</p>
              <p className="text-xs text-white/70">Compra y ahorra</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 mb-4 lg:mb-0 border-r border-white/20 px-4">
            <div className="bg-white/20 p-2 rounded-full">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Atención 24/7</p>
              <p className="text-xs text-white/70">Siempre contigo</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 px-4">
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