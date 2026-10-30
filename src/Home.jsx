import {
  Plane,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Earth from './components/Earth';
import Airplane from './components/Airplane';
import FlightSearch from './components/FlightSearch';
import MainNavbar from './components/MainNavbar';


function Home() {
  return (
    <div
      className="min-h-dvh flex flex-col bg-cover bg-center bg-no-repeat bg-fixed font-sans relative overflow-x-hidden"
      style={{
        backgroundImage:
          'linear-gradient(to bottom, rgba(200, 210, 255, 0.0), rgba(80, 70, 150, 0.0)), url("/font.jpeg")',
      }} >

      <MainNavbar />

      {/* Hero Section */}
      <main className="mx-4 sm:mx-6 lg:mx-12 xl:mx-25 px-4 sm:px-8 lg:px-10 pt-6 sm:pt-6 md:pt-0 md:-mt-10 lg:-mt-25 flex flex-row items-center *:justify-between">
        <div className="w-[58%] sm:w-1/2 md:pr-8 z-10 text-left">
          <p className="text-[11px] sm:text-[13px] lg:text-[15px] text-slate-900 font-semibold mb-1 sm:mb-3 uppercase tracking-[0.22em] sm:tracking-[0.35em] leading-normal hidden md:block">Explora el mundo</p>
          <h2 className="text-[clamp(1.35rem,6vw,2.25rem)] sm:text-[clamp(1.75rem,7vw,2.25rem)] md:text-3xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-4 leading-none tracking-[-0.015em]">
            Tu próxima aventura <br className="hidden md:block" />
            <span className="text-violet-100" style={{ color: '#3333CC' }}>comienza aquí</span>
          </h2>
          <p className="hidden md:block max-w-[490px] mx-auto md:mx-0 text-[13px] sm:text-[15px] lg:text-[17px] font-normal leading-[1.65] tracking-normal text-slate-800">
            Encuentra los mejores vuelos a los destinos que desees, rápido, fácil y seguro.
          </p>
        </div>

        {/* 3D Globe Section (Reemplazo del Placeholder) */}
        <div className="w-[42%] sm:w-1/2 flex justify-center relative z-0 h-[220px] sm:h-[360px] md:h-[460px] lg:h-[512px]">
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
