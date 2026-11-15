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

## Ajuste (la captura no se leía)

**Qué cambió**
- Nuevo recorte `public/images/bot-caja-cercana-respuesta.webp` (280×312, 18 810 bytes), copiado tal cual de `/tmp/bot-caja-cercana-respuesta.webp`. Es la imagen que se ve en Proyectos. La captura completa `bot-caja-cercana-demo.webp` sigue en el repo.
- Debajo del pie, enlace de texto «Ver la conversación completa» / «See the full conversation» a la captura completa. Enlace normal (`<a href>`, sin JavaScript), `target="_blank"` con `rel="noopener noreferrer"` y `aria-label` «… (se abre en otra pestaña)» / «(opens in another tab)», como el de WhatsApp. Alto táctil 44 px.
- Texto alternativo nuevo (es y en) tal como lo pidió el encargo. El pie visible no cambió. `width`/`height` 280×312 y `loading="lazy"`.
- CSS: `.bot-shot` mide 280 px fijos (`max-width: 100%`), ya no se estira.
- Hueco en escritorio: la tarjeta alta ocupa tres filas de la columna derecha y las otras tres bots se apilan a su izquierda (solo en listas con captura, ≥ 700 px; la portada no cambia). Antes quedaba ~480 px vacíos junto a «Bot de registro de cajas»; ahora quedan ~250 px bajo la columna izquierda, al final de la tarjeta.

**A qué tamaño se ve la imagen** (medido en el navegador, tamaño real = 280 px)
| Ancho | Imagen | Enlace (alto) |
| --- | --- | --- |
| 1440 (escritorio) | 280×312 (1,0×) | 44 px |
| 390 (móvil) | 280×312 (1,0×) | 44 px |
| 360 (móvil) | 280×312 (1,0×) | 44 px |
Sin desbordes horizontales en ninguno. «Cajas más cercanas» y las distancias se leen sin ampliar. Esto resuelve la duda 1 de arriba.

**Pruebas**
- Unitarias: la imagen es ahora el recorte (src, 280×312, alt, lazy); nueva prueba del enlace (href, aria-label, rel, texto, va bajo el pie); existen los dos archivos. En la prueba del bloque «Bots para Telegram» (es/en), `href=` ya no está prohibido sin más: se exige que el único href sea el de la captura completa (sigue sin haber enlaces a repositorios).
- e2e: ancho de la imagen entre 260 y 340 px, enlace visible con href, aviso y alto ≥ 44 px.
- `npm run build` antes de vitest; vitest 1100 ✓; e2e sections, critica-1, theme, mobile-landing y first-screen 167 ✓ (con axe). Sin Astra. Sin push. Servidores de vista previa cerrados.

Capturas: `02-DOCS/capturas-captura-bot-b-2026-11-15/` (es oscuro en 390×844, 360×640 y 1440×900; es claro 1440; en oscuro 1440).
