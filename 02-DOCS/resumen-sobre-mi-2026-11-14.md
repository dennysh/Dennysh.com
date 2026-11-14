# Resumen: «Sobre mí», portada con propuesta y contacto (2026-11-14)

Carril: FTD. Tres commits locales, **sin push**.

| Commit | Qué |
| --- | --- |
| `466c269` | Nodo Interés → «Sobre mí» / «About me», página nueva y redirecciones |
| `6fe5541` | Portada: línea de propuesta y botón «Escríbeme» |
| `1bee91c` | Contacto: botón WhatsApp; privacidad: línea sobre WhatsApp (Meta) |

## Qué se hizo
- Rutas `/es/sobre-mi/` y `/en/about/`. Las viejas redirigen con 301 (`public/_redirects`, con y sin barra final) y hay respaldo en el cliente (`RENAMED` en `src/routes.js`). Una prueba exige que ambos coincidan. Nav, barra, pie, sitemap, llms.txt y títulos salen de la misma fuente y cambian solos.
- Página en el orden pedido: presentación, audio opcional, Qué hago, ejemplos del bot (2 SVG con rótulo de muestra, alt, ancho/alto fijos, carga diferida), Criden con enlace, Contacto (Escríbeme + WhatsApp), Interés a largo plazo con su aviso. Texto del interés sin cambios.
- Audio: `src/content/about-audio.js` con lista vacía; no se pinta nada. Con archivos: `preload="none"`, sin autoplay, rótulo de voz con IA. La CSP ya permite `/audio/` (sin `media-src` manda `default-src 'self'`), así que **no se tocó `_headers`**.
- Criden: enlace `https://criden.com` en la página y en la tarjeta de Proyectos; P-22 resuelto y quitado de `AUTHORIZED_PENDING`.
- Portada: propuesta bajo el h1, botón «Escríbeme»/«Write to me» a Contacto (≥ 44 px, foco visible, contraste AA). En móvil va abajo, sobre el torso, para no tapar la cara; en pantallas bajas (≤ 700 px) se compacta el título.
- Contacto: botón WhatsApp (`wa.me`, pestaña nueva, `noopener noreferrer`, nombre accesible «se abre en otra pestaña»). El número solo está en el enlace. «Cuándo puedo empezar: por confirmar» sigue igual.
- Privacidad: enumera terceros (Turnstile), así que se añadió la línea de WhatsApp (Meta) en es/en y la compuerta `checkLegal` la exige.

## Pruebas
- vitest: 1074 pasan. `bash scripts/verify.sh`: OK (build, compuertas estáticas, audit sin nivel high; hay 4 avisos moderados de `glob`/`minimatch`, ya existentes).
- e2e (proyecto `mocked`): sections, first-screen, mobile-landing, contact, theme y critica-1 pasan, salvo los dos casos de abajo.

## Decisiones
- El id interno del nodo sigue siendo `interest` (geometría, red, CSS, pruebas). Solo cambian rótulos y rutas. La página sigue en `interestPage`.
- La tarjeta/preview del nodo usa la presentación; el texto del cerebro vive solo en la sección final de la página y en Contacto.
- En Contacto el botón de WhatsApp va solo (sin segundo botón de correo): la prueba C-01 exige un único mailto en el cuerpo. Cuando el formulario no está disponible, el botón de correo aparece justo debajo.
- Texto «Agentes de IA»: marcado como capacidad declarada y prototipo, como ya consta en Código.
- Alt de los mockups sin cifras (la prueba de «solo números verificados» lo exige).

## Qué NO se hizo / no se probó
- **Astra no se ejecutó.** El entorno bloqueó el envío del diff a Codex (permiso denegado). Pendiente, solo el diff de: ruta nueva con redirección (`src/routes.js`, `public/_redirects`), botón WhatsApp (`ContactButtons.jsx`, Contacto) y reproductor de audio. No hubo cambios en `_headers`/CSP.
- El `_redirects` real no se probó en Cloudflare Pages (solo el respaldo del cliente y el formato). Verificar tras publicar que `/es/interes` y `/en/interest` dan 301.
- Los dos SVG de muestra traen texto en español y el usuario `@RegistroCajasBot` / `@ReportesTelecomBot` dibujado. No hay nombre de empresa, pero conviene que Dennys lo confirme.
- Pruebas e2e del proyecto `real` (wrangler) no se corrieron. `network.spec.js` no se corrió completo (solo se cambió su enlace).
- Flaky ya existente: `critica-1` «objetivos táctiles móvil» falla a ratos con «Open Code →» 224×44 (comprobado igual en el commit anterior). `mobile-landing` 360×640 oscuro falló una vez en la corrida completa (279 vs 300 píxeles) y pasó 3/3 aislado.
- Privacidad: la frase de la intro «El único tratamiento ocurre cuando envías el formulario» no se tocó.

## Capturas (`02-DOCS/evidencia/`)
`sobre-mi-{portada,pagina,contacto}-es-{390,1440}-{oscuro,claro}.png`
