# Tech Sphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la sección Stack con una esfera interactiva de 43 tecnologías distribuidas con algoritmo Fibonacci, rotable con drag, con hover/click y fallback CSS para móvil.

**Architecture:** `TechOrbit.jsx` contiene cuatro componentes: `FallbackSprite` (placeholder cuando SVG falla), `TechSprite` (sprite individual con Billboard + useTexture + hover), `TechSphere` (escena + OrbitControls + estado), y `TechOrbit` (wrapper Canvas con IntersectionObserver y listeners). `Stack.jsx` y `Stack.css` solo reciben ajuste de alturas.

**Tech Stack:** React, @react-three/fiber, @react-three/drei (Billboard, useTexture, OrbitControls, Html), Three.js

---

## Task 1: Copiar los 31 logos SVG faltantes a public/images/tech/

**Files:**
- Modify: `public/images/tech/` (agregar 31 archivos)

Los primeros 12 logos ya están copiados de sesiones anteriores. Copiar los 31 faltantes:

- [ ] **Step 1: Copiar logos con un solo comando bash**

```bash
SRC="D:/Fotos/Pictures/Screenshots/logos_tecnologias"
DEST="C:/Users/denny/OneDrive/Escritorio/Proyectos Dennys/dennysh-portfolio/public/images/tech"

cp "$SRC/Prompt-Engineering.svg"  "$DEST/prompt-engineering.svg"
cp "$SRC/OpenAI-API.svg"          "$DEST/openai.svg"
cp "$SRC/Gemini.svg"              "$DEST/gemini.svg"
cp "$SRC/Claude.svg"              "$DEST/claude.svg"
cp "$SRC/Whisper.svg"             "$DEST/whisper.svg"
cp "$SRC/Git.svg"                 "$DEST/git.svg"
cp "$SRC/GitHub.svg"              "$DEST/github.svg"
cp "$SRC/Vercel.svg"              "$DEST/vercel.svg"
cp "$SRC/Cloudflare.svg"          "$DEST/cloudflare.svg"
cp "$SRC/Azure.svg"               "$DEST/azure.svg"
cp "$SRC/REST-APIs.svg"           "$DEST/rest-apis.svg"
cp "$SRC/Webhooks.svg"            "$DEST/webhooks.svg"
cp "$SRC/HTML.svg"                "$DEST/html.svg"
cp "$SRC/CSS.svg"                 "$DEST/css.svg"
cp "$SRC/Vite.svg"                "$DEST/vite.svg"
cp "$SRC/Power-BI.svg"            "$DEST/power-bi.svg"
cp "$SRC/ETL-pipelines.svg"       "$DEST/etl.svg"
cp "$SRC/Linux.svg"               "$DEST/linux.svg"
cp "$SRC/Windows.svg"             "$DEST/windows.svg"
cp "$SRC/SSH.svg"                 "$DEST/ssh.svg"
cp "$SRC/OpenVPN.svg"             "$DEST/openvpn.svg"
cp "$SRC/Nmap.svg"                "$DEST/nmap.svg"
cp "$SRC/Wireshark.svg"           "$DEST/wireshark.svg"
cp "$SRC/VirtualBox.svg"          "$DEST/virtualbox.svg"
cp "$SRC/VMware.svg"              "$DEST/vmware.svg"
cp "$SRC/Field-automation.svg"    "$DEST/automation.svg"
cp "$SRC/AI-Agents.svg"           "$DEST/ai-agents.svg"
cp "$SRC/CSV-data-pipelines.svg"  "$DEST/data-pipelines.svg"
cp "$SRC/Microservices.svg"       "$DEST/microservices.svg"
cp "$SRC/Backend.svg"             "$DEST/backend.svg"
cp "$SRC/API-Design.svg"          "$DEST/api-design.svg"
cp "$SRC/Database-Design.svg"     "$DEST/database-design.svg"
echo "Done"
```

Expected output: `Done` sin errores.

- [ ] **Step 2: Verificar que hay 43 archivos SVG en el destino**

```bash
ls "C:/Users/denny/OneDrive/Escritorio/Proyectos Dennys/dennysh-portfolio/public/images/tech/" | wc -l
```

Expected: `43`

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/denny/OneDrive/Escritorio/Proyectos Dennys/dennysh-portfolio"
git add public/images/tech/
git commit -m "feat: add 31 remaining tech SVG logos to public/images/tech"
```

---

## Task 2: Actualizar content.js con las 43 tecnologías

**Files:**
- Modify: `src/data/content.js`

- [ ] **Step 1: Reemplazar el bloque `stack` completo**

Buscar el bloque `stack: { ... }` en `src/data/content.js` y reemplazarlo con:

```js
  stack: {
    title: 'Stack & Tecnologías',
    items: [
      { name: 'Python',            color: '#3776ab', image: '/images/tech/python.svg' },
      { name: 'Go',                color: '#00add8', image: '/images/tech/go.svg' },
      { name: 'JavaScript',        color: '#f7df1e', image: '/images/tech/javascript.svg' },
      { name: 'React',             color: '#61dafb', image: '/images/tech/react.svg' },
      { name: 'Node.js',           color: '#339933', image: '/images/tech/nodejs.svg' },
      { name: 'Three.js',          color: '#cccccc', image: '/images/tech/threejs.svg' },
      { name: 'MongoDB',           color: '#47a248', image: '/images/tech/mongodb.svg' },
      { name: 'PostgreSQL',        color: '#4169e1', image: '/images/tech/postgresql.svg' },
      { name: 'SQLite',            color: '#0f7bb5', image: '/images/tech/sqlite.svg' },
      { name: 'Docker',            color: '#2496ed', image: '/images/tech/docker.svg' },
      { name: 'Telegram Bots',     color: '#229ed9', image: '/images/tech/telegram.svg' },
      { name: 'LLM APIs',          color: '#a855f7', image: '/images/tech/llm.svg' },
      { name: 'Prompt Engineering',color: '#8b5cf6', image: '/images/tech/prompt-engineering.svg' },
      { name: 'OpenAI API',        color: '#00a67e', image: '/images/tech/openai.svg' },
      { name: 'Gemini',            color: '#4285f4', image: '/images/tech/gemini.svg' },
      { name: 'Claude',            color: '#d97706', image: '/images/tech/claude.svg' },
      { name: 'Whisper',           color: '#10b981', image: '/images/tech/whisper.svg' },
      { name: 'Git',               color: '#f05032', image: '/images/tech/git.svg' },
      { name: 'GitHub',            color: '#e6edf3', image: '/images/tech/github.svg' },
      { name: 'Vercel',            color: '#e6edf3', image: '/images/tech/vercel.svg' },
      { name: 'Cloudflare',        color: '#f48120', image: '/images/tech/cloudflare.svg' },
      { name: 'Azure',             color: '#0089d6', image: '/images/tech/azure.svg' },
      { name: 'REST APIs',         color: '#6366f1', image: '/images/tech/rest-apis.svg' },
      { name: 'Webhooks',          color: '#f59e0b', image: '/images/tech/webhooks.svg' },
      { name: 'HTML',              color: '#e34f26', image: '/images/tech/html.svg' },
      { name: 'CSS',               color: '#1572b6', image: '/images/tech/css.svg' },
      { name: 'Vite',              color: '#646cff', image: '/images/tech/vite.svg' },
      { name: 'Power BI',          color: '#f2c811', image: '/images/tech/power-bi.svg' },
      { name: 'ETL',               color: '#0ea5e9', image: '/images/tech/etl.svg' },
      { name: 'Linux',             color: '#fcc624', image: '/images/tech/linux.svg' },
      { name: 'Windows',           color: '#00adef', image: '/images/tech/windows.svg' },
      { name: 'SSH',               color: '#4ade80', image: '/images/tech/ssh.svg' },
      { name: 'OpenVPN',           color: '#ff6600', image: '/images/tech/openvpn.svg' },
      { name: 'Nmap',              color: '#4b9cd3', image: '/images/tech/nmap.svg' },
      { name: 'Wireshark',         color: '#1679a7', image: '/images/tech/wireshark.svg' },
      { name: 'VirtualBox',        color: '#183a61', image: '/images/tech/virtualbox.svg' },
      { name: 'VMware',            color: '#607078', image: '/images/tech/vmware.svg' },
      { name: 'Automation',        color: '#22c55e', image: '/images/tech/automation.svg' },
      { name: 'AI Agents',         color: '#c026d3', image: '/images/tech/ai-agents.svg' },
      { name: 'Data Pipelines',    color: '#0891b2', image: '/images/tech/data-pipelines.svg' },
      { name: 'Microservices',     color: '#7c3aed', image: '/images/tech/microservices.svg' },
      { name: 'Backend Systems',   color: '#1d4ed8', image: '/images/tech/backend.svg' },
      { name: 'API Design',        color: '#9333ea', image: '/images/tech/api-design.svg' },
      { name: 'Database Design',   color: '#b45309', image: '/images/tech/database-design.svg' },
    ]
  },
```

- [ ] **Step 2: Verificar que hay 43 items**

```bash
node -e "
import('./src/data/content.js').then(m => {
  console.log(m.content.stack.items.length)
}).catch(() => {
  // ES module fallback: just grep
  console.log('check manually')
})"
```

Si falla por ES module, verificar manualmente que el bloque tiene 44 líneas de items (1 por tecnología + apertura y cierre del array).

- [ ] **Step 3: Commit**

```bash
git add src/data/content.js
git commit -m "feat: expand stack to 43 technologies with SVG image paths"
```

---

## Task 3: Reemplazar TechOrbit.jsx con la esfera interactiva

**Files:**
- Replace: `src/components/TechOrbit.jsx`

- [ ] **Step 1: Escribir el archivo completo**

Crear `src/components/TechOrbit.jsx` con este contenido:

```jsx
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

  useFrame(() => {
    if (!meshRef.current) return
    const target = (isHovered || isSelected) ? 1.2 : 1.0
    currentScale.current += (target - currentScale.current) * 0.12
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
function TechSpriteWithFallback({ tech, ...props }) {
  return (
    <Suspense fallback={<FallbackSprite name={tech.name} />}>
      <TechSprite tech={tech} {...props} />
    </Suspense>
  )
}

// ── Escena: posiciones Fibonacci + OrbitControls + estado hover/selected ──────
function TechSphere({ items, isVisibleRef, prefersReduced, controlsRef }) {
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
          isVisibleRef={isVisibleRef}
          prefersReduced={prefersReduced}
          controlsRef={controlsRef}
        />
      </Canvas>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que el archivo fue escrito correctamente**

```bash
wc -l "C:/Users/denny/OneDrive/Escritorio/Proyectos Dennys/dennysh-portfolio/src/components/TechOrbit.jsx"
```

Expected: entre 140 y 170 líneas.

- [ ] **Step 3: Commit**

```bash
git add src/components/TechOrbit.jsx
git commit -m "feat: replace floating sprites with interactive Fibonacci sphere"
```

---

## Task 4: Actualizar alturas en Stack.jsx

**Files:**
- Modify: `src/sections/Stack.jsx`

- [ ] **Step 1: Actualizar `StackFallback` para usar `tech.image` en lugar de `tech.icon`**

En `src/sections/Stack.jsx`, localizar el componente `StackFallback` y reemplazarlo con:

```jsx
function StackFallback({ items }) {
  return (
    <div className="stack-fallback">
      {items.map((tech) => (
        <div
          key={tech.name}
          className="stack-fallback-card"
          style={{
            '--tech-color': tech.color,
            '--tech-color-glow': tech.color + '44'
          }}
        >
          <img
            src={tech.image}
            alt={tech.name}
            className="stack-fallback-icon"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <span className="stack-fallback-name">{tech.name}</span>
        </div>
      ))}
    </div>
  )
}
```

Y en `Stack.css`, actualizar `.stack-fallback-icon` para que funcione con `<img>`:

```css
.stack-fallback-icon {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}
```

- [ ] **Step 2: Actualizar la función `useCanvasHeight`**

En `src/sections/Stack.jsx`, localizar la función `useCanvasHeight` y reemplazarla con:

```jsx
function useCanvasHeight() {
  const getHeight = () => {
    const w = window.innerWidth
    if (w >= 1280) return 600
    if (w >= 1024) return 540
    return 480 // tablet 768–1023px
  }

  const [height, setHeight] = useState(getHeight)

  useEffect(() => {
    const update = () => setHeight(getHeight())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return height
}
```

- [ ] **Step 3: Commit**

```bash
git add src/sections/Stack.jsx src/sections/Stack.css
git commit -m "feat: update canvas heights + fix fallback to use SVG images"
```

---

## Task 5: Actualizar Stack.css con alturas de esfera

**Files:**
- Modify: `src/sections/Stack.css`

- [ ] **Step 1: Agregar breakpoints de altura al wrapper**

En `src/sections/Stack.css`, el bloque `.tech-orbit-wrapper` actual no tiene reglas de altura (la altura se pasa via inline style). No es necesario modificar el CSS — las alturas ya son manejadas por el inline style `height: ${height}px` en el componente.

Verificar que `.tech-orbit-wrapper` tiene al menos `width: 100%` y `border-radius`:

```bash
grep -A5 "tech-orbit-wrapper" "C:/Users/denny/OneDrive/Escritorio/Proyectos Dennys/dennysh-portfolio/src/sections/Stack.css"
```

Expected output debe incluir `width: 100%`. Si no está, agregar:

```css
.tech-orbit-wrapper {
  width: 100%;
  margin-top: 2.5rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
}
```

Si ya está correcto, no hay nada que hacer en este task. Hacer commit vacío solo si hubo cambios:

```bash
git add src/sections/Stack.css
git status
# Solo hacer commit si hay cambios staged
git commit -m "fix: ensure tech-orbit-wrapper has correct base styles"
```

---

## Task 6: Verificar en el navegador

**Files:** (ninguno — solo verificación)

- [ ] **Step 1: Levantar el servidor**

```bash
npm run dev
```

Abrir `http://localhost:5174` (o el puerto que use).

- [ ] **Step 2: Verificar comportamiento desktop**

Checklist visual:
- [ ] 43 logos flotando en formación esférica (sin esfera visible)
- [ ] Click + drag rota la esfera suavemente
- [ ] Al soltar el drag, la inercia desacelera gradualmente (damping)
- [ ] La rotación idle reanuda ~2s después de soltar
- [ ] Hover sobre un logo: se agranda levemente, aparece nombre con fondo oscuro
- [ ] Click en un logo: nombre queda fijo (persiste hasta otro click en el mismo)
- [ ] Los logos siempre miran hacia la cámara (billboard)
- [ ] No se puede voltear la esfera al revés (polar limits)

- [ ] **Step 3: Verificar responsive**

DevTools F12 → Toggle Device Toolbar:
- ~375px móvil: grid 2 columnas con las 43 tecnologías en cards CSS
- ~800px tablet: esfera visible, altura ~480px
- ~1300px desktop: esfera visible, altura 600px

- [ ] **Step 4: Verificar los 3 temas**

Botón de tema en navbar:
- Dark: fondo oscuro, logos visibles
- Light: fondo claro, logos visibles
- Hacker: fondo verde, logos visibles

- [ ] **Step 5: Troubleshooting común**

**Logos no aparecen / canvas negro:**
→ Verificar que los 43 SVGs están en `public/images/tech/`
→ Abrir DevTools Network, filtrar por SVG, ver si hay 404s

**Error "useTexture called outside Canvas":**
→ Verificar que `TechSprite` está dentro del `Canvas` en la jerarquía

**OrbitControls no funciona:**
→ Verificar import: `import { OrbitControls } from '@react-three/drei'`
→ Verificar que `controlsRef` se pasa correctamente de `TechOrbit` → `TechSphere`

**Esfera se voltea (logos al revés):**
→ Verificar `minPolarAngle={Math.PI * 0.15}` y `maxPolarAngle={Math.PI * 0.85}` en `<OrbitControls>`

**Logos muy pequeños o muy grandes:**
→ Ajustar `args={[0.45, 0.45]}` en `<planeGeometry>` (más grande = más grande el logo)
→ Ajustar el radio `2.5` en `fibonacciSphere(items.length, 2.5)` (más grande = más separados)

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "feat: tech sphere complete — 43 technologies on interactive Fibonacci globe"
```
