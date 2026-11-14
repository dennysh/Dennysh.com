# Primera pantalla móvil como landing vertical · 2026-11-14

Trabajo A del encargo de Dennys. Referencia aprobada: `/tmp/movil-referencia.html` (HTML + JS, probada en un teléfono emulado). Se porta a la home real **solo para móvil (≤ 760 px)**; el escritorio (arco de cinco nodos) no cambia de estructura.

## Qué es

- **Arriba, solo Dennys:** retrato grande, la frase, la línea de datos y la barra (marca, CV, idioma, tema), con la red de fondo que se enciende sola (luz errante suave) y donde toca o arrastra el dedo.
- **Debajo, «Explorar»:** cinco tarjetas (Código, Trabajo en producción, De la fibra a la IA, Cómo trabajo, Interés) sobre una línea de fibra que se ilumina con el scroll. Cada tarjeta es un enlace real a la página del nodo (`src/routes.js`, es y en) con el texto real de `src/content/site.js`.
- **Sustituye** la versión móvil anterior (cinco nodos en fila + tarjeta o «hoja» superpuesta).

## Decisiones

| # | Decisión | Por qué / cómo revertir |
| --- | --- | --- |
| 1 | **Un solo DOM** para escritorio y móvil: la barra, el retrato, la frase y la línea de datos son los mismos elementos; en ≤ 760 px el CSS oculta `.nodes`, `.panels`, `.lines` y `.net` y muestra `.hint` y `.explore`. | Un solo `h1`, sin contenido duplicado. Para revertir: restaurar el bloque móvil de `home.css` y quitar `<MobileNetwork>`, `.hint` y `<Explore>` de `FirstScreen.jsx`. |
| 2 | **Red del móvil en módulos propios** (`network-mobile.js`, `MobileNetwork.jsx`) y piezas comunes en `net-core.js` (vecinos, triángulos, desplazamiento, zona protegida a lo largo de un segmento). El canvas es `canvas.net-m`, distinto del `canvas.net` de escritorio. | El algoritmo y las constantes (`P`) son los de la maqueta; el escritorio no se toca en este trabajo. |
| 3 | **Zona protegida también a lo largo de cada segmento y de cada triángulo** (extremos, 3 puntos intermedios, centroide y puntos hacia cada vértice), no solo en los extremos como en la maqueta. | Requisito del encargo: la red nunca se dibuja sobre la cara ni el cuerpo. Sin esto un enlace de ≤ 100 px con los dos extremos fuera puede cruzar la cabeza (el escritorio ya lo hacía así). |
| 4 | **El objetivo del desplazamiento se recorta a `P.pull`** aunque la luz errante y el dedo empujen a la vez. | En la maqueta podían sumar 1,35 × `pull`. Con el recorte «máx. `pull`» se cumple por construcción (prueba unitaria). |
| 5 | **Las tarjetas no bajan de opacidad 1.** Las que aún no entraron esperan 10 px más abajo y con el punto apagado; al entrar suben y se encienden. | La maqueta las atenuaba a opacidad .5: el texto quedaba en 2,1–3,2:1 (claro) y 3,2–4,1:1 (oscuro) frente al AA que exige el encargo. Medido con los tokens del sitio. Para volver a la maqueta: `opacity: .5` en `.fiber[data-watching] .m-card:not(.on)` (rompe AA). |
| 6 | **Sin JavaScript o sin `IntersectionObserver`, todas las tarjetas se ven en su sitio**: el estado «esperando» solo existe con `data-watching` en la lista, que pone el cliente. | Requisito (4). |
| 7 | **Movimiento reducido:** la red no se monta (no hay `canvas`) hasta el primer toque y solo se dibuja al tocar o arrastrar; sin luz errante ni bucle de animación. Tarjetas visibles sin transición; la pista «Desliza» no gotea. | Requisito (7). |
| 8 | **La línea de fibra se completa al llegar al final de la página** (`--p = 1`). | Con la fórmula de la maqueta se quedaba en ≈ .8 en la última pantalla (hay pie debajo). |
| 9 | **Colores de los tokens del sitio** (`--surface` para la tarjeta, `--bg` para el punto, `--accent`, `--muted`, `--line`); solo el brillo del hero es propio (`--m-glow`, `--m-glow2`, con los valores de la maqueta en oscuro y claro). | La maqueta usa una paleta casi idéntica; así el tema claro/oscuro del sitio y su contraste medido siguen valiendo. |
| 10 | **Texto de la tarjeta de Cómo trabajo = la entradilla de su página** (`howPage.lead`): el panel de escritorio de ese nodo es la lista de reglas, no un párrafo. Código usa `panels.code.note`; Interés, `panels.interest.thought`. | «Textos reales tal como están en el contenido». |
| 11 | La pista «Desliza / Swipe» es contenido nuevo (`home.hint`), decorativa (`aria-hidden`). | La lleva la maqueta. |
| 12 | `touch-action: pan-y` en el hero. | El dedo no rompe el scroll vertical: comprobado con un arrastre táctil real (con `none` no se desplaza). |

## Rendimiento y límites

~110 puntos (`P.n`), 30 fps como tope, pausa fuera de pantalla (`IntersectionObserver`) y con la pestaña oculta, DPR ≤ 2, cero listeners ni `requestAnimationFrame` al desmontar, `ResizeObserver` sobre el hero (solo se vuelve a sembrar si cambia su tamaño). Solo cliente: en el servidor y en la primera pintura el componente no devuelve nada (sin diferencia de hidratación, sin canvas en el prerender). El alto del hero es `clamp(560px, 100svh, 820px)`: no hay salto de diseño al hidratar.

## Pruebas

- Unitarias (`tests/unit/network-mobile.test.js`): `quiet()` sobre la caja real; luz errante y dedo; máximo 3 vecinos por punto; triángulos solo de tríos conectados y ≤ 10; desplazamiento ≤ `pull` tras 300 cuadros con el dedo quieto; la atracción acumulativa de la versión anterior sí rompería la cota; coste de un cuadro.
- Navegador (`tests/e2e/mobile-landing.spec.js`, 390×844 y 360×640): sin desborde horizontal, barra con objetivos ≥ 44 px, cinco tarjetas con el enlace y el texto reales en es y en, encabezados h1 → h2 → h3, línea de fibra, scroll vertical con un arrastre táctil, red presente y **sin un solo píxel sobre cara y cuerpo** (sola y arrastrando el dedo por todo el hero, oscuro y claro), sin JavaScript, movimiento reducido, CLS < 0,02, 30 fps y pausa fuera de pantalla, foco visible, axe sin violaciones en claro y oscuro (es y en) y sin errores de consola.
- Las pruebas del móvil anterior (nodos en fila, hoja superpuesta) se reescribieron o se retiraron.

## Medidas (2026-11-14)

| Medida | Resultado |
| --- | --- |
| JS inicial (gzip), build de producción | **79,06 kB** (antes 75,92 kB: +3,1 kB); presupuesto 150 kB |
| CSS (gzip) | 6,42 kB |
| Coste por cuadro de la red del móvil, en Chromium (lógica + pintura, dedo puesto, DPR 3) | media **1,6 ms**, p95 2,4 ms, máx. 3,2 ms (con CPU ×4: media 1,7 ms; el estrangulador de CDP no se nota en este equipo, así que no es una medida de un teléfono real) |
| Coste por cuadro en Node (solo lógica, 200 cuadros) | prueba unitaria con tope de 4 ms |
| Tope de cuadros | ≤ 31 por segundo en pantalla (30 fps), 0 fuera de pantalla |
| CLS en la carga | < 0,02, y el hero mide igual antes y después de hidratar |
| Píxeles sobre cara y cuerpo | **0** a 390×844 y 360×640, oscuro y claro, sola y con el dedo recorriendo todo el hero en zigzag |

Capturas en `02-DOCS/evidencia/`: `movil-390-{dark,light}-hero-reposo.png`, `…-hero-dedo.png`, `…-tarjetas.png`, `…-tarjetas-final.png` y `movil-360-dark-hero-en.png`.

## Qué no se probó

Un teléfono real (todo el trabajo se probó en Chromium con emulación móvil, toques por CDP y DPR 2–3): ni Safari de iOS (barra de URL, `100svh`, `touch-action`, `-webkit-mask-image`), ni rendimiento y batería reales con 30 fps, ni gestos con inercia en dispositivos reales.
