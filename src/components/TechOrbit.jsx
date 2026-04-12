import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Billboard, useTexture, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ── Fibonacci sphere: distribución uniforme sobre la esfera ───────────────────
function fibonacciSphere(count, radius) {
  const phi = Math.PI * (3 - Math.sqrt(5)) // golden angle ≈ 2.399 rad
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2    // rango -1 a 1
    const r = Math.sqrt(1 - y * y)          // radio en esa altura
    const theta = phi * i                   // ángulo acumulado
    return [
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius
    ]
  })
}

// ── Fallback: círculo gris con inicial cuando SVG falla ───────────────────────
function FallbackSprite({ name }) {
  const texture = useMemo(() => {
    const size = 128
    const cv = document.createElement('canvas')
    cv.width = size
    cv.height = size
    const ctx = cv.getContext('2d')
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
    ctx.fillStyle = '#44444488'
    ctx.fill()
    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#999999'
    ctx.font = `bold ${size * 0.4}px "Segoe UI", Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name.charAt(0).toUpperCase(), size / 2, size / 2 + 2)
    const tex = new THREE.CanvasTexture(cv)
    tex.needsUpdate = true
    return tex
  }, [name])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <Billboard>
      <mesh>
        <planeGeometry args={[0.45, 0.45]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </Billboard>
  )
}

// ── Sprite individual: logo + hover/click ─────────────────────────────────────
function TechSprite({ tech, position, isHovered, isSelected, onHover, onBlur, onClick }) {
  const meshRef = useRef()
  const currentScale = useRef(1)
  const texture = useTexture(tech.image)
  useEffect(() => () => texture.dispose(), [texture])

  useFrame(() => {
    if (!meshRef.current) return
    const target = (isHovered || isSelected) ? 1.2 : 1.0
    const delta = target - currentScale.current
    if (Math.abs(delta) < 0.001) return
    currentScale.current += delta * 0.12
    meshRef.current.scale.setScalar(currentScale.current)
  })

  return (
    <Billboard position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover() }}
        onPointerOut={() => onBlur()}
        onClick={(e) => { e.stopPropagation(); onClick() }}
      >
        <planeGeometry args={[0.45, 0.45]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
      {(isHovered || isSelected) && (
        <Html center distanceFactor={10}>
          <div style={{
            color: tech.color,
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'Inter, -apple-system, sans-serif',
            marginTop: '28px',
            whiteSpace: 'nowrap',
            textShadow: `0 0 8px ${tech.color}99`,
            pointerEvents: 'none',
            userSelect: 'none',
            background: 'rgba(0,0,0,0.55)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {tech.name}
          </div>
        </Html>
      )}
    </Billboard>
  )
}

// ── Sprite con Suspense + FallbackSprite ──────────────────────────────────────
const TechSpriteWithFallback = React.memo(function TechSpriteWithFallback({ tech, ...props }) {
  return (
    <Suspense fallback={<FallbackSprite name={tech.name} />}>
      <TechSprite tech={tech} {...props} />
    </Suspense>
  )
})

// ── Escena: posiciones Fibonacci + OrbitControls + estado hover/selected ──────
function TechSphere({ items, prefersReduced, controlsRef }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)

  const positions = useMemo(
    () => fibonacciSphere(items.length, 2.5),
    [items.length]
  )

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        autoRotate={!prefersReduced}
        autoRotateSpeed={0.4}
      />
      {items.map((tech, i) => (
        <TechSpriteWithFallback
          key={tech.name}
          tech={tech}
          position={positions[i]}
          isHovered={hoveredIndex === i}
          isSelected={selectedIndex === i}
          onHover={() => setHoveredIndex(i)}
          onBlur={() => setHoveredIndex(null)}
          onClick={() => setSelectedIndex(prev => prev === i ? null : i)}
        />
      ))}
    </>
  )
}

// ── Export principal: Canvas wrapper ──────────────────────────────────────────
export default function TechOrbit({ height = 600, items = [] }) {
  const wrapperRef = useRef()
  const isVisibleRef = useRef(true)
  const controlsRef = useRef()
  const resumeTimerRef = useRef(null)
  const [prefersReduced, setPrefersReduced] = useState(false)

  // prefers-reduced-motion — reactivo a cambios del sistema
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mql.matches)
    const handler = (e) => setPrefersReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // IntersectionObserver — pausa idle cuando sección fuera de vista
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
        if (controlsRef.current) {
          controlsRef.current.autoRotate = entry.isIntersecting && !prefersReduced
        }
      },
      { threshold: 0.1 }
    )
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [prefersReduced])

  // Idle rotation: pausa en drag, reanuda 2s después de soltar
  const handlePointerDown = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    if (controlsRef.current) controlsRef.current.autoRotate = false
  }

  const handlePointerUp = () => {
    if (prefersReduced) return
    resumeTimerRef.current = setTimeout(() => {
      if (controlsRef.current && isVisibleRef.current) {
        controlsRef.current.autoRotate = true
      }
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="tech-orbit-wrapper"
      style={{ height: `${height}px`, cursor: 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onPointerDown={(e) => { e.currentTarget.style.cursor = 'grabbing' }}
        onPointerUp={(e) => { e.currentTarget.style.cursor = 'grab' }}
      >
        <TechSphere
          items={items}
          prefersReduced={prefersReduced}
          controlsRef={controlsRef}
        />
      </Canvas>
    </div>
  )
}
