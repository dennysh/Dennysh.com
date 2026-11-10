# Quitar la Demo del sitio

Estado: implementado, sin commit (2026-11-09). Encargo de Dennys. Alcance decidido por él: nodo, tarjeta, página y rutas. El backend (funciones, D1, Telegram) no se toca y queda sin usar.

## Qué cambia

1. **Primera pantalla:** cinco nodos (Código, Proyectos, Trayectoria, Cómo trabajo, Interés). Dos a cada lado y Trayectoria sobre el eje, con el mismo paso angular (≈ 36°). `ARC.ry` baja de 247 a 235 para que el nodo del eje no quede pegado a la barra. La línea de Trayectoria es vertical y arranca bajo su etiqueta (`LABEL_DROP`), porque la etiqueta queda justo en su camino. El anillo y las líneas siguen detrás del retrato (`.lines { z-index: -1 }`).
2. **Reposo:** ninguna tarjeta. La tarjeta aparece al señalar (ratón) o enfocar con teclado (Tab) un nodo y se oculta al salir. Con un toque, la tarjeta se queda hasta tocar otro nodo, tocar fuera de nodos y paneles, o Esc. El foco del nodo al enlace "Abrir" de su panel no oculta el panel. Móvil: la fila de nodos pasa a cinco columnas.
3. **Páginas y rutas:** desaparecen `/es/demo/` y `/en/demo/` (routes, prerender, sitemap, llms.txt, navegación, i18n, textos).
4. **Datos públicos:** el conjunto de reglas y las plantillas se publican ahora en `/data/ruleset.v1.json` y `/data/explanations.v1.json` (antes `/demo/...`), para que el build no tenga ninguna ruta `/demo/`.

## Decisiones

| Tema | Decisión | Descartado | Cómo revertir |
|---|---|---|---|
| Enlaces antiguos de Telegram `/es/?evento=…` | Van a la portada del idioma (`/es/` o `/en/`), sin la consulta | Dejarlos en la portada con `?evento=` sin más | `legacyEventTarget` en `src/routes.js` |
| `/es/demo/…` y `/en/demo/…` (los mensajes nuevos de `alert-text.js` los generan) | La 404 los reenvía por JavaScript a la portada del idioma. El estado HTTP sigue siendo 404 | Un `_redirects` de Cloudflare (no se toca Cloudflare) | Lo mismo |
| Ruleset y plantillas públicas | Se mueven a `/data/` | Borrarlas; dejarlas en `/demo/` | `scripts/prerender.mjs`, `scripts/lib/machine.mjs` |
| Textos legales | Se quitan las cláusulas que describían la demo (qué guarda, retención de 24 h, Telegram, almacenamiento del navegador, simulación, límites). Quedan Turnstile y el formulario de contacto | Dejarlas (serían falsas) | `src/Legal.jsx` |
| Código del cliente de la demo (`src/demo/*`) | Se conserva: el formulario usa `turnstile.js` y el panel Código usa `strings.js` y `static-example.json`; el resto queda sin importar y se retira con otro encargo | Borrarlo ahora | n/a |
| Pruebas de navegador de la demo (`demo-client`, `demo-a11y`, `timing`, `full-flow`) | Se eliminan: no hay página que probar. El backend sigue cubierto por las pruebas unitarias de `functions/` y `core/` | Dejarlas saltadas | `git checkout -- tests/e2e/<archivo>` |

## Pruebas nuevas

Unitarias: cinco nodos y ninguna tarjeta activa en el HTML, geometría (equilibrio angular, línea del eje), rutas (la antigua demo y `?evento=` van a la portada), `checkNoDemo` (el build no tiene rutas ni enlaces `/demo/`), reposo sin tarjeta con ratón, teclado y táctil. Navegador: cinco nodos, reposo sin tarjeta, tarjeta al señalar y vuelta al reposo, simetría, móvil sin desbordes, la 404 de `/en/demo/` y el redireccionamiento.
