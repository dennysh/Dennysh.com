# Red de fondo en la primera pantalla (2026-11-09)

Trabajo A de la noche del 2026-11-09. Dennys aprobó el efecto en una maqueta funcional (`/tmp/red-referencia.html`); aquí se porta tal cual a la primera pantalla real. Sin commit ni push.

## Qué es

Un canvas decorativo detrás del retrato: una red de puntos y segmentos que se **enciende alrededor del puntero** (radio amplio), con puntos que se desplazan un poco hacia el puntero y vuelven (ver «Corrección 2026-11-14»), relleno tenue de triángulos, puntos tenues en reposo y apagado suave al salir. Nunca se dibuja sobre la cara ni el cuerpo; sí sobre los lados, la frase y los iconos de los nodos.

- Lógica: `src/home/network.js` (puro, sin DOM): `PRESETS`, `LEVEL`, `quiet()`, `lit()`, `accentRgb()`, `createNetwork()`.
- Componente: `src/home/NetworkBackground.jsx` (canvas, listeners, ciclo de vida). Se monta dentro de `.canvas` en `FirstScreen.jsx`, antes del SVG de líneas.
- Estilos: regla `.net` en `src/styles/home.css` (escritorio) y `display: none` en el bloque móvil.

## Lo que se conserva de la maqueta

Intensidad fija nº 2 «Sutil» (`n 170, link 140, line .75, dot .40, speed .06, tri .06, reach 270`); las otras dos quedan solo como constantes en `PRESETS`. Se conservan: `quiet()` (zona protegida con dos rampas, 0,35 en la cabeza y 0,25 en el cuerpo), `lit()` con la curva `min(1, s·1,7)`, la atracción (`d < R && d > 50`, 90 px/s), el relleno de triángulos, los puntos tenues y el apagado suave (`active` hacia 0/1 a `dt·6`). Se quitan los botones de intensidad y el selector de tema.

## Cambios obligatorios y decisiones

| # | Decisión | Por qué / alternativa descartada | Cómo revertir |
| --- | --- | --- | --- |
| 1 | **Zona protegida desde `geometry.js`.** Cabeza = elipse que contiene la caja `HEAD_RECT` (semiejes ×1,42, un pelo más que √2 para que las esquinas queden dentro y no justo en el borde); cuerpo = franja bajo la cabeza de 0,20 del ancho del retrato en el cuello a 0,50 en los hombros (`PORTRAIT_PX.w`). | Las fracciones de la maqueta (`.50W, .40H…`) eran de una maqueta aproximada y no seguían al retrato real. | Sustituir `quiet()` |
| 2 | **Los tramos intermedios también respetan la zona.** Un segmento (y las aristas y el centroide de un triángulo) usa el mínimo de `quiet` en sus extremos y en 1/4, 1/2 y 3/4. | En la maqueta solo contaban los extremos: un segmento de 140 px con ambos extremos fuera podía cruzar la cabeza (la caja mide ~116 px de ancho). Es lo único que cambia el resultado visual, y solo donde el requisito lo exige. | Quitar `quietAlong` |
| 3 | **Solo los puntos encendidos entran en los bucles de segmentos y triángulos**, y las distancias se comparan al cuadrado. | Mismo resultado visual, menos coste. | n/a |
| 4 | **Color del acento sacado de `--accent`** (hex → `r,g,b`) y vuelto a leer con un `MutationObserver` sobre `data-theme` y con el cambio de `prefers-color-scheme`. | En lugar del `--rgb` de la maqueta. `--accent` es el mismo valor en la maqueta (`#b3301d` claro, `#ff8268` oscuro). Si no se entiende el valor, queda el acento claro. | n/a |
| 5 | **Capa.** `.net { z-index: -1 }`, después del brillo (`.canvas::before`, z −1, antes en el DOM) y antes del SVG de líneas (también z −1, después en el DOM): orden de pintado brillo → red → líneas y anillo → retrato → nodos y paneles. El canvas es `pointer-events: none`. | El anillo sigue detrás del retrato (`.lines`, sin cambios). | Quitar `.net` |
| 6 | **Eventos en el contenedor.** `pointermove` y `pointerleave` (pasivos) en `.canvas`, no en el canvas; se ignoran los toques. No se llama a `preventDefault` ni se detiene la propagación, así que el hover, el foco y el clic de nodos, barra y tarjetas siguen igual. | Requisito de no bloquear ni retrasar la interacción. | n/a |
| 7 | **Solo cliente y solo puntero fino:** el componente devuelve `null` en el servidor y en la primera pintura; se monta tras comprobar `(hover: hover) and (pointer: fine) and (min-width: 761px)`. Se desmonta si deja de cumplirse (p. ej. al achicar la ventana). | Sin canvas en el prerender ni errores de hidratación; en táctil o móvil no hay coste ni interferencia con el scroll. El mínimo de 761 px coincide con el corte móvil del CSS. | n/a |
| 8 | **Movimiento reducido:** sin bucle de animación; se dibuja un cuadro al mover el puntero (con `active = 1`), al salir (se apaga), al cambiar de tema y al cambiar de tamaño. | Igual que la maqueta, más el apagado al salir (en la maqueta la red se quedaba encendida). | n/a |
| 9 | **Pausa:** `visibilitychange` (pestaña oculta) e `IntersectionObserver` (fuera de pantalla) cancelan el `requestAnimationFrame`. DPR máximo 2. `ResizeObserver` recalcula tamaño y puntos. Al desmontar se quitan listeners, observadores y el cuadro pendiente. | Requisitos de rendimiento y limpieza. | n/a |

## Medidas

- **JS inicial (gzip, `vite build`):** 72,53 kB → 75,02 kB (**+2,5 kB**). Presupuesto del sitio: 150 kB (`checkBudget`). El CSS sube ~0,01 kB.
- **Coste por cuadro** (lógica, sin pintar, ~170 puntos, puntero sobre la red, Node): **≈1,0 ms**. En Chromium, un recorrido del puntero por todo el lienzo (66 posiciones) dio **0 tareas largas** (`PerformanceObserver` de `longtask`).
- **Carga:** el canvas no se monta hasta después de hidratar y no añade peticiones; el retrato sigue siendo el elemento de mayor contenido.
- **Contraste (AA):** las pruebas existentes no cambian y siguen verdes. La red va detrás del texto y es decorativa; sus trazos tienen alfa máxima 0,75 sobre un fondo de brillo; el contraste del texto de la primera pantalla se calcula con los tokens (peor punto del degradado) y la red no modifica el texto. Limitación: axe no puede medir lo que pinta un canvas.

## Pruebas

- `tests/unit/network.test.js`: constantes de la maqueta; `quiet()` con la geometría real (cara y cuerpo = 0 en toda la caja, borde entre 0 y 1, exterior = 1, simetría, independencia de escala); `lit()`; `accentRgb()`; ningún trazo ni relleno sobre la zona protegida con el puntero recorriendo una rejilla; apagado suave; movimiento reducido sin movimiento; número de puntos; coste por cuadro.
- `tests/unit/network-component.test.js` (jsdom): SSR devuelve vacío; canvas `aria-hidden` con puntero fino; nada sin él; listeners en el contenedor y limpieza al desmontar; sin bucle con movimiento reducido.
- `tests/e2e/network.spec.js`: canvas presente solo con puntero fino (y no en móvil táctil 390×844, tableta táctil 1024×768 ni 360×640); sin errores de consola; capas; los nodos reciben puntero (hover, foco, clic); **medición por píxeles**: tras recorrer el lienzo con el puntero, la alfa máxima sobre la cara y sobre el cuerpo es 0 y en el resto sí se dibuja (verificado con un mutante: si `quiet()` devuelve 1 la prueba falla); color del acento claro y oscuro y reacción al cambio de tema; movimiento reducido sin cuadros nuevos; con movimiento anima y se pausa con la pestaña oculta; sin tareas largas; retirada al achicar a menos de 761 px; sin JavaScript no hay canvas.

## Evidencia (`02-DOCS/evidencia/`)

`red-reposo-light|dark.png` (solo puntos tenues), `red-encendida-light|dark.png` (puntero junto al lado izquierdo, sobre Código), `red-cara-light|dark.png` (puntero sobre la cara: la red se queda fuera de la cabeza y el cuerpo).

## Corrección 2026-11-14: la red ya no se acumula en una mancha

**Problema (visto en producción):** con el puntero quieto, los puntos cercanos eran atraídos cada cuadro y se acumulaban en un solo lugar formando una mancha densa; el resto de la pantalla se quedaba sin red.

**Solución (maqueta v2 aprobada, `/tmp/red-referencia-v2.html`, función `frame()`):**

| Qué | Antes | Ahora |
| --- | --- | --- |
| Movimiento hacia el puntero | Se sumaba a la posición del punto en cada cuadro (acumulativo: la densidad crecía sin límite) | Cada punto tiene posición **base** (`bx, by`, con su deriva y envoltura) y un **desplazamiento** (`ox, oy`) que se acerca al puntero como máximo `PULL` = 22 px a 1180 px de ancho (escalado con `W / REF_W`) y vuelve solo. La densidad no cambia |
| Enlaces | Todos los pares encendidos a menos de `link` | Cada punto encendido se une como máximo a sus **3 vecinos más cercanos** (`MAX_LINKS`), enlaces deduplicados |
| Triángulos | Cualquier trío de puntos cercanos | Solo **tríos ya conectados**, como máximo **12** por cuadro (`MAX_TRIS`) |
| Encendido | `lit()` sobre la posición del punto | `lit()` sobre la posición **base** (no cambia al desplazarse) |

Sin cambios: intensidad nº 2, `quiet()` (zona protegida desde `geometry.js`), `lit()` con `min(1, s·1,7)`, apagado suave, movimiento reducido, solo cliente y puntero fino, capas y limpieza.

Decisiones:
- **Movimiento reducido:** los puntos no derivan **ni se desplazan** hacia el puntero (la luz sí sigue al puntero y se dibuja un cuadro al moverlo). La maqueta v2 sí desplazaba los puntos con movimiento reducido; se conserva la regla de este spec («sin movimiento»).
- **«Enlaces por punto ≤ 3» es el grado total.** La maqueta solo limitaba los vecinos que elige cada punto (un punto central elegido por varios podía pasar de 3); aquí una arista no se añade si algún extremo ya tiene 3 (revisión de Astra, hallazgo 2).
- **La zona protegida se garantiza con un recorte geométrico** (elipse de la cabeza y polígono del cuerpo, `clipOutsideProtected`), además del muestreo por segmento: las muestras discretas no cubren todo el trazo (Astra, hallazgo 1).
- **Los 30 fps no se aplican al escritorio** (la red de escritorio dibuja en cada cuadro, como antes): el límite de 30 fps es del móvil. Astra lo señaló como requisito no cumplido en escritorio; es código previo y fuera del encargo.
- Las zonas protegidas de los lados y los triángulos siguen comprobándose a lo largo de cada segmento (decisión 2), y ahora el interior de un triángulo también (centroide y puntos hacia cada vértice).
- El código común (vecinos, triángulos, desplazamiento acotado) vive en `src/home/net-core.js` y lo comparte con la red del móvil (`2026-11-14-movil-landing-vertical.md`).

Pruebas (`tests/unit/network.test.js`): 300 cuadros con el puntero fijo, en tres semillas: ningún punto se aleja más de `PULL` de su base y la base solo avanza por su deriva; el tope escala con el ancho; ≤ 3 vecinos por punto y ≤ 12 triángulos por cuadro; la densidad no se concentra (ninguna celda de la rejilla guarda más de un cuarto de los puntos, y cerca del puntero no hay más del doble de lo esperado por azar); al quitar el puntero los puntos vuelven a su base. **Mutante:** al reintroducir la atracción acumulativa fallan la prueba de la cota y la de densidad; además hay una prueba de sensibilidad con el algoritmo antiguo. Medición por píxeles en navegador (`tests/e2e/network.spec.js`): cara y cuerpo = 0.

Cómo revertir: `git revert` del commit «la red de escritorio ya no se acumula en una mancha».
