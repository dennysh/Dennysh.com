# Resumen de la noche · 2026-11-09

Dos trabajos, en este orden. **Sin commit y sin push** (no autorizados). El árbol ya traía sin commitear el cambio del anillo y el de quitar la Demo: se dejaron como estaban. `.rsc.json` modificado no es de esta noche. No se tocó panel-proyectos, Cloudflare, el túnel ni claves.

## Estado final (todo en verde, de principio a fin)

| Comprobación | Resultado |
| --- | --- |
| `npx vitest run` | **1011 pruebas, 59 archivos, verdes** |
| `npm run test:e2e` (mocked + real, completa) | **160 verdes** al cerrar A y **160 verdes** al cerrar B |
| `bash scripts/verify.sh` | `verify OK` tras A y tras B (los avisos de `npm audit` son de `lighthouse`, herramienta de desarrollo, como antes) |
| Mutantes | A: si `quiet()` devuelve 1, la prueba por píxeles falla. B: si una foto sin ruta cuenta como foto, `journey-page.test.js` falla |

## Trabajo A · Red de fondo

Portada tal cual la maqueta aprobada (`/tmp/red-referencia.html`): intensidad fija nº 2 «Sutil», `PRESETS`, `quiet()`, `lit()` con la curva `min(1, s·1,7)`, atracción hacia el puntero, relleno tenue de triángulos, puntos tenues en reposo y apagado suave. Spec con decisiones y medidas: `docs/superpowers/specs/2026-11-09-red-de-fondo.md`.

- **Zona protegida desde `geometry.js`** (elipse que contiene la caja de la cabeza + franja del cuerpo de 0,20 a 0,50 del ancho del retrato). Un cambio respecto a la maqueta, solo donde el requisito lo exige: los tramos intermedios de cada segmento (no solo los extremos) también respetan la zona; sin eso un segmento de 140 px podía cruzar la cabeza.
- **Capas:** brillo → red → líneas y anillo → retrato → nodos y paneles. Canvas `pointer-events: none`, eventos escuchados en `.canvas`. El anillo sigue detrás del retrato.
- **Color** leído de `--accent` (claro y oscuro) con reacción al cambio de tema. **Solo cliente y solo puntero fino** (`hover: hover` + `pointer: fine` + ≥ 761 px); en táctil/móvil no hay canvas. `prefers-reduced-motion`: sin bucle, se dibuja al mover el puntero. Pausa con pestaña oculta y fuera de pantalla, DPR ≤ 2, limpieza de listeners y `requestAnimationFrame`.
- **Medidas:** JS inicial gzip 72,53 → 75,02 kB (**+2,5 kB**; presupuesto 150 kB). Coste por cuadro ≈ **1,0 ms** (lógica, 170 puntos). Un recorrido del puntero por todo el lienzo en Chromium: **0 tareas largas**.
- **Medición por píxeles (e2e):** tras recorrer el lienzo, alfa máxima sobre la cara = 0 y sobre el cuerpo = 0; en el resto sí se dibuja.

**Archivos de A** (parche `02-DOCS/parches/A-red-de-fondo.patch`): `src/home/network.js`, `src/home/NetworkBackground.jsx` (nuevos); `src/home/FirstScreen.jsx` (+2 líneas), `src/styles/home.css` (regla `.net` y móvil); `tests/unit/network.test.js`, `tests/unit/network-component.test.js`, `tests/e2e/network.spec.js` (nuevos); `tests/unit/a11y-css.test.js`; spec nuevo `docs/superpowers/specs/2026-11-09-red-de-fondo.md`; `CLAUDE.md` (1 párrafo); capturas `red-*.png`.

**Capturas A** (`02-DOCS/evidencia/`): `red-reposo-light|dark.png`, `red-encendida-light|dark.png` (puntero junto a Código), `red-cara-light|dark.png` (puntero sobre la cara: la red se queda fuera de cabeza y cuerpo).

## Trabajo B · Trayectoria como línea de tiempo

Según `/tmp/encargo-trayectoria.txt`. Fechas a la izquierda; cargo · empresa, lo destacado y etiquetas a la derecha; una miniatura por entrada que se amplía en un diálogo modal (foco atrapado, Esc, ‹ ›, flechas, clic fuera). Siete entradas, solo del CV público y **sin Referencias**: Bot Caja Cercana (2025), Super Gol Kids (En producción), ISMAC (Sep 2023 – Presente), Fibratelecom (Mar 2023 – Presente), MS@Net, Afiatic, Telydata. Spec: `docs/superpowers/specs/2026-11-09-trayectoria-linea-de-tiempo.md`.

Decisiones que conviene que mires (todas con cómo revertir en el spec):
- **Super Gol Kids sin año:** no está en el CV ni en el sitio; su columna dice «En producción» y no se inventa fecha (por eso no hizo falta un `pending` nuevo). Va arriba, junto al bot.
- **Se nombran las empresas del CV** (el encargo las nombra; antes P-29 pedía no nombrar la de fibra). Anotado en `preguntas-pendientes-dennys.md`.
- **No se atenúan las otras entradas al pasar el puntero** (era opcional; rebajaba el contraste y dependía del hover). Se resalta la entrada: título en el acento y punto relleno.
- Se conservan las cuatro líneas de la trayectoria como introducción (texto aprobado, fijado por pruebas).
- Se **borró** lo que quedó sin uso: `RowGallery.jsx`, `gallery-logic.js`, `gallery-logic.test.js`, `gallery.spec.js`, estilos `.g-*`. Se recuperan con el parche inverso (abajo) o `git checkout`.
- Nodo y tarjeta de Trayectoria de la primera pantalla: sin cambios.

**Fotos (pendiente):** hoy no hay ninguna y la página se ve completa. Cada una se declara en `src/content/journey-photos.js` (ruta WebP, `thumb` opcional, `width`/`height`, `alt` es/en obligatorio); una prueba valida que el archivo exista, el formato, el tamaño y el alt. Guía corta: `02-DOCS/guia-fotos-trayectoria.md`. P-29 sigue pendiente y autorizado.

**Medidas B:** JS inicial gzip 75,0 → 75,7 kB (+0,7 kB). axe sin violaciones en es/en × claro/oscuro, con la página y con el diálogo abierto. Móvil 360 y 390: una columna, sin desborde, miniaturas ≥ 44 px.

**Archivos de B** (parche `02-DOCS/parches/B-trayectoria.patch`): `src/components/Timeline.jsx`, `src/content/journey-photos.js`, `tests/e2e/timeline.spec.js`, spec y guía (nuevos); `src/content/site.js`, `src/pages/Pages.jsx`, `src/styles/home.css`, `tests/unit/{content,journey-page,pages}.test.js`, `preguntas-pendientes-dennys.md`, `CLAUDE.md`, `2026-10-31-primera-pantalla-design.md` (enmienda); eliminados `RowGallery.jsx`, `gallery-logic.js`, `gallery-logic.test.js`, `gallery.spec.js`; capturas `trayectoria-*.png`.

**Capturas B:** `trayectoria-sin-fotos-light|dark.png` (lo que se publicaría hoy), `trayectoria-con-fotos-light|dark.png` (con fotos de relleno de la compilación de pruebas), `trayectoria-ampliacion-light.png`, `trayectoria-movil-390-sin-fotos.png`, `trayectoria-movil-360-con-fotos-dark.png`, `trayectoria-en-light.png`.

## Cómo deshacer cada trabajo

Los parches se hicieron con `git diff --binary` entre instantáneas del árbol (sin commit): **A** = lo que cambió entre el árbol de partida de la noche y el cierre de A; **B** = lo que cambió después. No incluyen el cambio del anillo ni el de quitar la Demo (siguen en el árbol). Comprobado en una copia: aplicar los dos inversos, **primero B y luego A**, devuelve exactamente el árbol de partida.

```bash
cd ~/projects/dennysh
git apply -R --binary 02-DOCS/parches/B-trayectoria.patch     # deshace B (si solo quieres B)
git apply -R --binary 02-DOCS/parches/A-red-de-fondo.patch    # deshace A (después de B, o solo si no tocas B)
```

Para quedarte con uno solo, aplica el inverso del otro. Si algún día se commitean A y B por separado, el orden natural es A y luego B (B toca `CLAUDE.md` y `home.css` también).

## Pendiente para ti

1. **Fotos de Trayectoria** (P-29): llegan después; ver la guía.
2. **Año de Super Gol Kids** si quieres que ocupe su lugar cronológico.
3. **Textos legales** de la Demo (de la tanda anterior) siguen sin revisar.
4. **Commits y push:** nada está commiteado (anillo, quitar la Demo, A y B). Lo decides tú.
5. **Sin hacer esta noche:** barrido del worklog hacia la wiki y la fusión manual de los conflictos de `02-DOCS/wiki` con `rsc/knowledge` (siguen); `02-DOCS/wiki/sdd/decisions.md` aún menciona la galería por fila (no se tocó por esos conflictos).
6. Móvil de la primera pantalla: la red no se monta (sin cambios visibles); mirarlo en un teléfono real sigue pendiente, solo se probó con Chromium emulado.
