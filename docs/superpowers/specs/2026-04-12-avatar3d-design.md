# Avatar 3D — Diseño del personaje estilizado

**Date:** 2026-04-12
**Status:** Approved

---

## Objetivo

Reemplazar el avatar 3D actual (construido con primitivos Three.js en código) por un modelo GLB real creado en Blender. El resultado debe verse como un personaje cartoon 3D moderno y profesional, estilo portafolio de desarrollador.

---

## Dirección visual

Estilo **cartoon 3D minimalista**:
- Proporciones intencionalmente exageradas (cabeza ~1.4× el torso)
- Silueta limpia, legible
- Colores planos sin texturas UV complejas
- Iluminación suave que define volúmenes
- Sin hiperrealismo, sin infantilismo

---

## Paleta de color

| Parte       | Color     |
|---|---|
| Piel        | `#B97A56` |
| Cabello     | `#1A1008` |
| Hoodie      | `#1C1C26` |
| Pantalón    | `#2A3A5C` |
| Zapatos     | `#EEEEEE` |
| Ojos        | `#111111` + `#FFFFFF` (luz) |
| Plataforma  | `#3B82F6` (glow azul) |

---

## Estructura del modelo (GLB)

Meshes separados nombrados exactamente así (para acceso desde Three.js):

| Mesh    | Descripción |
|---|---|
| `head`  | Esfera ovalada — más alta que ancha. Tono piel `#B97A56` |
| `hair`  | Cap corto pegado a la cabeza, forma limpia sin mechones. Negro `#1A1008` |
| `eyeL`, `eyeR` | Óvalos planos ligeramente curvados — no esferas. Negro `#111111` con punto de luz `#FFFFFF` |
| `body`  | Torso con silueta de hoodie real — hombros ligeramente ensanchados, caída de prenda visible en la parte baja. Oscuro `#1C1C26` |
| `armL`, `armR` | Cilindros suaves, parte del hoodie. Mismo color `#1C1C26` |
| `handL`, `handR` | Esferas redondeadas simples. Piel `#B97A56` |
| `legL`, `legR` | Cilindros, pantalón. Azul oscuro `#2A3A5C` |
| `footL`, `footR` | Cajas redondeadas, zapatillas. Blanco `#EEEEEE` |

**No incluye plataforma** — la base/glow se construye en React/Three.js.

### Materiales
- `MeshToonMaterial` para todas las partes del personaje
- `gradientMap` de 4 tonos (90, 148, 200, 238) — toon shading suave
- Sin texturas UV
- Outline sutil: segundo mesh BackSide escala 1.03, color `#111111`

### Polycount objetivo
- Total: < 8,000 triángulos
- Archivo GLB: < 250 KB

---

## Archivo de salida

`/public/models/avatar.glb`

Creado con script Python en Blender. El script construye cada mesh, asigna materiales, aplica outline, y exporta a esa ruta.

---

## Avatar3D.jsx (reescritura completa)

**Ubicación:** `src/components/Avatar3D.jsx`

Reemplaza completamente el archivo anterior. No conserva ningún código del avatar viejo.

### Carga del modelo
```jsx
const { scene } = useGLTF('/models/avatar.glb')
```
Usa `useGLTF` de `@react-three/drei`. El componente es puro R3F — no usa `useEffect` + `renderer` manual.

### Animaciones en useFrame

**Float idle:**
```js
root.position.y = Math.sin(t * 0.85) * 0.08
```

**Breathing (torso):**
```js
body.scale.x = 1 + Math.sin(t * 1.55) * 0.015
```

**Head tracking con mouse:**
- Leer posición normalizada del mouse: `(-1 a 1)`
- Target: `mouse.x * 0.18` en Y, `mouse.y * 0.10` en X
- Límites: ±15° en Y (≈ ±0.26 rad), ±8° en X (≈ ±0.14 rad)
- Suavizado: `lerp(current, target, 0.05)` — movimiento muy lento y orgánico
- Implementado con `useRef` para el valor actual (sin state, sin re-renders)

### Plataforma (en código, no en GLB)
Dos meshes creados dentro del mismo Canvas:

```jsx
{/* Disco base */}
<mesh position={[0, -3.2, 0]} rotation={[-Math.PI/2, 0, 0]}>
  <cylinderGeometry args={[1.2, 1.2, 0.04, 32]} />
  <meshBasicMaterial color="#3B82F6" transparent opacity={0.85} />
</mesh>

{/* Ring glow exterior */}
<mesh position={[0, -3.22, 0]} rotation={[-Math.PI/2, 0, 0]}>
  <cylinderGeometry args={[1.6, 1.6, 0.02, 32]} />
  <meshBasicMaterial color="#3B82F6" transparent opacity={0.25} />
</mesh>
```

### Mouse tracking
- `window.addEventListener('mousemove')` dentro de `useEffect` con cleanup
- Normalizado: `x = (clientX / window.innerWidth - 0.5) * 2`
- Valor suavizado con ref `cur = { x, y }` actualizado en `useFrame` con lerp

---

## Integración con About.jsx

`About.jsx` no cambia. El componente `<Avatar3D />` sigue siendo el mismo import — solo cambia el archivo interno.

`About.css` no cambia — el wrapper `.avatar-wrapper` ya tiene el tamaño correcto (360px × 560px desktop, responsive en tablet/mobile).

El nuevo `Avatar3D.jsx` renderiza un `<Canvas>` directamente (R3F) con:
- `camera={{ position: [0, 0, 5], fov: 45 }}`
- `gl={{ alpha: true, antialias: true }}`
- `style={{ background: 'transparent' }}`

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/components/Avatar3D.jsx` | Reescritura completa (R3F + useGLTF) |
| `public/models/avatar.glb` | Archivo nuevo — generado por script Blender |
| `src/sections/About.jsx` | Sin cambios |
| `src/sections/About.css` | Sin cambios |

---

## Performance y accesibilidad

- GLB cargado con `Suspense` — fallback visible mientras carga
- `prefers-reduced-motion`: si activo, float y breathing desactivados, head tracking desactivado
- `dpr={[1, 1.5]}` — sin rendering 4K
- Cleanup de event listeners en useEffect return
