# Resumen: textos más llanos (2026-11-15)

Cambio pequeño de textos, un commit, sin push. Revisión proporcional: sin Astra.

## Qué cambió
1. **Explorar (los cinco paneles, es y en):** la frase «abre una página nueva» / «opens a new page» ya no se ve. Queda dentro del enlace como texto `sr-only` (« (abre una página nueva)»), así que el nombre accesible del botón la conserva. Afecta a las tarjetas móviles (`Explore.jsx`) y al pie de los paneles de escritorio (`FirstScreen.jsx`). Se quitaron las reglas CSS que ya no se usan (`.opens`, `.m-card a small`).
2. **Tarjeta «Código»** (`panels.code.note`): texto exacto del encargo, es y en. La página Código no cambia.
3. **Cómo trabajo:** frase llana nueva (`howPage.plain`) bajo el h1, con más peso (`.lead-plain`). La entradilla de antes queda debajo, más discreta (`.lead-sub`). Código no recibe frase nueva.

## Pruebas
- `npm run build` y `vitest`: 61 archivos, 1084 pruebas en verde.
- e2e (mobile-landing, first-screen, sections, critica-1): 144 en verde.
- Pruebas ajustadas: `first-screen.test.js` (pie del panel con aviso `sr-only`), `a11y-css.test.js` (ya no hay regla `.opens`; se comprueba que no vuelva), `first-screen.spec.js:346` (`toContainText`, porque el nombre del botón ahora incluye el aviso). Pruebas nuevas en `pages.test.js` (orden de las dos frases, texto exacto de la tarjeta Código). No se relajó ninguna prueba de accesibilidad.
- title/meta/description: sin cambios.

## Capturas
`02-DOCS/capturas-textos-llanos-2026-11-15/`: portada (tarjetas Explorar en móvil 390×844; escritorio 1440×900) y Cómo trabajo (móvil y escritorio), en es oscuro, en oscuro y es claro. No hice capturas a 360 px.

## Nota
- En escritorio la portada muestra los paneles, no las tarjetas de Explorar (solo ≤ 760 px).
- No dejé servidores de vista previa abiertos.
