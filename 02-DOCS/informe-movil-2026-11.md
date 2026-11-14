# Informe · primera pantalla móvil y red de escritorio · 2026-11-14

Dos trabajos del encargo de Dennys, más la revisión de Astra. Sin push. Commits locales con autoría de Dennys, sin `Co-Authored-By`.

## Estado final (todo en verde, sobre el árbol final `8bff6d6`)

| Comprobación | Resultado |
| --- | --- |
| `npx vitest run` | **61 archivos, 1051 pruebas verdes** |
| Batería de navegador completa (`npm run test:e2e`, mocked + real) | **189 passed (4,4 min)** |
| `bash scripts/verify.sh` | `verify OK`: build, `markup`, `budgets`, `rules`, `no-ai-routes` y demás compuertas en OK. `npm audit --audit-level=high` sale con 0; siguen las 4 moderadas de desarrollo (`glob`/`minimatch`/`@sentry`, vienen de `lighthouse`), sin tocar |
| `npm run build` | limpio. JS inicial **79,2 kB gzip** (antes 75,9: +3,3 kB; presupuesto 150 kB) |

## Commits (sobre `ddd6381`)

| Commit | Qué |
| --- | --- |
| `3f8eee9` | ✨ **A**: primera pantalla móvil como landing vertical con red que se enciende sola o al tocar |
| `58e973b` | 📝 CLAUDE.md |
| `87f76ae` | 🐛 **B**: la red de escritorio ya no se acumula en una mancha |
| `0946b36`, `1ad631c`, `4db5ccb`, `8bff6d6` | 🔒 correcciones de la revisión de Astra (ver abajo) |

Specs: `docs/superpowers/specs/2026-11-14-movil-landing-vertical.md` (con decisiones 1–15, medidas y lo no probado) y `docs/superpowers/specs/2026-11-09-red-de-fondo.md` (apartado «Corrección 2026-11-14»).

## Trabajo A · móvil como landing vertical

Portado de `/tmp/movil-referencia.html` solo para ≤ 760 px. Arriba: retrato grande, frase, línea de datos y barra, con la red de fondo; debajo, «Explorar» con cinco tarjetas (enlaces reales a las páginas, es y en, con el texto real del contenido) sobre una línea de fibra que se ilumina con el scroll. El escritorio no cambió de estructura. La versión móvil anterior (nodos en fila, tarjeta, hoja superpuesta) se retiró con su CSS y sus pruebas.

Decisiones que conviene mirar (todas con cómo revertir en el spec):
- **Un solo DOM** para escritorio y móvil: la barra, el retrato y la frase son los mismos elementos; el CSS oculta nodos y paneles en móvil. Un solo `h1`.
- **Las tarjetas no bajan a opacidad .5 como en la maqueta**: el texto quedaba a 2,1–3,2:1 (claro). Las que aún no entraron esperan 10 px más abajo con el punto apagado; el texto siempre está a opacidad 1, así que AA se cumple siempre. Sin JavaScript todas se ven en su sitio.
- **La zona protegida se garantiza con un recorte geométrico** (elipse de la cara + polígono del cuerpo), además del muestreo por segmento; las muestras solas no cubren todo el trazo.
- **Grado máximo de 3 enlaces por punto en total** (la maqueta solo limitaba los que elige cada punto).
- **Movimiento reducido**: la red no se monta hasta el primer toque y solo se dibuja al tocar; al soltar la luz se quita.
- **Colores de los tokens del sitio**; solo el brillo del hero es propio (`--m-glow`, `--m-glow2`).
- **Texto de la tarjeta de Cómo trabajo = la entradilla de su página** (el panel de escritorio es una lista de reglas). Pista «Desliza / Swipe» como contenido nuevo.
- **`touch-action: pan-y pinch-zoom`** (en vez de solo `pan-y`): se conserva el zoom con pinza.
- La línea de fibra se completa al llegar al final de la página.

## Trabajo B · red de escritorio

Portado de `/tmp/red-referencia-v2.html`: cada punto tiene posición base y un desplazamiento que se acerca al puntero como máximo 22 px (escalado con el ancho) y vuelve solo; no hay atracción acumulativa. Cada punto se une como máximo a 3 vecinos; triángulos solo de tríos ya conectados, máx. 12 por cuadro. Se conservan intensidad 2, `quiet()`, `lit()` con `min(1, s·1,7)` y el movimiento reducido (sin deriva ni desplazamiento, como en el spec; la maqueta v2 sí desplazaba).

**Mutante:** al reintroducir la atracción acumulativa fallan 2 pruebas (la cota de 300 cuadros con el puntero fijo y la de densidad). Lo comprobé a mano, con el código restaurado después. **Píxeles:** `tests/e2e/network.spec.js` sigue midiendo 0 sobre cara y cuerpo. Captura: `02-DOCS/evidencia/red-escritorio-puntero-quieto-dark.png` (puntero 4 s quieto: la red se reparte, no hay mancha).

El código común (vecinos, triángulos, desplazamiento, recorte) vive en `src/home/net-core.js` y lo comparten las dos redes.

## Medidas

| Medida | Resultado |
| --- | --- |
| JS inicial gzip | 79,2 kB (+3,3 kB); CSS 6,4 kB |
| Coste por cuadro de la red móvil en Chromium (DPR 3, dedo puesto, con el recorte) | media **1,4 ms**, p95 2,5 ms, máx. 3,8 ms |
| Tope de cuadros del móvil | ≤ 31/s medidos en pantalla (30 fps estrictos en el código), 0 fuera de pantalla |
| CLS en la carga móvil | < 0,02; el hero mide igual antes y después de hidratar |
| Píxeles sobre cara y cuerpo | **0** a 390×844 y 360×640, oscuro y claro, red sola y con el dedo recorriendo todo el hero; 0 en escritorio |
| Scroll vertical con arrastre táctil real | 285 px con `pan-y`; con `touch-action: none` serían 0 (comprobado a mano) |

## Capturas (`02-DOCS/evidencia/`)

`movil-390-{dark,light}-hero-reposo.png`, `…-hero-dedo.png`, `…-tarjetas.png`, `…-tarjetas-final.png`, `movil-360-dark-hero-en.png`, `red-escritorio-puntero-quieto-dark.png`.

## Revisión de Astra (GPT, solo lectura, solo el código nuevo)

Primera pasada: «BLOQUEA: sí», 4 hallazgos medios y 2 bajos. **Corregidos todos**:
1. La zona protegida solo se muestreaba: un segmento podía entrar entre dos muestras → recorte geométrico de todo el dibujo.
2. Un punto podía acabar con más de 3 enlaces → tope de grado.
3. Los 30 fps tenían −2 ms de tolerancia → estricto; dibujos por evento con movimiento reducido juntados en uno por cuadro.
4. `pan-y` bloqueaba el zoom con pinza → `pan-y pinch-zoom`.
5. Con movimiento reducido la luz del dedo quedaba fija al soltar → se quita al soltar.
6. Sin `IntersectionObserver` no había pausa fuera de pantalla → se calcula con scroll y tamaño.
Seguridad básica: sin hallazgos (sin secretos, XSS, inyección, fugas de listeners; enlaces solo de `pagePaths`).

Segunda a cuarta pasada (solo lo cambiado): cerraron los puntos 1–4 y detectaron casos límite de los puntos 5–6 (dibujo pendiente con movimiento reducido durante una pausa; recalcular la visibilidad al redimensionar). Los dos últimos se corrigieron en `8bff6d6`; **esa última corrección de dos líneas no volvió a pasar por Astra** (cuarta pasada: «BLOQUEA: sí» por esos dos casos; los arreglé después). Son casos límite de navegadores sin `IntersectionObserver`, que hoy casi no existen.

Astra señaló además que **la red de escritorio no limita a 30 fps**: es así desde el trabajo anterior y el límite de 30 fps del encargo es del móvil; no se tocó.

## Qué no se probó

- **Un teléfono real**: todo se probó en Chromium con emulación móvil, toques por CDP y DPR 2–3. No se probó Safari de iOS (barra de URL y `100svh`, `touch-action`, `mask-image`), ni batería ni rendimiento real a 30 fps, ni inercia del scroll en un dispositivo.
- El estrangulador de CPU de CDP (×4) no cambia los tiempos en este equipo, así que el coste de cuadro no es una medida de gama baja.
- La rama sin `IntersectionObserver` solo está revisada por lectura (Astra) y no tiene prueba automática.
- Contraste de texto sobre el brillo del hero móvil: axe no lo mide sobre degradados; los tokens `--m-glow` no tienen una prueba de contraste propia (el texto se apoya en el brillo desde `--text` y `--muted`, de valores altos).
- No hay push ni se tocó Cloudflare.

## Pendiente (no bloquea)

- Las pruebas del móvil anterior se reescribieron o retiraron; las de «táctil» (primer toque abre la vista previa) ahora usan una tableta de 1024×768.
- `02-DOCS/informe-pre-produccion-2026-11-09.md` sigue sin commitear (es de la tanda anterior).
