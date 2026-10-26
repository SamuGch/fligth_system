import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

export default function Earth() {
  const earthTexture = useTexture('/world_r_3.png')
  const heightTexture = useTexture('/world_height.png')
  const earthRef = useRef()

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.12
    }
  })

  return (
    <group>
      {/* Esfera principal del planeta */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[3.5, 128, 96]} />
        {/* <meshStandardMaterial map={earthTexture} /> */}
        <meshStandardMaterial
          map={earthTexture}
          displacementMap={heightTexture}
          displacementScale={0.15}
          roughness={1}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
