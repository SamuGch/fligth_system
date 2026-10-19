import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Earth from './components/Earth'
import SpaceBackground from './components/SpaceBackground'
import Airplane from './components/Airplane'


export default function App() {
  return (
    <div className="w-screen h-screen relative overflow-hidden">

      {/* Interfaz */}
      <div className="absolute top-4 left-4 z-10 text-white font-sans">
        <h1 className="text-2xl font-bold">
          Planeta Tierra
        </h1>

        <p className="text-sm opacity-70">
          Arrastra para rotar
        </p>
      </div>

      {/* Escena 3D */}
      <Canvas camera={{ position: [0, 0, 9] }}>

        {/* Fondo espacial */}
        <SpaceBackground />

        {/* Iluminación */}
        <ambientLight intensity={1.9} />

        <directionalLight
          position={[5, 3, 5]}
          intensity={2.5}
        />

        {/* Tierra */}
        <Earth />
        <Airplane />

        {/* Controles */}
        <OrbitControls enableZoom={true} />

      </Canvas>

    </div>
  )
}