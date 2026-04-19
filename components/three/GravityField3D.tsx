'use client'

import { useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { FallbackSVG } from './FallbackSVG'

function GridMesh() {
  const ref = useRef<THREE.Mesh>(null)
  const size = 10
  const segments = 20

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    return geo
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position
    const time = state.clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const dist = Math.sqrt(x * x + y * y)
      pos.setZ(i, Math.sin(dist * 1.5 - time * 1.5) * 0.4 * Math.exp(-dist * 0.3))
    }
    pos.needsUpdate = true
    ref.current.geometry.computeVertexNormals()
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={geometry} />
      <meshStandardMaterial color="#6366f1" wireframe transparent opacity={0.5} />
    </mesh>
  )
}

function MassSphere() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime) * 0.1
    }
  })
  return (
    <mesh ref={ref} position={[0, 0.3, 0]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#8b5cf6" emissive="#6366f1" emissiveIntensity={0.6} />
    </mesh>
  )
}

export function GravityField3D() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<FallbackSVG label="Loading gravity field..." />}>
        <Canvas camera={{ position: [0, 5, 8], fov: 50 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.3} />
          <pointLight position={[0, 3, 0]} intensity={2} color="#6366f1" />
          <GridMesh />
          <MassSphere />
          <OrbitControls enablePan={false} />
        </Canvas>
      </Suspense>
    </div>
  )
}
