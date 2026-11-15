# Captura real del Bot de caja más cercana (2026-11-15)

**Qué se hizo**
- `public/images/bot-caja-cercana-demo.webp` copiada tal cual de `/tmp/bot-caja-cercana-demo.webp` (746×912, **87 212 bytes ≈ 85 KB**, sin recortar ni retocar; no se generó variante móvil).
- En Proyectos, dentro del «Bot de caja más cercana», se ve la captura con su pie (es/en) y texto alternativo del encargo. Dato en `site.js` (`shot` del bot `caja-cercana`), dibujo en `TelegramBots.jsx` solo con `open` (Proyectos): la portada y Explorar no la llevan.
- `width`/`height` declarados (746×912), `loading="lazy"`. Escritorio: máx. 460 px; móvil: al ancho disponible. Borde y esquinas con `--line` y `--radius`; en tema claro queda enmarcada.
- Las imágenes `bot-registro-cajas-chat.svg` y `bot-reportes-chat.svg` no se tocaron (siguen solo en Sobre mí).
- Para que la caja vecina no se estirara dejando un hueco en escritorio, `.bots-list` lleva `align-items: start` (las cajas de bots ya no se igualan en altura por fila).

**Pruebas**
- Unitarias nuevas (`pages.test.js`): imagen, alt, pie, ancho/alto, lazy, una sola vez, ausente en portada, archivo existe, es y en.
- e2e nueva (`sections.spec.js`): visible, carga real (746 px), pie, ≤480 px, sin desbordes.
- `content.test.js`: la lista de números permitidos suma 327, 457 y 636 (distancias ficticias del alt pedido). Es el único cambio a una prueba existente; no se relajó ninguna de accesibilidad ni de desbordes.
- `npm run build`, vitest completo (1098 ✓) y e2e sections, critica-1, theme, mobile-landing y first-screen (167 ✓, con axe).
- Sin Astra (no hay JavaScript no trivial). Sin push. Servidores de vista previa cerrados.

**Dudas**
1. En 360 px la imagen mide ~252 px (34 % de su tamaño): el texto del bot se ve pequeño y no se lee sin ampliar. Es el máximo «al ancho disponible» que pide el encargo. Si hace falta, se puede abrir la imagen al tocarla (pide decisión).
2. `.rsc.json` y `02-DOCS/informe-pre-produccion-2026-11-09.md` ya estaban modificados antes; no entran en el commit.

Capturas: `02-DOCS/capturas-captura-bot-2026-11-15/` (390, 360 y 1440 es oscuro; 1440 es claro; 1440 en oscuro).
