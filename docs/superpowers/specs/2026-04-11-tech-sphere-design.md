# Tech Sphere — Interactive Technology Globe

**Date:** 2026-04-11
**Status:** Approved

---

## Objetivo

Reemplazar la sección Stack actual (sprites flotantes planos) por una esfera interactiva de tecnologías. El usuario puede rotar la esfera con click+drag como si fuera un planeta, descubriendo los 43 logos distribuidos uniformemente en su superficie.

---

## Concepto visual

Logos flotando en formación esférica — sin esfera visible. La forma la sugieren los propios logos distribuidos en espacio 3D. No hay wireframe ni superficie visible.

---

## Tecnologías (43)

| Tecnología | Archivo SVG |
|---|---|
| Python | `/images/tech/python.svg` |
| Go | `/images/tech/go.svg` |
| JavaScript | `/images/tech/javascript.svg` |
| React | `/images/tech/react.svg` |
| Node.js | `/images/tech/nodejs.svg` |
| Three.js | `/images/tech/threejs.svg` |
| MongoDB | `/images/tech/mongodb.svg` |
| PostgreSQL | `/images/tech/postgresql.svg` |
| SQLite | `/images/tech/sqlite.svg` |
| Docker | `/images/tech/docker.svg` |
| Telegram Bots | `/images/tech/telegram.svg` |
| LLM APIs | `/images/tech/llm.svg` |
| Prompt Engineering | `/images/tech/prompt-engineering.svg` |
| OpenAI API | `/images/tech/openai.svg` |
| Gemini | `/images/tech/gemini.svg` |
| Claude | `/images/tech/claude.svg` |
| Whisper | `/images/tech/whisper.svg` |
| Git | `/images/tech/git.svg` |
| GitHub | `/images/tech/github.svg` |
| Vercel | `/images/tech/vercel.svg` |
| Cloudflare | `/images/tech/cloudflare.svg` |
| Azure | `/images/tech/azure.svg` |
| REST APIs | `/images/tech/rest-apis.svg` |
| Webhooks | `/images/tech/webhooks.svg` |
| HTML | `/images/tech/html.svg` |
| CSS | `/images/tech/css.svg` |
| Vite | `/images/tech/vite.svg` |
| Power BI | `/images/tech/power-bi.svg` |
| ETL | `/images/tech/etl.svg` |
| Linux | `/images/tech/linux.svg` |
| Windows | `/images/tech/windows.svg` |
| SSH | `/images/tech/ssh.svg` |
| OpenVPN | `/images/tech/openvpn.svg` |
| Nmap | `/images/tech/nmap.svg` |
| Wireshark | `/images/tech/wireshark.svg` |
| VirtualBox | `/images/tech/virtualbox.svg` |
| VMware | `/images/tech/vmware.svg` |
| Automation | `/images/tech/automation.svg` |
| AI Agents | `/images/tech/ai-agents.svg` |
| Data Pipelines | `/images/tech/data-pipelines.svg` |
| Microservices | `/images/tech/microservices.svg` |
| Backend Systems | `/images/tech/backend.svg` |
| API Design | `/images/tech/api-design.svg` |
| Database Design | `/images/tech/database-design.svg` |

---

## Arquitectura de archivos

```
src/
├── sections/
│   ├── Stack.jsx          ← sin cambios (detecta móvil, pasa items)
│   └── Stack.css          ← solo actualizar altura canvas
├── components/
│   └── TechOrbit.jsx      ← reemplazado completamente
└── data/
    └── content.js         ← actualizado con 43 tecnologías + image paths
public/
└── images/tech/           ← 43 SVGs copiados desde carpeta de logos
```

---

## Componentes internos de TechOrbit.jsx

### `TechOrbit` (export default)
- Recibe `{ height, items }`
- Monta `IntersectionObserver` → `isVisibleRef.current`
- Lee `prefers-reduced-motion` → `prefersReduced`
- Limpia observer y matchMedia listener en cleanup
- Renderiza `<Canvas>` con `OrbitControls` y `<TechSphere>`
- Canvas: `dpr={[1, 1.5]}`, `frameloop="always"`, `gl={{ alpha: true }}`, cursor `grab/grabbing`

### `TechSphere`
- Recibe `{ items, isVisibleRef, prefersReduced }`
- Calcula posiciones Fibonacci sphere (ver algoritmo abajo)
- Maneja estado: `hoveredIndex`, `selectedIndex`
- Maneja idle rotation state: `autoRotate` activo/pausado
- Pasa `pointerDown/Up` al Canvas para pausar/reanudar idle
- Renderiza `OrbitControls` + todos los `TechSprite` dentro de `Suspense`

### `TechSprite`
- Recibe `{ tech, position, isHovered, isSelected, onHover, onBlur, onClick }`
- Carga textura con `useTexture(tech.image)`
- Usa `<Billboard>` de drei → siempre mira a la cámara
- `useFrame`: lerp de escala hacia target (1.0 normal, 1.2 hover/selected)
- Muestra `<Html>` con nombre cuando `isHovered || isSelected`
- Lógica mínima — solo render e interacción local

### `FallbackSprite`
- Recibe `{ name, color }`
- Renderiza círculo gris semitransparente con inicial del nombre en canvas 2D
- Usado como fallback en `<Suspense>` cuando el SVG falla

---

## Algoritmo Fibonacci Sphere

```js
function fibonacciSphere(count, radius) {
  const phi = Math.PI * (3 - Math.sqrt(5)) // golden angle
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2   // rango -1 a 1
    const r = Math.sqrt(1 - y * y)         // radio en esa altura
    const theta = phi * i                  // ángulo acumulado
    return [
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius
    ]
  })
}
```

Radio: `2.5` unidades. Cámara: `z=6`, `fov=50`.

---

## OrbitControls

```jsx
<OrbitControls
  enableZoom={false}
  enablePan={false}
  enableDamping={true}
  dampingFactor={0.08}
  rotateSpeed={0.6}
  minPolarAngle={Math.PI * 0.15}
  maxPolarAngle={Math.PI * 0.85}
  autoRotate={autoRotate}
  autoRotateSpeed={0.4}
/>
```

---

## Idle rotation

- Estado `autoRotate` en `TechSphere` (ref, no state — no re-render)
- `pointerDown` en canvas → `autoRotate = false`
- `pointerUp` en canvas → `setTimeout 2000ms` → `autoRotate = true`
- `prefersReduced = true` → `autoRotate` siempre `false`
- Pausa cuando `!isVisibleRef.current`

---

## Hover y Click

**Hover:**
- `onPointerOver` → `setHoveredIndex(i)`
- `onPointerOut` → `setHoveredIndex(null)`
- Escala 1.0 → 1.2 via lerp en `useFrame`
- `<Html>` con nombre visible debajo del sprite

**Click:**
- `onClick` → toggle `selectedIndex` (mismo índice = deselecciona)
- Click en canvas vacío → `setSelectedIndex(null)`
- Tooltip persiste hasta otro click

**Billboard:**
- `<Billboard>` de `@react-three/drei` — orientación hacia cámara automática

---

## Alturas del canvas

| Breakpoint | Altura |
|---|---|
| Desktop ≥ 1280px | 600px |
| Laptop 1024–1279px | 540px |
| Tablet 768–1023px | 480px |
| Móvil < 768px | Fallback grid CSS |

---

## Fallback móvil

`StackFallback` existente en `Stack.jsx` — grid 2 columnas. Solo actualizar `content.js` con los 43 items para que el fallback los muestre todos.

---

## Performance y accesibilidad

- `dpr={[1, 1.5]}` — sin rendering 4K
- `isVisibleRef` pausa cálculos en `useFrame` cuando sección fuera de vista
- `prefers-reduced-motion` → sin idle rotation, sprites aparecen directamente
- `IntersectionObserver` cleanup en `useEffect` return
- `matchMedia` event listener cleanup en `useEffect` return
- `frameloop="always"` — loop continuo necesario para OrbitControls damping

---

## Integración

- `id="stack"` conservado en `Stack.jsx` — navbar scroll sin cambios
- `background: transparent` en canvas — respeta `--bg-secondary` de cada tema
- dark / light / hacker funcionan automáticamente
- No se modifica ninguna otra sección
