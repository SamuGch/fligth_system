import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function Earth() {
  const earthTexture = useTexture('/world_r.jpeg')
  const earthRef = useRef()

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002
    }
  })

  // Shader para calcular el resplandor en los bordes (Efecto Fresnel)
  const vertexShader = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  // Shader para dar color y transparencia a la atmósfera
  const fragmentShader = `
    varying vec3 vNormal;
    void main() {
      // Ajusta el '0.7' o el '4.0' para hacer el brillo más grueso o intenso
      float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
      
      // El vector vec4 define el color (R, G, B, Alpha). Aquí usamos un tono celeste.
      gl_FragColor = vec4(2.0, 1.8, 0.0, 1.0) * intensity * 1.5;
    }
  `

  return (
    <group>
      {/* Esfera principal del planeta */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[3.5, 64, 64]} />
        <meshStandardMaterial map={earthTexture} />
      </mesh>

      {/* Esfera de la atmósfera (el radio es 3.8, un poco mayor que 3.5) */}
      <mesh>
        <sphereGeometry args={[3.8, 64, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent={true}
        />
      </mesh>
    </group>
  )
}