import { useRef, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ── Plataforma glow (geometría inline — separada del GLB) ─────────────────────
function Platform() {
  return (
    <group>
      {/* Disco principal */}
      <mesh>
        <cylinderGeometry args={[1.2, 1.2, 0.04, 48]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.85} />
      </mesh>
      {/* Ring exterior con glow difuso */}
      <mesh position={[0, -0.01, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 0.02, 48]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

// ── Modelo del avatar (cargado desde GLB) ─────────────────────────────────────
function AvatarModel({ mouseRef }) {
  const { scene: rawScene } = useGLTF('/models/avatar.glb')
  const rootRef = useRef()
  const headGroupRef = useRef(null)
  const curRot = useRef({ x: 0, y: 0 })

  // Create toon gradient per component instance — safe for multi-canvas
  const toonGradient = useMemo(() => {
    const data = new Uint8Array([90, 148, 200, 238])
    const tex = new THREE.DataTexture(data, 4, 1, THREE.RedFormat)
    tex.magFilter = THREE.NearestFilter
    tex.needsUpdate = true
    return tex
  }, [])

  // Clone scene to avoid mutating the globally cached GLTF scene
  const scene = useMemo(() => rawScene.clone(true), [rawScene])

  // Reemplazar materiales GLB (PBR) con MeshToonMaterial
  useEffect(() => {
    const replaced = []
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const old = child.material
        const color = old.color?.clone() ?? new THREE.Color(0xffffff)
        const next = new THREE.MeshToonMaterial({ color, gradientMap: toonGradient })
        child.material = next
        replaced.push({ mesh: child, old, next })
      }
    })

    // Buscar el empty 'head_group' para head tracking
    const hg = scene.getObjectByName('head_group')
    if (hg) headGroupRef.current = hg
    else console.warn('Avatar3D: head_group not found in GLB — head tracking disabled')

    return () => {
      replaced.forEach(({ mesh, old, next }) => {
        next.dispose()
        mesh.material = old
      })
    }
  }, [scene, toonGradient])

  useEffect(() => {
    return () => toonGradient.dispose()
  }, [toonGradient])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Float idle
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 0.85) * 0.08
    }

    // Head tracking — muy sutil, con límites y suavizado lento
    if (headGroupRef.current && mouseRef.current) {
      const mx = mouseRef.current.x  // -1 a 1
      const my = mouseRef.current.y  // -1 a 1

      // Límites: ±15° en Y (yaw), ±8° en X (pitch)
      const targetY = Math.max(-0.26, Math.min(0.26,  mx * 0.18))
      const targetX = Math.max(-0.14, Math.min(0.14, -my * 0.10))

      // Lerp muy lento → movimiento orgánico
      curRot.current.x += (targetX - curRot.current.x) * 0.05
      curRot.current.y += (targetY - curRot.current.y) * 0.05

      headGroupRef.current.rotation.x = curRot.current.x
      headGroupRef.current.rotation.y = curRot.current.y
    }
  })

  // rotation Y 180°: Blender +Y → glTF -Z → necesita girar para mirar a cámara
  // position.y ajusta la altura del avatar en el canvas
  return <primitive ref={rootRef} object={scene} position={[0, -1.55, 0]} rotation={[0, Math.PI, 0]} />
}

// ── Fallback mientras carga el GLB ────────────────────────────────────────────
function AvatarFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.6, 8, 6]} />
      <meshBasicMaterial color="#1C1C26" transparent opacity={0.35} />
    </mesh>
  )
}

// ── Export principal ──────────────────────────────────────────────────────────
export default function Avatar3D() {
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = {
        x:  (e.clientX / window.innerWidth  - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0.4, 5.5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 4, 5]}  intensity={1.4} color="#fff6e8" />
      <directionalLight position={[-2, 1, 2]} intensity={0.4} color="#7c3aed" />

      {/* Plataforma posicionada en la base del avatar */}
      <group position={[0, -1.8, 0]}>
        <Platform />
      </group>

      <Suspense fallback={<AvatarFallback />}>
        <AvatarModel mouseRef={mouseRef} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload('/models/avatar.glb')
