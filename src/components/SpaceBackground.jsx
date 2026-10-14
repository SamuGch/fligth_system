import { Stars } from '@react-three/drei'

export default function SpaceBackground() {
  return (
    <>
      {/* Fondo espacial con degradado */}
      <color attach="background" args={['#171b3d']} />

      {/* Estrellas */}
      <Stars
        radius={50}
        depth={50}
        count={3000}
        factor={3}
        saturation={0}
        fade={true}
        speed={0.3}
      />
    </>
  )
}