'use client'

import { useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'
import { FallbackSVG } from './FallbackSVG'

function HelixStrand({ offset = 0, color = '#6366f1' }: { offset?: number; color?: string }) {
  const groupRef = useRef<THREE.Group>(null)

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * Math.PI * 6
      pts.push(new THREE.Vector3(Math.cos(t + offset) * 1.5, t * 0.3 - 4.5, Math.sin(t + offset) * 1.5))
    }
    return pts
  }, [offset])

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
  })

  return (
    <group ref={groupRef}>
      <Line points={points} color={color} lineWidth={1.5} />
    </group>
  )
}

function Rungs() {
  const groupRef = useRef<THREE.Group>(null)

  const rungPoints = useMemo(() => {
    const rungs: [THREE.Vector3, THREE.Vector3][] = []
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 6
      const y = t * 0.3 - 4.5
      rungs.push([
        new THREE.Vector3(Math.cos(t) * 1.5, y, Math.sin(t) * 1.5),
        new THREE.Vector3(Math.cos(t + Math.PI) * 1.5, y, Math.sin(t + Math.PI) * 1.5),
      ])
    }
    return rungs
  }, [])

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
  })

  return (
    <group ref={groupRef}>
      {rungPoints.map((pair, i) => (
        <Line key={i} points={pair} color="#06b6d4" lineWidth={0.8} transparent opacity={0.4} />
      ))}
    </group>
  )
}

export function HelixVisualizer3D() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<FallbackSVG label="Loading helix..." />}>
        <Canvas camera={{ position: [5, 0, 5], fov: 50 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 3, 0]} intensity={1.5} color="#6366f1" />
          <HelixStrand offset={0} color="#6366f1" />
          <HelixStrand offset={Math.PI} color="#8b5cf6" />
          <Rungs />
          <OrbitControls enablePan={false} autoRotate autoRotateSpeed={1} />
        </Canvas>
      </Suspense>
    </div>
  )
}
