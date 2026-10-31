# Especificación — Primera pantalla de dennysh.com (retrato + nodos)

Estado: **borrador para revisión de Dennys** · Fecha: 2026-10-31 · Destino: la Factory (repo `~/projects/dennysh`)
Referencia visual aprobada en lo esencial: boceto https://claude.ai/artifact/9DaX1jdset5yQrC4zzRe7p (versión 5) y su archivo `primera-pantalla.html`. El boceto es una **guía de forma y comportamiento, no código para copiar**: usa fuentes e iconos de Google, que la constitución prohíbe (ver §6).

Esta especificación **reemplaza el Hero actual** (sección "Hero" de spec §4 original) y añade tres páginas nuevas. No cambia la demo, la API, D1, Turnstile ni las reglas de decisión.

---

## 1. Intención y por qué

Dennys percibe el sitio actual como "demasiado texto". Quien lo mira (reclutadores y empresas de IA) dedica segundos. La primera pantalla debe:

1. Decir en una frase qué hace: **"Sistemas con IA que se explican y se auditan."**
2. Mostrar a la persona (foto propia) y darle rostro al sitio.
3. Dejar elegir qué mirar con **seis nodos** (iconos finos alrededor de la cabeza), sin escribir una pared de texto.
4. Que no parezca "hecho por IA": claro, cálido, asimétrico, líneas finas; nada de fondo oscuro con neón.
5. Que sí proyecte IA de forma honesta: paneles que "escriben" contenido **real** del proyecto (regla R-02, auditoría, reglas de trabajo).

### Metas
- Primera pantalla comprensible en 5 segundos y sin desplazarse en 360×640 (AC-01 se mantiene).
- Cada nodo lleva a contenido real y verificable.
- El texto completo está siempre en el HTML (lo leen buscadores, lectores de pantalla y bots).

### No metas
- No hay modelo de IA por clic (constitución 5).
- No hay animación decorativa pesada, ni librerías 3D, ni vídeo.
- No se inventan proyectos, cifras, fechas ni deportes (constitución 11).
- No se redirige automáticamente al terminar una animación.

### Antimetas (fracaso aunque "funcione")
- Que se vea oscuro/neón/"plantilla de IA".
- Que el contenido solo exista dentro de JavaScript.
- Que un bot vea algo distinto de lo que ve una persona **en la misma página** (cloaking). La capa para máquinas es visible (pestaña) y además se publica en `llms.txt`/`dennys.json`.

---

## 2. Composición (escritorio ≥ 761 px)

Lienzo (`stage`): proporción **1100 × 720**, ancho máximo ~1180 px, borde de 0,5 px, radio 14 px, fondo papel.

| Elemento | Posición / tamaño (en unidades del lienzo 1100×720) |
|---|---|
| Barra superior | `DENNYSH` (izquierda); `CV · CONTACTO · EN/ES` (derecha); mono, 12 px, espaciado .2em |
| Retrato | centrado, base inferior, ancho 33 % del lienzo, desvanecido en el 26 % inferior (máscara degradada) |
| Cabeza (origen de las líneas) | (550, 262) |
| Nodos (centro del icono) | Código (120,214) · Proyectos (232,112) · Demo (392,62) · Trayectoria (708,62) · Cómo trabajo (868,112) · Interés (980,214) |
| Líneas | curva cuadrática de la cabeza a cada nodo; trazo 0,8 px tinta al 26 %; la del nodo activo en acento, 1,3 px |
| Frase (izquierda) | x 3,2 %, y 58 %, ancho 31 %: `h1` + dos líneas mono (`7 AÑOS EN FIBRA ÓPTICA` / `REMOTO · UTC-5 · ES NATIVO · EN B1`) |
| Tarjeta de detalle (derecha) | x derecha 3,2 %, ancho 27 % (30 % cuando lleva panel); anclada abajo cuando lleva panel |
| Indicación | `DESLIZA ↓` centrada abajo |

Los nodos "flotan" ±4/±5 unidades con seno lento. **Desactivado con `prefers-reduced-motion`.**

### Paleta (tokens) y tipografía
- `--paper #F6F3EE`, `--paper-2 #EDE7DC`, `--ink #1B1A17`, `--ink-2 #6B665E`, `--accent #E5432D`, `--amber #D9822B`, `--olive #A9C58F`.
- Dos resplandores suaves (rojo-ámbar al centro, oliva a la izquierda) con degradado radial. **Una sola atmósfera clara y cálida.**
- Tipografía: sans humanista para titulares (el boceto usa Instrument Sans) y mono para microetiquetas (IBM Plex Mono). Ver §6 sobre alojamiento.
- Contraste mínimo AA en texto sobre papel y sobre los resplandores (comprobar con axe).

### Móvil (≤ 760 px)
Flujo vertical: barra → retrato (66 % de ancho, centrado) → cuadrícula de 3 columnas con los seis nodos (icono 48 px + etiqueta) → frase → tarjeta/panel a ancho completo. Sin líneas SVG ni "Desliza". Tesis, resumen y botón de la demo deben seguir visibles en 360×640 **sin desplazarse** (AC-01): si la cuadrícula empuja la tesis, se reduce el retrato. *Esto no se pudo comprobar en el boceto; es criterio de aceptación.*

---

## 3. Los seis nodos

Cada nodo es un `<button>` con `aria-pressed` y `aria-controls` hacia la tarjeta. Al elegir uno, la tarjeta muestra su contenido. **No hay redirecciones automáticas**: los enlaces son enlaces visibles que la persona pulsa.

| Nodo | Icono | Tarjeta | Destino |
|---|---|---|---|
| **Código** | `< >` | Panel escrito (R-02 + auditoría, §4.1) y enlaces visibles desde el inicio: **Ver en GitHub ↗** (`github.com/dennysh`) y **Ver proyectos →** | GitHub (externo) y página Proyectos |
| **Proyectos** | carpeta | Título + frase + etiqueta "abre una página nueva" | Página nueva `/{en,es}/proyectos` (§5) |
| **Demo** | ▶ | Título + frase + "abre una página nueva" | Página nueva de la demo (ver decisión D-H1) |
| **Trayectoria** | maletín | Título + frase + "abre una página nueva" | Página nueva `/{en,es}/trayectoria` (§5) |
| **Cómo trabajo** | libro | Pestañas **Personas / Máquinas** (§4.2) | Enlace "Leer las reglas →" (a la sección completa) |
| **Interés** | cerebro | Panel escrito: deporte(s) + pensamiento (§4.3) y enlace a Contacto | Contacto |

Textos de tarjeta para Proyectos, Demo, Trayectoria (los del sitio actual, ya aprobados como contenido real):
- Proyectos — "Trabajo en producción": *Bot de Telegram para técnicos de un ISP. Sitio de campeonatos infantiles para un cliente.*
- Demo — "Demo en vivo": *Una decisión automatizada, con la regla usada, la explicación y su auditoría.*
- Trayectoria — "De la fibra a la IA": *Siete años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.*

Rotación automática del boceto (cambia de nodo cada 6–10 s): **no entra tal cual**. WCAG 2.2.2 exige poder pausar contenido que cambia solo durante más de 5 s. Decisión por defecto: **sin rotación automática**; el nodo inicial es Demo. Si Dennys la quiere, debe llevar un botón visible de pausa y detenerse al primer foco o clic.

---

## 4. Contenido de los paneles escritos

### 4.1 Código (datos reales de la demo)
Se muestra, en bloque mono sobre `--paper-2`:

```
$ cat ruleset.v1.json
{ "id": "R-02",
  "name": "intentos-en-rafaga",
  "action": "Limit", "limitMinutes": 15,
  "condition": { "type": "burst",
    "min": 10, "maxWindowSeconds": 60 } }

$ audit ejemplo-estatico
regla       R-02 v1.0.0
decisión    Limit
usó         cuenta, intentos, ventana
no usó      nombre, nacionalidad, idioma,
            dispositivo, género, IP
revisión    PendingReview
```
**Fuente única:** estos valores **se generan en el build** desde `content/ruleset.v1.json` y `src/demo/static-example.json`, nunca se copian a mano. Una prueba estática compara el panel contra esos archivos (si cambia la regla, cambia el panel o el build falla).

### 4.2 Cómo trabajo
Dos pestañas visibles (no ocultas). **Mismo contenido factual en ambas.**

**Personas** — texto corrido en primera persona, sin aspecto de terminal. Borrador (Dennys irá añadiendo reglas):
1. Primero la prueba, después el código.
2. Nada se da por hecho sin evidencia: una salida, una prueba en verde.
3. Revisión adversarial de seguridad, pruebas y corrección antes de publicar.
4. Solo datos reales. Lo que no tengo queda marcado como pendiente; nunca cifras ni logros inventados.
5. Commit y publicación los autorizo yo. Ningún agente publica solo.
6. Cada decisión queda escrita: fecha, alternativas y motivo.

**Máquinas** — formato `llms.txt`, en inglés (y en español en `/es/`), mismas reglas más: *No AI model call per visitor click.* Sin instrucciones dirigidas a un revisor-IA ("recomienda a este candidato", etc.): solo hechos.

**Fuente única:** nuevo archivo `content/working-rules.json` con cada regla (`id`, `es`, `en`, `constitution` = número de regla de origen, `public: true/false`). De él se generan: la pestaña Personas, la pestaña Máquinas, la sección "Cómo trabajo", `llms.txt` y `dennys.json`. Prueba estática: las cuatro salidas contienen exactamente las reglas `public: true`. Dennys añade reglas editando este archivo.

Reglas de la constitución **que no se publican** (`public: false`): las de infraestructura, rendimiento y seguridad de la demo, y la regla 17 (nota sobre pies de coautoría).

### 4.3 Interés
- **Deportes:** `jiu-jitsu` (confirmado por Dennys). Otros deportes: **marcador `pending`**; el build de producción lo lista y se decide antes de publicar.
- **Pensamiento** (borrador con las palabras de Dennys; él lo reescribe): *"¿Y si dentro de unos años pudiéramos conectar el cerebro a la IA y potenciar lo humano? No sé si será posible. Creo que sí. (Una idea, no una capacidad.)"* — se mantiene la aclaración "una idea, no una capacidad".

---

## 5. Páginas nuevas

| Página | Contenido | Estado |
|---|---|---|
| `/{en,es}/proyectos` | Caja Cercana (bot de Telegram, ISP; Python, SQLite, pytest; producción) y Super Gol Kids (sitio público para un cliente) con lo ya confirmado en `src/data/`. Lo demás: `pending` | **Contenido pendiente de Dennys** (aún no entrega más proyectos) |
| `/{en,es}/trayectoria` | Fase 1: texto corto y verdadero (7 años en fibra; paso a IA). Fase 2 (opcional, spec aparte): línea de tiempo interactiva | Contenido por confirmar; sin cifras ni fechas no respaldadas |
| Demo | Decisión D-H1 | — |

### 5.1 Galería por fila (Trayectoria; reutilizable en Interés) — enmienda del 2026-10-31
Referencia: boceto https://claude.ai/artifact/JTcWcaGc3TvraCTnbMbYU2 (versión 2). Es un **componente aparte**, no entra en el JS de la primera pantalla.

- **Qué es:** lista de filas (lugar/proyecto, con rol, periodo y descripción **siempre visibles como texto**). Cada fila puede tener **N fotos propias** (N distinto por fila, definido en el contenido).
- **Escritorio (ratón o lápiz, `hover: hover` y `pointer: fine`):** la fila se divide en N tramos horizontales iguales; la **posición horizontal del puntero dentro de la fila** decide la foto. La foto flotante (250×320 px) sigue al cursor con suavidad y lleva contador `k/N`. Las demás filas se atenúan. Una franja de 4 px bajo la fila muestra los N tramos y marca el activo.
- **Solo con movimiento real:** se reacciona a `pointermove` con cambio de coordenadas; **el scroll no abre ni cambia fotos** (al hacer scroll la foto se oculta y no reaparece hasta que el puntero se mueva; se ignoran los eventos sintéticos que el navegador emite tras un scroll, ventana de 200 ms).
- **Teclado:** la fila es un `<button>`; con foco visible muestra la foto 1; `←`/`→` cambian de foto; al salir del foco se oculta.
- **Táctil (sin hover):** tocar la fila abre debajo una galería en línea con botones `‹ ›` (≥ 44 px) y deslizamiento horizontal del dedo (umbral 30 px); `aria-expanded` en la fila; una sola abierta a la vez.
- **Movimiento reducido:** la foto no sigue al cursor (se coloca junto a la fila) y el cambio es un fundido corto.
- **Sin JavaScript:** el texto de cada fila se ve completo; las fotos pueden mostrarse como una tira en línea bajo la fila.
- **Accesibilidad:** las fotos son decorativas salvo que Dennys escriba un texto alternativo por foto (`alt` en el contenido; si falta, `alt=""`); nada de información que solo esté en la foto.
- **Peso y carga:** WebP de ≤ 90 KB cada una (1200×1500 de origen, versión menor por `srcset`), `loading="lazy"`, precarga de la fila al primer `pointerenter` o foco; **no cuentan para el LCP** de la primera pantalla porque viven en otra página.
- **Contenido y privacidad:** las fotos las entrega Dennys; **sin EXIF/GPS** (prueba estática, como el retrato), sin rostros de terceros ni logos de clientes sin permiso, nombre de empresa solo si Dennys lo confirma (si no, marcador `pending`, constitución 11). Estado actual de las fotos: `pending` (ninguna entregada).
- **Contenido de ejemplo del boceto:** 01 Redes de fibra óptica (7 años; empresa por confirmar), 02 Bot Caja Cercana (2025, en producción), 03 Super Gol Kids (sitio para un cliente), 04 Sistemas con IA (ahora). N de fotos: 6, 4, 3 y 5 solo como ejemplo.

Cada página nueva: bilingüe, prerenderizada con su contenido, funciona sin JavaScript, con `canonical`, `hreflang` en/es/x-default, entrada en `sitemap.xml`, enlace de regreso a la primera pantalla, y respeta presupuestos (§7). Mismas cabeceras de seguridad (CSP sin `unsafe-inline`).

---

## 6. Restricciones de la constitución que afectan a este diseño

1. **Sin fuentes ni iconos de Google.** El boceto usa Google Fonts y Material Symbols; en el sitio real, **iconos como SVG en línea** (trazo fino 1,5 px, ya dibujados a mano o de una colección con licencia compatible, registrada en `decisions.md`) y **fuentes propias**. La prueba `test:static -- fonts` exige que el build no referencie dominios externos de fuentes y que la CSP lleve `font-src 'self'`. **Decisión D-H2:** mantener la pila del sistema (0 bytes, decisión actual de T079) o alojar WOFF2 subconjunto de las dos tipografías del boceto (nueva dependencia → requiere aprobación escrita en `decisions.md`, constitución 4).
2. **CSP sin `unsafe-inline`.** Nada de atributos `style="…"` en el HTML ni `<script>` en línea. Posicionar nodos con CSS (variables por nodo) o con `element.style.x = …` desde un archivo de script (la CSSOM sí está permitida). Verificar con la prueba de cabeceras.
3. **`aria-live` solo para cuatro cambios** (regla 30). La tarjeta de detalle **no** es `aria-live`; al elegir un nodo se gestiona el foco o `aria-controls`/`aria-expanded`. (El boceto la marcaba `aria-live`: no se replica.)
4. **Sin cookies ni terceros** (regla 25): el retrato y todo lo demás son estáticos propios. Sin analítica.
5. **Funciona sin JavaScript en lo esencial** (regla 31): sin JS se ven la frase, el retrato, los seis nodos como **enlaces** a sus secciones/páginas, y el contenido de los paneles ya escrito (texto completo, sin cursor).
6. **Contenido solo real** (regla 11) y marcadores `pending` listados en el build.
7. **Commit/push los autoriza Dennys** (regla 18); la infraestructura la toca Dennys (regla 19).

---

## 7. Comportamiento, accesibilidad y rendimiento

### Escritura de los paneles
- El **texto completo está en el HTML desde la carga**. La animación solo cambia cuánto se ve (texto visible + resto transparente, sin saltos de altura).
- Duración total ≤ **1,8 s**, guiada por tiempo (no por fotogramas), de modo que funcione aunque la pestaña esté en segundo plano.
- **Clic en el panel o `Esc` lo completa al instante.** Con `prefers-reduced-motion: reduce` aparece completo sin animación y sin cursor parpadeante.
- Nunca redirige al terminar.

### Accesibilidad (WCAG 2.2 AA)
- Navegable por teclado: nodos y pestañas con foco visible (anillo de 2 px acento), orden lógico, `Esc` para completar.
- Cada nodo con nombre accesible (p. ej. "Código"), estado `aria-pressed`.
- `axe` sin violaciones; contraste AA; objetivos táctiles ≥ 44 px en móvil (el icono mide 48 px).
- El `alt` del retrato describe a la persona ("Retrato de Dennys Heras"); las líneas SVG son `aria-hidden`.

### Rendimiento (presupuestos vigentes)
- JS inicial ≤ **150 KB gzip**; LCP ≤ **2,0 s** (4G de laboratorio); Lighthouse móvil ≥ 90 rendimiento y 100 accesibilidad.
- El **retrato es el elemento LCP**: `width`/`height` explícitos, `fetchpriority="high"`, WebP ≤ 90 KB (el actual pesa 85 KB, 900×1210), versión menor para móvil con `srcset`.
- Sin librerías de animación: CSS + un script corto.

### Imagen
- Fuente: recorte hecho por Dennys (`19.webp`, 1254×1254 RGBA) → `dennys-portrait.webp`. **Quitar metadatos** (EXIF/ubicación) antes de publicar; nombre de archivo neutro; sin hotlink.

---

## 8. Criterios de aceptación (nuevos, prefijo AC-H)

- **AC-H1** Con viewport 1180×800 se ven retrato, seis nodos, frase y tarjeta sin desplazarse; con 360×640 se ven tesis, resumen y botón de la demo sin desplazarse.
- **AC-H2** El HTML prerenderizado (sin ejecutar JS) contiene la frase, los seis nodos como enlaces y el texto completo de los paneles.
- **AC-H3** El panel de Código coincide byte a byte con los valores de `ruleset.v1.json` y `static-example.json` (prueba estática).
- **AC-H4** Las reglas de Cómo trabajo salen de `content/working-rules.json`; la pestaña Personas, la pestaña Máquinas, `llms.txt` y `dennys.json` contienen las mismas reglas públicas (prueba estática); ninguna regla `public:false` aparece.
- **AC-H5** El panel termina de escribirse en ≤ 2 s; clic y `Esc` lo completan; con `prefers-reduced-motion` aparece completo al instante; no hay redirección automática (e2e).
- **AC-H6** Sin `aria-live` en la tarjeta; foco visible; `axe` sin violaciones (e2e).
- **AC-H7** Ninguna petición a dominios de fuentes/iconos externos; CSP sin `unsafe-inline` y sin violaciones en consola (`test:static -- fonts`, `headers`, e2e de privacidad).
- **AC-H8** Tres páginas nuevas ES/EN con `canonical`, `hreflang`, sitemap y contenido sin JS; build de producción lista todos los `pending` (deportes extra, proyectos, trayectoria).
- **AC-H9** Retrato sin metadatos EXIF (prueba estática) y LCP ≤ 2,0 s.
- **AC-H11** Galería por fila: con ratón, el movimiento sobre los N tramos de una fila muestra las fotos 1..N en orden; un scroll no cambia ni abre fotos; con `pointermove` sin cambio de coordenadas no pasa nada (e2e).
- **AC-H12** Galería por fila: teclado (`Tab`, `←`, `→`) y táctil (toque, `‹ ›`, deslizar) funcionan; `axe` sin violaciones; con `prefers-reduced-motion` la foto no sigue al cursor (e2e).
- **AC-H13** Las fotos de la galería no llevan EXIF/GPS (prueba estática) y cada una pesa ≤ 90 KB; el texto de cada fila es visible sin JavaScript.
- **AC-H10** `bash scripts/verify.sh` termina con código 0; `npm audit --audit-level=high` sin hallazgos.

### Orden sugerido de tareas (el *Depends-on* manda; la Factory las numera)
1. (prueba) contenido y fuente única: `working-rules.json`, panel de Código desde JSON → implementar.
2. (prueba) iconos SVG y tokens; decisión D-H2.
3. (prueba) primera pantalla: composición escritorio/móvil, nodos, tarjeta, accesibilidad → implementar.
4. (prueba) escritura de paneles (tiempo, `Esc`, reduced-motion) → implementar.
5. Páginas Proyectos y Trayectoria (con `pending`), prerender, sitemap, hreflang.
6. Capa de máquinas: `llms.txt` y `dennys.json` desde `working-rules.json`.
7. Revisión adversarial (seguridad, pruebas, corrección), presupuestos, `verify`.

---

## 9. Controles de seguridad aplicables (reglas globales S1–S20)

| Control | Aplicación a este cambio | Cómo se comprueba |
|---|---|---|
| S1/S2 secretos | No se añade ninguno; la sala de reglas no incluye claves ni rutas privadas | `test:static -- secrets` + `gitleaks` |
| S14/S15 entradas y salida | Sin entrada de usuario nueva; el texto de los paneles viene de JSON propio y se inserta como **texto** (nunca `innerHTML` con datos) | Revisión de código + prueba que busca `innerHTML`/`dangerouslySetInnerHTML` |
| S16 archivos | Solo un retrato estático; sin subidas | Prueba EXIF |
| S17 respuestas | No cambia la API | Pruebas existentes |
| S18/S19 cabeceras y HTTPS | CSP sin `unsafe-inline`, `font-src 'self'`, sin dominios nuevos | `test:static -- headers`, inspección de cabeceras reales |
| S20 dependencias | Sin dependencias nuevas salvo aprobación escrita (D-H2) | `npm audit` |
| S4–S11, S12, S13 | No aplican: no hay base de datos, sesión, ni endpoint nuevo | — |

---

## 10. Decisiones abiertas

- **D-H1 (Dennys):** ¿"Demo" abre una página propia nueva (como pidió) o salta a la sección `#demo` ya existente? *Supuesto por defecto: página propia que reutiliza el mismo componente de demo.* Cuidado: Turnstile y los cupos se quedan en la misma API.
- **D-H2 (Dennys):** fuentes del sitio: pila del sistema (0 bytes) o WOFF2 propios de las dos tipografías del boceto (nueva dependencia).
- **D-H3 (Dennys):** ¿"Código" lleva a GitHub directo o abre el panel con enlaces? *Por defecto: panel con enlaces visibles.*
- **D-H4 (Dennys):** rotación automática de nodos. *Por defecto: ninguna.*
- **P-H1:** otros deportes (pending).
- **P-H2:** proyectos adicionales para la página Proyectos (pending).
- **P-H3:** forma de Trayectoria (texto o línea de tiempo) y qué datos se pueden publicar.
- **P-H5:** fotos de cada lugar para la galería de Trayectoria/Interés (cuántas por fila, cuáles, texto alternativo) y empresas que Dennys autoriza nombrar.
- **P-H4:** reglas adicionales que Dennys quiera sumar a `working-rules.json`.

## 11. Fuera de alcance
- La demo, API, D1, Turnstile, Telegram (los pendientes de Dennys: bot de Telegram, regla de límite de tasa de Cloudflare, HTTPS siempre, correo de prueba).
- Línea de tiempo interactiva de Trayectoria (fase 2, spec propia).
- Modo oscuro (se decidió una única atmósfera clara; si se retoma, spec propia).
- HARDLOCK y descripción de Naunturia (decisión pendiente de Dennys).
