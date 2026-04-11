import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'

// Sprite individual — animaciones 100% en useFrame sin springs
function TechSprite({ tech, basePosition, index, hoveredIndex, setHoveredIndex, isVisibleRef, prefersReduced }) {
  const meshRef = useRef()
  const materialRef = useRef()
  const isHovered = hoveredIndex === index
  const isBlurred = hoveredIndex !== null && !isHovered

  // Estado de animación en refs (no causa re-renders)
  const hoverScale = useRef(1)
  const hoverOpacity = useRef(1)

  const texture = useTexture(tech.image)

  const freq = 0.28 + (index * 0.073) % 0.38
  const phase = index * 1.13
  const entryDelay = index * 0.08  // segundos de stagger
  const entryDuration = 0.5

  useFrame(({ clock }) => {
    if (!meshRef.current || !materialRef.current) return
    const t = clock.getElapsedTime()
    const canAnimate = !prefersReduced && isVisibleRef.current

    // Entry fade-in: basado en clock, sin useEffect ni spring
    let entryAlpha = 1
    if (!prefersReduced) {
      const entryT = Math.max(0, t - entryDelay)
      const raw = Math.min(entryT / entryDuration, 1)
      // Ease-out cúbico
      entryAlpha = 1 - Math.pow(1 - raw, 3)
    }

    // Idle float
    const idleY = canAnimate ? Math.sin(t * freq + phase) * 0.08 : 0
    const idleRot = canAnimate ? Math.sin(t * freq * 0.5 + phase) * 0.05 : 0

    // Hover: lerp suave hacia target
    const targetScale = isHovered ? 1.25 : 1
    const targetOpacity = isBlurred ? 0.35 : 1
    hoverScale.current += (targetScale - hoverScale.current) * 0.12
    hoverOpacity.current += (targetOpacity - hoverOpacity.current) * 0.12

    // Aplicar todo
    meshRef.current.position.set(
      basePosition[0],
      basePosition[1] + idleY,
      basePosition[2]
    )
    meshRef.current.scale.setScalar(hoverScale.current)
    meshRef.current.rotation.z = idleRot
    materialRef.current.opacity = entryAlpha * hoverOpacity.current
  })

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHoveredIndex(index)}
      onPointerOut={() => setHoveredIndex(null)}
    >
      <planeGeometry args={[0.65, 0.65]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        depthWrite={false}
      />
      {isHovered && (
        <Html center distanceFactor={8}>
          <div
            style={{
              color: tech.color,
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'Inter, -apple-system, sans-serif',
              marginTop: '52px',
              whiteSpace: 'nowrap',
              textShadow: `0 0 12px ${tech.color}99`,
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {tech.name}
          </div>
        </Html>
      )}
    </mesh>
  )
}

// Escena: posiciones 4x3 determinísticas
function Scene({ techs, isVisibleRef, prefersReduced }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const positions = useMemo(() => {
    return techs.map((_, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const seed = i * 13.37
      const offsetX = Math.sin(seed) * 0.28
      const offsetY = Math.cos(seed * 1.7) * 0.14
      const offsetZ = Math.sin(seed * 2.3) * 0.4
      return [
        -2.25 + col * 1.5 + offsetX,
        1.0 - row * 0.82 + offsetY,
        offsetZ
      ]
    })
  }, [techs])

  return (
    <>
      {techs.map((tech, i) => (
        <TechSprite
          key={tech.name}
          tech={tech}
          basePosition={positions[i]}
          index={i}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
          isVisibleRef={isVisibleRef}
          prefersReduced={prefersReduced}
        />
      ))}
    </>
  )
}

export default function TechOrbit({ height = 500, items = [] }) {
  const wrapperRef = useRef()
  const isVisibleRef = useRef(true)

  const prefersReduced = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting },
      { threshold: 0.1 }
    )
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapperRef} className="tech-orbit-wrapper" style={{ height: `${height}px` }}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 50 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene
          techs={items}
          isVisibleRef={isVisibleRef}
          prefersReduced={prefersReduced}
        />
      </Canvas>
    </div>
  )
}
