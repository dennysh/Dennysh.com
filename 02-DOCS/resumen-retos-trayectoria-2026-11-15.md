# Retos superados en Trayectoria (2026-11-15)

## Qué se hizo
- Cada entrada de empleo puede llevar una lista opcional `challenges` (`title`, `text`) en `journeyPage.timeline` (`src/content/site.js`, es y en). Rótulo en `ui.challenge`: «Un reto superado» / «A challenge overcome».
- `src/components/Timeline.jsx` pinta el bloque dentro de la entrada, **después de las viñetas y antes de las etiquetas**: rótulo (texto real), título (`h3`) y texto. Las entradas sin retos salen igual que antes.
- Estilo en `src/styles/home.css`: filete a la izquierda, rótulo pequeño en mayúsculas, texto de .95rem. Solo tokens existentes (`--line`, `--muted`, `--text`); sin colores nuevos ni iconos.
- Retos cargados (texto exacto del encargo, es y en): Telydata (1), Afiatic (1), MS@Net (2). Fibratelecom, ISMAC y los proyectos no llevan.
- Fechas y cargos sin tocar. Sin fechas, «policía», clientes ni personas en los retos. (Corrección de Dennys, ver abajo: el reto 3a nombra «centros de inteligencia».)

## Pruebas
- `npm run build` en verde; `vitest`: 61 archivos, 1081 pruebas en verde.
- Nuevas: bloque de contenido de retos en `tests/unit/content.test.js` (cuántos y dónde, textos clave, sin fechas ni palabras vetadas, números solo los dictados, fechas y cargos intactos); orden de lectura y rótulo en `tests/unit/journey-page.test.js`; 6 e2e en `tests/e2e/timeline.spec.js` (360, 390 y 1440 px, es y en: sin desborde ni texto cortado, viñetas antes que reto).
- La prueba que exigía «solo números del CV» en la prosa de la línea de tiempo ahora excluye los retos, que tienen su prueba propia.
- e2e (timeline, first-screen, mobile-landing, theme, sections, critica-1): 175 en verde más las 6 nuevas.
- h1, línea de datos de la portada y el resto de la página no cambian (pruebas de portada en verde; solo se tocaron Trayectoria, su estilo y sus pruebas).
- Sin Astra, según el encargo. Servidores de vista previa cerrados.

## Capturas (`02-DOCS/capturas-retos-trayectoria-2026-11-15/`)
`trayectoria-{es,en}-{movil,escritorio}-{oscuro,claro}.png` (móvil 390×844, escritorio 1440×900; página completa; compilación normal, sin fotos de relleno). Revisadas: móvil oscuro (es) y escritorio claro (en).

## Corrección de Dennys (2026-11-15, commit aparte)
- Reto 3a de MS@Net: ahora dice «escuelas, hospitales y centros de inteligencia» (en: «schools, hospitals and intelligence centers»). Sin «policía» ni nombres de entidades. Sustituye a «instituciones de seguridad».
- Prueba: ya no prohíbe «inteligencia»; exige esta redacción en el reto 3a, prohíbe «policía», «police» y las frases anteriores «instituciones de seguridad» / «security institutions», y comprueba que «inteligencia» no aparece en ningún otro reto.
- build y vitest en verde (1082 pruebas); e2e de Trayectoria en verde (22). Las 8 capturas se regeneraron porque todas son de página completa y contienen la entrada de MS@Net; servidores cerrados.
- **Duda resuelta:** la redacción «instituciones de seguridad» ya no se usa; la decisión final es la de Dennys.

## Dudas y notas de contenido
- «La primera empresa» (MS@Net, Taisha) queda tal cual, con «Fotos de respaldo disponibles a pedido». Es una afirmación declarada por Dennys, respaldada por fotos a pedido; **no demostrada en la página**. No encontré en el repositorio una lista de afirmaciones verificables de la Factory donde registrarla.
- llms.txt, dennys.json y JSON-LD: no existen en `public/` ni resumen la trayectoria por empleos en la capa de máquinas (`dist` solo nombra los empleos en las dos páginas de Trayectoria y en el JS). No se cambió nada.
- El texto de MS@Net 3b habla de ventas, cobros y activación en MikroTik; la viñeta de MS@Net ya decía «gestión comercial», coherente. El reto de Afiatic menciona Macas–Puyo y el de Telydata Macas–Taisha (lugares, no clientes).
- Las dos mini-frases «unas 4 o 5 horas» y «3 días» llevan números dictados; la prueba los fija.
