import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSpring } from '@react-spring/three'
import * as THREE from 'three'

// Genera una textura canvas con emoji + círculo de color de marca
function createEmojiTexture(emoji, color) {
  const size = 128
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size
  const ctx = cv.getContext('2d')

  // Fondo circular semitransparente con color de marca
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2)
  ctx.fillStyle = color + '28'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()

  // Emoji centrado
  ctx.font = `${size * 0.48}px "Segoe UI Emoji", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2 + 2)

  const texture = new THREE.CanvasTexture(cv)
  texture.needsUpdate = true
  return texture
}

// Sprite individual de tecnología
function TechSprite({ tech, basePosition, index, hoveredIndex, setHoveredIndex, isVisibleRef, prefersReduced }) {
  const meshRef = useRef()
  const materialRef = useRef()
  const isHovered = hoveredIndex === index
  const isBlurred = hoveredIndex !== null && !isHovered

  const textureRef = useRef(null)
  if (!textureRef.current) {
    textureRef.current = createEmojiTexture(tech.icon, tech.color)
  }
  useEffect(() => {
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
    }
  }, [])

  // Spring de entrada: yEntry va de +5 (arriba) a 0 (posición final)
  const [{ yEntry }, entryApi] = useSpring(() => ({
    yEntry: prefersReduced ? 0 : 5,
    config: { mass: 1, tension: 120, friction: 14 }
  }))

  // Spring de hover: escala y opacidad
  const [{ scale, meshOpacity }, hoverApi] = useSpring(() => ({
    scale: 1,
    meshOpacity: 1,
    config: { mass: 0.5, tension: 200, friction: 20 }
  }))

  // Lanzar animación de entrada con stagger
  useEffect(() => {
    if (prefersReduced) return
    const timer = setTimeout(() => {
      entryApi.start({ yEntry: 0 })
    }, index * 80)
    return () => clearTimeout(timer)
  }, [prefersReduced, index, entryApi])

  // Actualizar hover spring cuando cambia el estado
  useEffect(() => {
    hoverApi.start({
      scale: isHovered ? 1.25 : 1,
      meshOpacity: isBlurred ? 0.35 : 1
    })
  }, [isHovered, isBlurred, hoverApi])

  // Frecuencia y fase únicas por sprite para movimiento independiente
  const freq = 0.28 + (index * 0.073) % 0.38
  const phase = index * 1.13

  // Loop de animación: idle float + aplicar springs imperativamente
  useFrame(({ clock }) => {
    if (!meshRef.current || !materialRef.current) return
    const t = clock.getElapsedTime()
    const canAnimate = !prefersReduced && isVisibleRef.current

    const idleY = canAnimate ? Math.sin(t * freq + phase) * 0.08 : 0
    const idleRot = canAnimate ? Math.sin(t * freq * 0.5 + phase) * 0.05 : 0

    meshRef.current.position.set(
      basePosition[0],
      basePosition[1] + yEntry.get() + idleY,
      basePosition[2]
    )
    meshRef.current.scale.setScalar(scale.get())
    meshRef.current.rotation.z = idleRot
    materialRef.current.opacity = meshOpacity.get()
  })

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHoveredIndex(index)}
      onPointerOut={() => setHoveredIndex(null)}
    >
      <planeGeometry args={[0.62, 0.62]} />
      <meshBasicMaterial
        ref={materialRef}
        map={textureRef.current}
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
              marginTop: '54px',
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

// Escena Three.js: calcula posiciones y renderiza todos los sprites
function Scene({ techs, isVisibleRef, prefersReduced }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Posiciones en cuadrícula 4x3 con offset semi-random determinístico
  const positions = useMemo(() => {
    return techs.map((_, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const seed = i * 13.37
      const offsetX = Math.sin(seed) * 0.28
      const offsetY = Math.cos(seed * 1.7) * 0.14
      const offsetZ = Math.sin(seed * 2.3) * 0.5
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

// Componente público: canvas wrapper con IntersectionObserver
export default function TechOrbit({ height = 500, items }) {
  const wrapperRef = useRef()
  const isVisibleRef = useRef(true)

  const prefersReduced = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  // Pausar animaciones cuando la sección no está visible
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
