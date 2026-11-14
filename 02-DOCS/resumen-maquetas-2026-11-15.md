# Resumen: maquetas de bot en vertical y «más de 7 años» (2026-11-15)

Dos commits locales en `main`, sin push.

## 1. Maquetas de bot en vertical
- Los dos SVG apaisados (1200×760) se borraron. Los reemplazan `public/images/bot-registro-cajas-chat.svg` y `public/images/bot-reportes-chat.svg`: pantalla de teléfono con chat de Telegram, viewBox 360×640, texto de 14–16 px (a 390 px de pantalla se ve a unos 13,5–15 px).
- Contenido: registro de cajas (comando, tipo y capacidad, coordenadas con puntos, foto adjunta, «Validado», «Registro guardado») y reportes (nuevo reporte, fibra caída en Sector Norte, N.º de reporte, prioridad alta, evidencia, «pendiente», técnico asignado). Todo ficticio, sin @usuarios, empresa, personas, coordenadas ni teléfonos.
- Etiqueta «DATOS FICTICIOS» (14 px) dentro de cada imagen. Cada imagen lleva su propio fondo oscuro: contraste AA igual en tema oscuro y claro (una sola variante).
- Maquetación: se quitó el marco desplazable y su CSS. Móvil: una por fila a ancho completo (máx. 420 px). Escritorio ≥ 900 px: lado a lado, 400 px cada una, centradas. `width=360 height=640`, `loading=lazy`. Título propio por imagen y aviso de «datos de muestra» una sola vez.
- Alt actualizado (ejemplo con datos de muestra, sin cifras).
- Pruebas unitarias y e2e de Sobre mí actualizadas (sin marco, ancho 340–420, lado a lado en escritorio, una por fila en móvil).

## 2. «Más de 8 años»
- `src/content/site.js` (es/en): resumen, quién soy, tagline de la portada, tarjeta de Trayectoria, intro y descripción de Sobre mí, línea de tiempo. De ahí salen solos los meta (title/og/description), llms.txt, dennys.json y JSON-LD. Revisado en `dist`: no queda «7 años», «siete años» ni «seven years» sin «más de / more than».
- `src/data/content.js` (copia sin uso) también. Pruebas que fijaban el texto, actualizadas.
- Las specs históricas en `docs/` no se tocaron (reflejan lo decidido en su fecha).
- Portada: la línea de datos queda en dos líneas exactas (una por frase), sin palabras huérfanas, en 390×844, 360×640 y 1440×900, en es y en.

## Comprobación
- vitest: 1074 pruebas verdes. e2e (sections, first-screen, contact): 104 verdes. `npm run build` correcto.

## Capturas (`02-DOCS/evidencia/`)
`maquetas-sobre-mi-es-{390,1440}-{oscuro,claro}.png`, `maquetas-portada-es-{390,1440}-oscuro.png`.

## 3. Corrección: «Más de 8 años»
Por decisión de Dennys la cifra pasa de «Más de 7 años» a «Más de 8 años» (es) y de «More than 7 years» a «More than 8 years» (en) en `site.js`, `content.js` y las pruebas que la fijan (meta, llms.txt, dennys.json y JSON-LD salen de `site.js`); vitest 1074 verdes, e2e first-screen y sections 91 verdes, y la línea de datos de la portada sigue en dos líneas sin huérfanas en 390×844, 360×640 y 1440×900 (es y en).
