---
type: plan
title: Plan — primera pantalla de dennysh.com (retrato y seis nodos)
description: Plan y lista de tareas (prueba antes de implementación) para reemplazar el Hero por una primera pantalla con retrato, seis nodos, paneles escritos y tres páginas nuevas.
tags: [sdd, plan, tasks]
timestamp: 2026-10-31T00:00:00Z
topic: sdd
slug: primera-pantalla
status: draft
---

# Plan — primera pantalla de dennysh.com

> Spec: [`docs/superpowers/specs/2026-10-31-primera-pantalla-design.md`](../../../../docs/superpowers/specs/2026-10-31-primera-pantalla-design.md) (borrador de Dennys, 2026-10-31).
> Constitución: [v1.1.0](../constitution.md). Plan padre: [dennysh-demo-decision](dennysh-demo-decision.md) (este plan **reemplaza el Hero** de su T082 y no toca demo, API, D1, Turnstile ni reglas).
> Estado: **borrador a la espera de la aprobación de Dennys. No se ha escrito código de producto ni se ha hecho commit.**
> Prototipo móvil con mediciones: [`docs/design/primera-pantalla-movil/`](../../../../docs/design/primera-pantalla-movil/).

## 0. Global Constraints

- Sin dependencias nuevas (constitución 4, D-H2): pila de fuentes del sistema (`--font-sans`, `--font-mono` de `src/styles/tokens.css`) e **iconos SVG en línea**. Sin fuentes ni iconos de Google, sin librerías de animación.
- CSP vigente sin cambios: `default-src 'self'`, sin `unsafe-inline`. **Prohibidos** los atributos `style="…"` y los `<script>` en línea (el HTML prerenderizado se comprueba). Posición con clases CSS; solo CSSOM (`element.style.x`) desde archivo de script.
- Texto de paneles insertado como texto (React o `textContent`); nunca `innerHTML` ni `dangerouslySetInnerHTML` con datos (S14/S15).
- `aria-live` solo para los cuatro cambios existentes (regla 30); la tarjeta no es `aria-live`.
- Funciona sin JS (regla 31): frase, retrato, seis nodos como **enlaces** y texto completo de los paneles en el HTML.
- AC-01 se mantiene: en 360×640 y 390×844, tesis, resumen de 5 líneas y botón de la demo visibles **sin desplazarse**. La constitución **no se enmienda** (decisión de Dennys 2026-10-31).
- Contenido solo real (regla 11). Todo lo que falta va como `pending` con id `P-<n>` (P-23 a P-26); el build de producción los lista y falla si no están autorizados en `AUTHORIZED_PENDING`.
- Presupuestos: JS inicial ≤ 150 KB gzip, LCP ≤ 2,0 s, Lighthouse móvil ≥ 90 / 100 de accesibilidad. Retrato WebP ≤ 90 KB, `width`/`height`, `fetchpriority="high"`, `srcset` (escritorio y móvil), sin metadatos.
- Compatibilidad con wrangler 3.114.17: sin import attributes (`npm run test:wrangler3`).
- Commit y push los autoriza Dennys (regla 18); infraestructura solo la toca Dennys (regla 19).

## 1. Context & constraints

**Decisiones de Dennys que fijan el plan**

| Decisión | Valor | Origen |
| --- | --- | --- |
| D-H1 Demo | Página propia `/{en,es}/demo` que reutiliza el componente de demo (mismo endpoint, Turnstile y cupos) | supuesto por defecto del spec |
| D-H2 Fuentes | Pila del sistema + SVG en línea, sin dependencias | instrucción 2026-10-31 |
| D-H3 Código | El nodo abre un panel con enlaces visibles (GitHub ↗ y Ver proyectos →) | supuesto por defecto |
| D-H4 Rotación | Ninguna; nodo inicial Demo | supuesto por defecto (WCAG 2.2.2) |
| Interés | Se sigue el spec: la frase del cerebro va en el panel de Interés; la etiqueta mono `7 AÑOS EN FIBRA ÓPTICA` entra | respuesta 2026-10-31; **excepción a la decisión del 2026-10-30** (frase solo en Contacto), registrada en D-H5 |
| Móvil | Layout propio, no el de escritorio reducido | respuesta 2026-10-31 |

**Choques con la constitución o el código (detectados al leer; resueltos así)**

| # | Choque | Resolución en este plan |
| --- | --- | --- |
| C1 | Regla 32/AC-01 vs diseño móvil del spec (no incluía resumen ni botón) | Rediseño móvil propio (§2.3) medido en prototipo; sin enmienda |
| C2 | Frase del cerebro: spec (en Interés) vs decisión del 30-oct y `content.test.js` | Se sigue el spec; la prueba se reescribe primero (TH07) y se registra la excepción |
| C3 | Spec saca Proyectos de `src/data/`, que aún trae "1,719" y "Ecuador" (P-05) | La página sale de `src/content/site.js`; prueba que ni `1,719` ni `Ecuador` aparecen |
| C4 | Prueba y `scripts/static/site.mjs:66`: el sitemap lista solo `/en/` y `/es/` | Se reescriben primero (TH19) para listar también las tres páginas nuevas ×2 idiomas |
| C5 | `P-H1…P-H4` no cumplen el formato `P-<n>` de la compuerta | Renumerados P-23 a P-26 |
| C6 | La demo sale de `/en/#demo` (D-H1): e2e, `llms.txt` y botón del Hero apuntaban ahí | TH19–TH20 reapuntan e2e, enlaces y botón |
| C7 | Tema: el sitio es oscuro por defecto (T079); el spec es una sola atmósfera clara | Solo cambian los tokens de `tokens.css` (no hay colores fuera de él: 0 hex en `site.css` y `demo.css`); axe vuelve a comprobar contraste |
| C8 | Retrato: Dennys lo entregó en `docs/design/dennys-portrait.webp` (2026-10-31). Verificado con un lector de fragmentos RIFF en Node: fragmentos `VP8X`, `ALPH`, `VP8 `; sin `EXIF`, `XMP ` ni `ICCP`, banderas de metadatos en 0; 900×1210; 87 176 bytes (≤ 90 KB). No hay Pillow, `cwebp` ni `sharp` | Resuelto. Queda la versión pequeña para móvil (`srcset`): se genera con Chromium de Playwright (canvas → WebP), sin dependencias; si la calidad no convence se publica una sola imagen (TH22) |
| C9 | El build de producción fallará con P-23 a P-26 sin autorizar | Es el comportamiento deseado; **[H]** TH26 |

## 2. Architecture

### 2.1 Fuentes únicas (datos → salidas)

```
content/working-rules.json ─┬─> pestaña Personas ─┐
 (id, es, en, constitution, ├─> pestaña Máquinas ─┤ prueba estática: mismas reglas
  public)                   ├─> sección "Cómo trabajo"  públicas, ninguna public:false
                            ├─> llms.txt ─────────┤
                            └─> dennys.json ──────┘
content/ruleset.v1.json + src/demo/static-example.json ──> scripts/lib/panels.mjs#codePanel() ──> panel de Código
```

`codePanel(ruleset, audit)` es una función pura usada por el prerender y por la prueba, por lo que si cambia R-02 o el ejemplo cambia el panel o falla el build. Las reglas `public:false` son las de infraestructura, rendimiento y seguridad de la demo y la regla 17.

### 2.2 Componentes (React, sin dependencias nuevas)

| Archivo | Responsabilidad |
| --- | --- |
| `src/home/FirstScreen.jsx` | Composición: barra, retrato, líneas SVG (`aria-hidden`), frase, tarjeta |
| `src/home/Nodes.jsx` | Seis nodos. HTML prerenderizado: `<a href>`; tras montar en el cliente se vuelven `<button aria-pressed aria-controls>` |
| `src/home/Panels.jsx` | Seis paneles en el HTML siempre; sin JS el CSS `:target` elige cuál se ve (por defecto Demo) |
| `src/home/icons.jsx` | Seis iconos SVG en línea, trazo 1,5 px, `aria-hidden` |
| `src/home/typewriter.js` | Escritura guiada por tiempo, ≤ 1,8 s; clic/`Esc` completan; reduced-motion sin animación |
| `src/pages/{Projects,Journey,DemoPage}.jsx` | Páginas nuevas (reutilizan `Header`, `Txt`, `Demo`) |
| `scripts/prerender.mjs` | Registra las rutas nuevas, sitemap, `hreflang`, `canonical` |

Los nodos se posicionan con clases CSS por nodo (porcentajes derivados de 1100×720); las curvas son un SVG estático con `viewBox` 1100×720. Flotación por `@keyframes`, desactivada con `prefers-reduced-motion`.

### 2.3 Decisión clave: layout móvil propio (evidencia medida)

Escritorio (≥ 761 px): lienzo 1100×720 del spec. **Móvil: no es el escritorio reducido.** Prototipo en `docs/design/primera-pantalla-movil/prototipo-movil.html`, medido con Playwright (`medir.mjs`):

| Viewport | Resultado medido (ES) |
| --- | --- |
| 360×640 | sin scroll; resumen termina en y=568 de 640; botón de la demo en y=244–288; seis nodos en una fila de 52 px de alto mínimo |
| 390×844 | sin scroll; resumen en y=616 de 844; tarjeta visible (hay sitio) |
| 360×640 (EN, más largo) | sin scroll; resumen en y=539 |
| 320×568 (fuera de los requisitos) | tesis, nodos y botón visibles; el resumen llega a y=592 > 568 (límite conocido) |

Forma: barra compacta → retrato (96×112) **al lado** de tesis + dos líneas mono → seis nodos en una fila (icono 28 px en un botón de ≥ 52 px) → botones → resumen. La tarjeta se muestra en línea solo si la altura es ≥ 720 px; en pantallas bajas se abre como hoja superpuesta al pulsar un nodo (cierra con `Esc` o al repetir el pulsado). Cuando hay altura de sobra el retrato crece (`clamp`). Ajustes pendientes visibles en la captura: la línea mono se parte en `EN B1` (reducir espaciado o separar en dos líneas).

## 3. Interfaces & contracts

- `codePanel(ruleset, audit) -> string[]` (líneas del bloque mono, deterministas).
- `workingRules() -> { id, es, en, constitution, public }[]`; `publicRules(lang) -> string[]` (solo `public:true`).
- `home` en `src/content/site.js` (EN/ES con la misma forma): `nodes[6] {id, label, kind: 'panel'|'page', href}`, `cards.{projects,demo,journey}` con los textos aprobados del spec, `interest {sports:[…, pending(P-23)], thought}`, `projectsPage`, `journeyPage` (con `pending(P-24, P-25)`), `rulesIntro`.
- Rutas nuevas, bilingües y prerenderizadas: `/{en,es}/proyectos/`, `/{en,es}/trayectoria/`, `/{en,es}/demo/` (en inglés el segmento sigue siendo el mismo en la URL; se confirma con Dennys si prefiere `projects`/`journey`).
- Nodos: nombre accesible = etiqueta; `aria-pressed`; `aria-controls` → id del panel.

## 4. Data model & flow

Sin datos de usuario nuevos, sin API, sin D1. Flujo: build (JSON → HTML) → cliente (hidratación convierte enlaces en botones, `typewriter` anima el panel activo, elegir nodo cambia `aria-pressed`, panel y línea activa). Sin JS: `:target` y enlaces.

## 5. Testing strategy (por criterio de aceptación)

| AC | Nivel | Qué afirma | Qué simula |
| --- | --- | --- | --- |
| AC-H1 | e2e | 1180×800: retrato, seis nodos, frase y tarjeta sin scroll; 360×640 y 390×844: tesis, resumen, botón de la demo y seis nodos sin scroll, objetivos ≥ 44 px | nada (`vite preview` de `dist-e2e`) |
| AC-H2 | estática sobre `dist/` | el HTML trae la frase, seis enlaces y el texto completo de los paneles | nada |
| AC-H3 | unit + estática | el panel de Código coincide byte a byte con `ruleset.v1.json` y `static-example.json`; cambiar la regla lo rompe | nada |
| AC-H4 | unit + estática | las cuatro salidas contienen exactamente las reglas `public:true`; ninguna `public:false` | nada |
| AC-H5 | unit (tiempo inyectado) + e2e | progreso por tiempo, completo en ≤ 1,8 s; `Esc` y clic completan; reduced-motion inmediato; sin redirección | reloj inyectado |
| AC-H6 | e2e | sin `aria-live` en la tarjeta; foco visible; `axe` 0 violaciones en `/en/`, `/es/` y páginas nuevas | nada |
| AC-H7 | estática + e2e | cero peticiones a fuentes/iconos externos; sin `style=` ni `<script>` en línea; sin violaciones de CSP en consola | nada |
| AC-H8 | estática | tres páginas ×2 idiomas con `canonical`, `hreflang`, sitemap y contenido sin JS; build lista todos los `pending` | nada |
| AC-H9 | estática + Lighthouse | retrato sin EXIF/XMP, ≤ 90 KB, `srcset`; LCP ≤ 2,0 s | Chromium de Playwright |
| AC-H10 | `verify` | `bash scripts/verify.sh` en 0, `npm audit` sin altos | — |

Pruebas anti-trampa: una mutación (cambiar R-02 en una copia del JSON) debe poner rojo el panel; un `public:false` colado debe poner rojas las cuatro salidas.

## 6. Sequencing & dependencies

1. Contenido y fuentes únicas (TH01–TH08), serial y sin UI.
2. Iconos, tokens claros, reglas estáticas (TH09–TH10).
3. Primera pantalla: marcado, escritorio, móvil, interacción (TH11–TH16).
4. Escritura de paneles (TH17–TH18), paralelizable con 5.
5. Páginas nuevas, prerender, sitemap (TH19–TH20).
6. Retrato (TH21–TH22) — el archivo ya está en `docs/design/`; TH23 quedó resuelta.
7. Cierre: presupuestos, revisión adversarial, `verify` (TH24–TH27).

Restricciones duras: TH01/TH03/TH05 antes de sus implementaciones; TH19 reescribe la prueba del sitemap antes de tocar el prerender; TH22 antes de TH24.

## 7. Risks & open decisions

| # | Riesgo | Disparador / impacto | Mitigación |
| --- | --- | --- | --- |
| H-R1 | Hidratación: enlace → botón puede causar desajuste de React | aviso en consola, parpadeo | el servidor y el primer render del cliente son idénticos (`<a>`); el cambio a botón ocurre en un efecto tras montar; prueba e2e sin errores de consola |
| H-R2 | El retrato (LCP) rompe el presupuesto | LCP > 2,0 s | `fetchpriority`, dimensiones, `srcset` con versión pequeña para móvil; Lighthouse en TH24 |
| H-R3 | Contraste AA sobre los resplandores | axe falla | tokens con contraste comprobado (`--ink-2` más oscuro que el del boceto: el prototipo usa `#5F5A52`) |
| H-R4 | Retema claro rompe estilos de la demo | regresión visual | los colores salen todos de tokens (0 hex fuera); e2e y axe de la demo ya existen |
| H-R5 | Lienzo de escritorio sin probar con el retrato real | solapes de nodos | e2e a 1180×800 y 1024×768; captura revisada por Dennys |
| H-R6 | Quitar la demo de `/#demo` rompe enlaces externos | 404 de anclas | la ancla `#demo` queda en la página principal como puntero a `/demo/` |

**Abiertas para Dennys:** P-23 otros deportes; P-24 proyectos adicionales; P-25 forma y datos de Trayectoria; P-26 reglas adicionales de `working-rules.json`; ¿segmentos de URL en inglés (`projects`, `journey`)?

## Tasks
<!-- generated by tasks on 2026-10-31; IDs TH01+ are stable, do not renumber -->

Orden de ejecución: manda *Depends-on*. Una tarea "(prueba)" termina cuando la prueba falla por la razón correcta; la de implementación, cuando esa prueba y `npm test` pasan.

| ID | [P] | Task | Done-check | Depends-on | Trace |
| --- | --- | --- | --- | --- | --- |
| TH01 | | (prueba) Esquema de `content/working-rules.json`: ids únicos, `es`/`en` no vacíos, `constitution` apunta a una regla existente, `public` booleano; reglas de la constitución no publicables marcadas `public:false` | `npm test -- working-rules` falla: no existe el archivo | — | AC-H4 |
| TH02 | | Crear `content/working-rules.json` (las 6 reglas del spec §4.2 más "No AI model call per visitor click") y `scripts/lib/rules.mjs` | TH01 en verde | TH01 | AC-H4 |
| TH03 | | (prueba) `codePanel`: coincide línea a línea con R-02 de `ruleset.v1.json` y con `static-example.json`; mutar la regla en una copia pone rojo | `npm test -- code-panel` falla: no existe `scripts/lib/panels.mjs` | — | AC-H3 |
| TH04 | | Implementar `scripts/lib/panels.mjs#codePanel` | TH03 en verde | TH03 | AC-H3 |
| TH05 | | (prueba) Capa de máquinas y paneles: `llms.txt`, `dennys.json`, pestaña Personas, pestaña Máquinas y sección "Cómo trabajo" contienen exactamente las reglas `public:true`; un `public:false` colado las pone rojas | `npm test -- rules-outputs` falla | TH02 | AC-H4 |
| TH06 | | Generar esas salidas desde `working-rules.json` (`scripts/lib/machine.mjs`, `src/home/Panels.jsx`) | TH05 en verde; `test:static -- machine` en verde | TH05 | AC-H4 |
| TH07 | | (prueba) Contenido nuevo en `content.test.js`: seis nodos EN/ES con la misma forma; Interés = jiu-jitsu + `pending(P-23)` + frase del cerebro con "una idea, no una capacidad"; Proyectos y Trayectoria con `pending` P-24/P-25; sin `1,719` ni `Ecuador`; la prueba "cerebro solo en Contacto" se reescribe a "solo en Contacto e Interés" | `npm test -- content` falla | — | AC-H8, reglas 11, C2, C3 |
| TH08 | | Añadir `home`, `projectsPage` y `journeyPage` a `src/content/site.js` (sin tocar `AUTHORIZED_PENDING`) | TH07 en verde; el build de producción **falla** listando P-23 a P-25 | TH07 | AC-H8 |
| TH09 | | (prueba) Reglas estáticas: el HTML prerenderizado no trae `style="`, ni `<script>` en línea, ni dominios externos de fuentes/iconos; seis iconos `aria-hidden` con trazo 1,5 | `npm run test:static -- rules` falla sobre un ejemplo malo | — | AC-H7 |
| TH10 | | Iconos SVG en línea (`src/home/icons.jsx`) y tokens claros en `tokens.css` (papel, tinta, acento, ámbar, oliva; sin modo oscuro) | TH09 en verde; `axe` sin violaciones en `/en/` y `/es/` | TH09 | AC-H6, AC-H7, C7 |
| TH11 | | (prueba) Marcado de la primera pantalla (SSR): `h1` con la frase, seis enlaces con nombre accesible, texto de los seis paneles, retrato con `alt`, `width`, `height`, `fetchpriority`, sin `aria-live` en la tarjeta | `npm test -- first-screen` falla | TH08, TH10 | AC-H2, AC-H6 |
| TH12 | | Implementar `FirstScreen`, `Nodes`, `Panels` y CSS de escritorio (clases por nodo, SVG de líneas, flotación con reduced-motion) | TH11 en verde; captura a 1180×800 sin solapes | TH11, TH04, TH06 | AC-H1 |
| TH13 | | (prueba e2e) Sin scroll: 1180×800 (retrato, nodos, frase, tarjeta) y 360×640 y 390×844 (tesis, resumen, botón de la demo, seis nodos); objetivos ≥ 44 px; sin desplazamiento horizontal | `npm run test:e2e -- first-screen` falla | TH12 | AC-H1, AC-01 |
| TH14 | | Implementar el layout móvil propio (§2.3): retrato junto a la tesis, nodos en fila, tarjeta como hoja en pantallas bajas | TH13 en verde con las mediciones del prototipo como referencia | TH13 | AC-H1, AC-01 |
| TH15 | | (prueba e2e) Interacción: clic y teclado (Tab, Enter, Espacio) cambian `aria-pressed`, panel y línea activa; foco visible; `Esc` cierra la hoja; sin errores de consola; `axe` 0 en `/en/` y `/es/` | `npm run test:e2e -- nodes` falla | TH14 | AC-H6 |
| TH16 | | Implementar la hidratación enlace → botón y el estado del nodo activo (nodo inicial Demo, sin rotación) | TH15 en verde | TH15 | AC-H6, D-H4 |
| TH17 | [P] | (prueba) `typewriter`: progreso por tiempo inyectado; completa en ≤ 1,8 s aunque pasen pocos fotogramas; `Esc` y clic completan; reduced-motion devuelve el texto completo y sin cursor; nunca navega | `npm test -- typewriter` falla | TH10 | AC-H5 |
| TH18 | [P] | Implementar `src/home/typewriter.js` y conectarlo al panel activo | TH17 en verde; e2e: el panel termina en ≤ 2 s | TH17, TH16 | AC-H5 |
| TH19 | | (prueba) Páginas nuevas: se prerenderizan `/{en,es}/{proyectos,trayectoria,demo}/` con `canonical`, `hreflang` en/es/x-default, entrada en el sitemap y contenido sin JS; se **reescribe** la prueba que exigía solo `/en/` y `/es/` y se reapuntan los e2e y el enlace de `llms.txt` de `/#demo` a `/demo/` | `npm test -- site-static` y `test:static -- machine` fallan | TH08 | AC-H8, C4, C6 |
| TH20 | | Implementar las tres páginas, el registro de rutas en `prerender.mjs`, el sitemap, el enlace de regreso, y dejar `#demo` como puntero | TH19 en verde; Turnstile y cupos funcionan en `/demo/` (e2e real) | TH19, TH12 | AC-H8, D-H1 |
| TH21 | | (prueba) Retrato: `public/images/dennys-portrait*.webp` sin fragmentos `EXIF`/`XMP `/`ICCP` y con banderas de `VP8X` en 0 (lector RIFF propio, también contra una copia con un EXIF inyectado que debe fallar), ≤ 90 KB, ancho y alto reales, dos tamaños en `srcset`, nombre neutro | `npm test -- portrait` falla: el archivo aún no está en `public/` | — | AC-H9 |
| TH22 | | Copiar el retrato verificado a `public/images/`, generar la versión pequeña de móvil con Chromium (canvas → WebP, conserva alfa) en `scripts/make-portrait-small.mjs` y añadir el lector RIFF a `test:static` | TH21 en verde; el retrato de escritorio es byte a byte el entregado | TH21 | AC-H9, C8 |
| TH23 | | ✅ **[H]** Hecha 2026-10-31: Dennys entregó `docs/design/dennys-portrait.webp` (900×1210, 87 176 bytes); verificado sin metadatos | lector RIFF: `chunks=[VP8X,ALPH,VP8 ]`, EXIF/XMP/ICCP ausentes | — | AC-H9, C8 |
| TH24 | | Presupuestos: `test:static -- budgets`, Lighthouse móvil sobre `/en/` y `/es/` | JS ≤ 150 KB gzip, LCP ≤ 2000 ms, rendimiento ≥ 90 y accesibilidad 100 | TH12, TH14, TH22 | AC-H9, AC-16 |
| TH25 | | Limpieza: retirar el Hero antiguo y lo que deje sin uso (`governance` pasa a `working-rules.json`) | `test:static -- unused` limpio; `npm run build` en 0 | TH20 | S20 |
| TH26 | | **[H]** Dennys responde P-23 a P-26 y autoriza o resuelve cada `pending` | `AUTHORIZED_PENDING` actualizado; `NODE_ENV=production npm run build` en 0 | TH08 | AC-H8, regla 11 |
| TH27 | | Revisión adversarial (seguridad, pruebas, corrección), `verify`, e2e completo y `test:wrangler3` | `bash scripts/verify.sh` en 0; Playwright en verde; `npm run test:wrangler3` compila; hallazgos válidos corregidos con prueba | TH24, TH25 | AC-H10 |
