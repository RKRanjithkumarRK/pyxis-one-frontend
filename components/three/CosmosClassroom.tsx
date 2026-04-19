'use client'

import { useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float } from '@react-three/drei'
import * as THREE from 'three'
import { FallbackSVG } from './FallbackSVG'

function NebulaParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 2000

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 15 + Math.random() * 20
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      const hue = 0.6 + Math.random() * 0.2
      const c = new THREE.Color().setHSL(hue, 0.8, 0.6)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

function CoreOrb() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.5, 4]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#4338ca"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  )
}

function OrbitRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * speed
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.02, 8, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.5} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#6366f1" />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />
      <Stars radius={60} depth={30} count={3000} factor={3} fade />
      <NebulaParticles />
      <CoreOrb />
      <OrbitRing radius={4} speed={0.15} color="#6366f1" />
      <OrbitRing radius={6} speed={-0.1} color="#8b5cf6" />
      <OrbitRing radius={8} speed={0.08} color="#06b6d4" />
      <OrbitControls enablePan={false} enableZoom={true} minDistance={5} maxDistance={30} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

export function CosmosClassroom() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<FallbackSVG label="Loading cosmos..." />}>
        <Canvas camera={{ position: [0, 0, 12], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  )
}
