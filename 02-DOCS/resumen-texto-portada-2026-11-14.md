# Texto de la primera pantalla (2026-11-14)

Encargo pequeño de Dennys. Sobre main 05a7b18, un commit aparte, sin push.

## Qué cambió
- `src/content/site.js`: quitado «UTC-5» de la línea de datos de home.
  - es: «Remoto · Español nativo · Inglés B1»
  - en: «Remote · Spanish native · English B1»
- `src/content/site.js`: frase en español ahora «Te cuento lo que hago en unos pocos minutos.». La frase en inglés no cambia («A little of what I do, in a few minutes.»).
- Pruebas actualizadas: `tests/unit/content.test.js`, `tests/e2e/first-screen.spec.js`, `tests/e2e/sections.spec.js` (solo la parte en español).

## Qué no se tocó
- Campo `timezone` de Contacto (`site.js`), `demo-lib.test.js` y `alert-text.test.js`.
- Menciones históricas (specs de 2026-10-29 y 2026-10-31, informe de correcciones, prototipo móvil en `docs/design/`): son registro de decisiones pasadas. Ningún sitio en vivo (title/meta/og, sitemap, llms.txt) usaba la frase ni el tagline aparte de `site.js`.

## Pruebas
- vitest: 61 archivos, 1051 pruebas, verde.
- e2e `first-screen` + `sections`: 75 de 75, verde.
- `bash scripts/verify.sh`: verify OK.
- Astra (GPT, solo lectura, solo el diff): APRUEBA, sin cambios por su parte.

## Revisión visual
- Móvil 390×844 y 360×640: h1 en 3 líneas, la línea de datos cabe en una línea sin huérfanas, retrato intacto.
- Escritorio 1440×900: línea de datos bien. El h1 en español queda en 3 líneas con «minutos.» sola en la última. Es el ajuste natural de la frase nueva; arreglarlo pide CSS (`text-wrap: balance`) y quedó fuera del alcance. Pendiente de decisión de Dennys.
