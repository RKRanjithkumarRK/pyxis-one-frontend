'use client'

import { useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'
import { usePsycheStore } from '@/store/psycheStore'
import { PSYCHE_DIMENSIONS } from '@/lib/constants'
import { FallbackSVG } from './FallbackSVG'

function DimensionNode({
  position,
  score,
  label,
  color,
}: {
  position: [number, number, number]
  score: number
  label: string
  color: string
}) {
  const ref = useRef<THREE.Mesh>(null)
  const intensity = score / 100

  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(0.9 + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.1)
    }
  })

  const c = new THREE.Color(color)

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.15 + intensity * 0.25, 16, 16]} />
      <meshStandardMaterial
        color={c}
        emissive={c}
        emissiveIntensity={intensity * 0.8}
        transparent
        opacity={0.7 + intensity * 0.3}
      />
    </mesh>
  )
}

function OrganismScene() {
  const { dimensions } = usePsycheStore()

  const nodes = useMemo(() => {
    return PSYCHE_DIMENSIONS.map((dim, i) => {
      const angle = (i / PSYCHE_DIMENSIONS.length) * Math.PI * 2
      const layer = i < 7 ? 2.5 : 4
      return {
        id: dim.id,
        label: dim.label,
        color: dim.color,
        score: dimensions[dim.id] ?? 50,
        position: [
          Math.cos(angle) * layer,
          Math.sin(angle) * layer * 0.6,
          (Math.random() - 0.5) * 1.5,
        ] as [number, number, number],
      }
    })
  }, [dimensions])

  const linePoints = useMemo(() => {
    return nodes.map((n) => new THREE.Vector3(...n.position))
  }, [nodes])

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#6366f1" />
      {nodes.map((node) => (
        <DimensionNode key={node.id} position={node.position} score={node.score} label={node.label} color={node.color} />
      ))}
      <Line points={[...linePoints, linePoints[0]]} color="#6366f1" lineWidth={0.5} transparent opacity={0.2} />
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={1} transparent opacity={0.8} />
      </mesh>
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  )
}

export function PsycheOrganism() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<FallbackSVG label="Loading psyche..." />}>
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 1.5]}>
          <OrganismScene />
        </Canvas>
      </Suspense>
    </div>
  )
}
