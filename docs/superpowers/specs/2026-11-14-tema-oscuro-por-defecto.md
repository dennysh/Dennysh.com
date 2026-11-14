# Tema oscuro por defecto · 2026-11-14

Encargo de Dennys: el sitio arranca en oscuro (fondo negro) para todo visitante nuevo, sin importar si su sistema está en claro u oscuro. El interruptor sigue funcionando y la elección se recuerda.

## Decisión

El oscuro es el tema base del CSS; el claro es la excepción y solo existe con `data-theme="light"` en `<html>`.

| Caso | Resultado |
| --- | --- |
| Visitante nuevo, sistema claro u oscuro | Oscuro |
| Preferencia guardada `light` | Claro (se conserva su elección) |
| Preferencia guardada `dark` | Oscuro |
| Valor guardado raro, o almacenamiento bloqueado | Oscuro |
| Sin JavaScript | Oscuro (el botón sale pulsado) |

## Qué cambió

- `src/styles/tokens.css`: `:root` lleva la paleta oscura y `color-scheme: dark`; `:root[data-theme="light"]` lleva la clara. Se quitó la media query `prefers-color-scheme` y el bloque `data-theme="dark"` (era idéntico al base).
- `public/theme-init.js` (script externo en `<head>`, antes de las hojas de estilo): solo aplica `data-theme` si hay `light` o `dark` guardado y, en ese caso, ajusta el `theme-color` (claro `#f6f3ee`, oscuro `#15130f`). Por defecto no hace nada: el oscuro llega por CSS, así que no hay parpadeo y no depende de JavaScript.
- `index.html` (plantilla de todas las páginas, incluidas la 404 y las legales): un solo `<meta name="theme-color" content="#15130f">` y `<meta name="color-scheme" content="dark">`.
- `src/components/ThemeToggle.jsx`: parte en oscuro (`aria-pressed="true"` también en el HTML del servidor, para que coincida al hidratar); el clic actualiza el `theme-color`. Ya no mira el sistema.
- `src/home/NetworkBackground.jsx`: se quitó el oyente del sistema; el tema lo marca solo `data-theme`.
- Favicon: sin cambios. `favicon.svg` y los PNG ya son un cuadrado oscuro con la D en violeta, coherentes con el tema por defecto y no cambian con el tema.

## Pruebas

- Unitarias: `theme.test.js` (paletas, ausencia de `prefers-color-scheme`, `index.html`, `theme-init` con `meta`, interruptor), `theme-toggle-click.test.js` (sistema claro y oscuro dan lo mismo; elección guardada), `first-screen.test.js`.
- Navegador: `theme.spec.js` reescrito. Con el sistema en claro y sin preferencia, el sitio abre oscuro (inicio, interiores, legales, 404); con `light` guardado abre claro; sin parpadeo (fondo definitivo al terminar de interpretar el documento, en los dos casos); sin JavaScript; almacenamiento bloqueado; axe en los dos temas (también legales).
- Las pruebas que antes obtenían el claro con `colorScheme: 'light'` ahora lo piden como una persona: preferencia guardada (`setStoredTheme` en `tests/e2e/helpers.js`). Afecta a `critica-1`, `timeline`, `contact`, `network` y `theme`.
- La prueba intermitente de Presente en `timeline.spec.js` (leía el color del título a media transición) ahora espera con `expect.poll`.
- El contraste AA de los dos temas sigue medido en `theme.test.js` (sin cambios de colores).

## Cómo revertir

Un solo commit. `git revert <commit>` devuelve «sigue al sistema». A mano: restaurar en `tokens.css` el bloque `@media (prefers-color-scheme: dark)` con `:root:not([data-theme="light"])`, el `meta` doble de `theme-color` y `color-scheme="light dark"` en `index.html`, y el `effective()` con `matchMedia` en `ThemeToggle.jsx`.

## Pendiente

Ninguno. Quien tuviera guardado `light` desde antes sigue viéndolo claro; quien tuviera `dark` o nada pasa a oscuro.
