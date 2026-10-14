import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Line } from '@react-three/drei'

export default function Airplane() {

  const orbitRef = useRef()
  const { scene } = useGLTF('/airplane.glb')
  //Trayectoria
  const trailPoints = useMemo(() => {
    const points = []
    const radius = 13.9 // Radio de la órbita alrededor del planeta
    const trailAngle = Math.PI * 0.45 // Ángulo de inclinación de la órbita
    const trailGap = 0.205
    const segments = 80 // Número de segmentos para suavizar la curva

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * trailAngle
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      points.push([x, 0, z])
    }
    return points
  }, [])

  useFrame(() => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += 0.0065 
      //orbitRef.current.rotation.z = 0.015 
    }
  })

  return (
    //orbita inclinada
    <group rotation={[0, 0, Math.PI /6]}>
       
       {/*girp alrededor del planeta*/}
      <group ref={orbitRef} > 

        {/*brillo
        <Line
          points={trailPoints}
          color="#ffffff"
          lineWidth={18}
          transparent
          opacity={0.75}
        />

        {/*Trayectoria Principal
        <Line
          points={trailPoints}
          color="#ffffff"
          lineWidth={2}
          transparent
          opacity={0.65}
        />*/}

        {/*avion*/} 
        <group
          position={[4.4, 0, 0]}
          rotation={[0, Math.PI, -Math.PI / 6]}
        >

        <primitive 
        object={scene} 
        scale={0.9} // Ajusta este número si tu avión se ve gigante o minúsculo
      />
      </group>

      </group>

    </group>
  )
}