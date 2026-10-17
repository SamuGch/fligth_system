import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

export default function Airplane() {

  const orbitRef = useRef()
  const { scene } = useGLTF('/airplane.glb')
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
