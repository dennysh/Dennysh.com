# Trayectoria como línea de tiempo con fotos (2026-11-09)

Trabajo B de la noche del 2026-11-09, por encargo de Dennys (`/tmp/encargo-trayectoria.txt`). Sin commit ni push.

## Qué cambió

`/es/trayectoria/` y `/en/journey/` pasan de «cuatro líneas + galería por fila con hover» a una **línea de tiempo** al estilo de la sección «Experience» de brittanychiang.com: lista vertical, fechas a la izquierda, a la derecha cargo · empresa, lo más destacado en viñetas cortas y etiquetas, y una miniatura por entrada que se amplía. Contenido solo del CV público (`public/cv-dennys-heras.pdf`); **no** se usa la sección Referencias.

- Componente: `src/components/Timeline.jsx` (lista `<ol class="timeline">` + un único `<dialog>` modal para la ampliación). Estilos: bloque «Línea de tiempo de Trayectoria» en `src/styles/home.css`.
- Datos: `journeyPage.timeline` y `journeyPage.ui` en `src/content/site.js` (es y en); fotos en `src/content/journey-photos.js` (guía: `02-DOCS/guia-fotos-trayectoria.md`).
- Se conservan las cuatro líneas de la trayectoria (`journey.lines`) como introducción: son texto aprobado y las pruebas existentes las fijan.
- **Se retiró** lo que quedó sin uso: `RowGallery.jsx`, `gallery-logic.js`, sus pruebas (`gallery-logic.test.js`, `gallery.spec.js`), los estilos `.g-*` y las claves `rows`/`gallery` de `journeyPage`.
- No cambian el nodo ni la tarjeta de Trayectoria de la primera pantalla (su texto «Siete años en redes de fibra óptica…» no contradice la página).

## Entradas (del más reciente al más antiguo)

| # | Entrada | Tipo | Fechas | Fuente |
| --- | --- | --- | --- | --- |
| 1 | Bot Caja Cercana | Proyecto · En producción | 2025 | texto y año ya aprobados en el sitio; CV: «Bot Telegram – Localización de empalmes» (Python + Telegram Bot API) |
| 2 | Super Gol Kids | Proyecto | En producción | texto ya aprobado en el sitio; CV: «Plataforma web – Gestión de fútbol» |
| 3 | Desarrollo de Software · Instituto Tecnológico ISMAC | Formación | Sep 2023 – Presente | CV |
| 4 | Técnico de Campo / Gestión de Activos · Fibratelecom | Empleo | Mar 2023 – Presente | CV (4 viñetas) |
| 5 | ISP Manager · MS@Net | Empleo | Jun 2021 – Oct 2022 | CV |
| 6 | Técnico de Redes (contratista CNT) · Afiatic | Empleo | Feb 2018 – May 2021 | CV |
| 7 | Auxiliar Técnico · Telydata | Empleo | Mar 2017 – Feb 2018 | CV |

Las etiquetas salen de lo que dice cada entrada del CV (p. ej. GPON, Inventario, Contratos, Automatización; SLA, 24/7). Ninguna cifra que no esté en el CV.

## Decisiones

| # | Decisión | Por qué / alternativa descartada | Cómo revertir |
| --- | --- | --- | --- |
| 1 | **Orden por fecha de inicio, de más reciente a más antiguo**; los dos proyectos en producción arriba. Super Gol Kids no tiene fecha en el CV ni en el sitio: su columna de fechas dice «En producción» (dato ya aprobado) y **no se inventa un año**. | El encargo pide `pending(...)` si un dato es dudoso; aquí no hace falta marcador porque no se afirma ninguna fecha (un marcador nuevo exigiría autorizarlo en `AUTHORIZED_PENDING`). Si Dennys da el año, se cambia `when` y `from`. | Editar la entrada |
| 2 | **Proyectos y formación llevan una etiqueta** («Proyecto», «Formación»); los empleos no. «En producción» va como etiqueta verde. | «Claramente distintas de los empleos», sin añadir columnas. | Quitar `kinds` de `ui` |
| 3 | **Se nombran las empresas del CV público** (Fibratelecom, MS@Net, Afiatic, Telydata). | El encargo las nombra y el CV es público. Sustituye la regla anterior de P-29 («sin nombre de la empresa de fibra»), que valía mientras Dennys no lo autorizaba; se anota en `preguntas-pendientes-dennys.md`. | Quitar `org` |
| 4 | **Ampliación con `<dialog>` modal nativo**: foco atrapado (el resto de la página queda inerte), Esc cierra, el foco vuelve a la miniatura, clic fuera cierra, ‹ › y flechas del teclado navegan con tope en los extremos, contador «Foto k de n», foto con su `alt` y pie. | Sin dependencias ni trampas de foco propias. Alternativa descartada: reutilizar la foto flotante con hover de la galería anterior (dependía del puntero). | Sustituir `Lightbox` |
| 5 | **Miniatura = primera foto** (un enlace al archivo; «+N» si hay más), `loading="lazy"`, `width`/`height` fijos, 72 px (≥ 44 px táctil). Sin fotos no hay miniatura, ni diálogo, ni columna reservada (`.tl-body:has(.tl-thumb)`). Sin JavaScript la miniatura es un enlace a la foto; el rol `button` se añade al hidratar. | Requisito «sin huecos ni marcos vacíos». | n/a |
| 6 | **Atenuar las demás entradas al pasar el puntero: no se hace.** Al pasar o enfocar una entrada, su título toma el acento y su punto se rellena; nada baja de opacidad. | El encargo lo daba como opcional y «sin esconder información ni depender del hover»; atenuar el texto rebaja el contraste AA. | Añadir `opacity` en `.tl-item` |
| 7 | **«Presente»**: punto relleno con un halo discreto, sin animación, en las dos entradas en curso (Fibratelecom e ISMAC). | Sobrio y compatible con `prefers-reduced-motion`; el texto «Presente» ya está en la columna de fechas, así que el indicador no es lo único que lo dice. | Quitar `[data-current]` en CSS |
| 8 | **P-29 sigue pendiente y autorizado** (las fotos aún no llegan); su pista ahora habla de la línea de tiempo y de `journey-photos.js`. | No se cambia `AUTHORIZED_PENDING`. | n/a |
| 9 | **Fotos de relleno solo en el modo de Vite `e2e`** (2 en Fibratelecom, 1 en MS@Net, con la miniatura del retrato), como antes con la galería; nunca en la compilación normal (una prueba lo exige). | Permite probar con y sin fotos en el mismo navegador. | n/a |

## Diseño y accesibilidad

Fechas a la izquierda (12 px mono, `--muted`), línea vertical y punto, cargo en negrita y empresa en peso medio, viñetas, etiquetas con la clase `.tags` ya existente (mismas fuentes, colores y radios del sitio, claro y oscuro). Móvil (≤ 640 px): una columna, fecha sobre el contenido, miniatura bajo las etiquetas. `h1` de la página → `h2` por entrada. `prefers-reduced-motion`: sin transiciones. Foco visible (el global de `site.css`). Contraste: axe sin violaciones en es/en × claro/oscuro, con la página y con el diálogo abierto.

## Pruebas

- Unitarias: `tests/unit/journey-page.test.js` (sin fotos no hay `<img>` ni `<dialog>`; con fotos hay miniatura con nombre accesible y «+N»; huecos ignorados; `stepIndex`; sin fotos de relleno en la compilación normal; **las fotos declaradas** existen, son WebP en `/images/trayectoria/`, tienen tamaño y `alt` es/en), `tests/unit/content.test.js` (siete entradas en el mismo orden en es y en, fechas del CV, solo años del CV como números, sin Referencias ni correos, P-29), `tests/unit/pages.test.js`.
- Navegador: `tests/e2e/timeline.spec.js` (escritorio es/en: fechas a la izquierda, orden, sin desbordes; móvil 360 y 390: una columna y miniatura ≥ 44 px; con y sin fotos; ampliación por teclado —Enter, foco, flechas con tope, Esc, foco de vuelta—, con ratón, clic fuera, una sola foto sin ‹ ›; inglés; «Presente»; sin atenuación; movimiento reducido; sin JavaScript; axe en claro y oscuro con el diálogo abierto).

## Evidencia (`02-DOCS/evidencia/`)

`trayectoria-sin-fotos-light|dark.png` (compilación de producción: lo que se publicaría hoy), `trayectoria-con-fotos-light|dark.png` (compilación e2e con fotos de relleno), `trayectoria-ampliacion-light.png`, `trayectoria-movil-390-sin-fotos.png`, `trayectoria-movil-360-con-fotos-dark.png`, `trayectoria-en-light.png`.

## Medidas

JS inicial (gzip): 75,0 kB (tras el trabajo A) → 75,7 kB (+0,7 kB: el componente sustituye a la galería). Presupuesto: 150 kB.
