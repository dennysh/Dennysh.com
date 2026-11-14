# Resumen: críticos, segunda ronda (2026-11-14)

Cinco commits locales, sin push. Revisión proporcional: vitest (1074 en verde) y e2e de las pantallas tocadas. Sin Astra, sin batería completa, sin `verify.sh` (no se tocaron rutas, `_headers` ni `_redirects`).

## Qué cambió (un commit por bloque)
1. **Barra interna en móvil** (`d1b882e`): los enlaces pasan a una segunda fila, en rejilla de 3 columnas, sin desplazamiento lateral ni difuminado. Cada enlace mide ≥ 44 px y la página actual lleva borde y color de acento. En ≤ 760 px la barra ya no es fija (`position: static`) para no comerse ~150 px de pantalla.
2. **Contacto** (`7bf5258`): correo y WhatsApp juntos en un bloque (correo primero) bajo «Puedes escribirme por correo o por WhatsApp.» / «You can write to me by email or on WhatsApp.». Quitados «Cuándo puedo empezar» (clave y marcador P-09 fuera de `AUTHORIZED_PENDING`), el recuadro «formulario no disponible» (el formulario sigue en el código; apagado solo deja un marcador oculto) y el «Interés a largo plazo». LinkedIn, GitHub y CV van como fila de botones; más aire sobre «Otras formas de contactarme». C-01 se mantiene (un único mailto en el cuerpo): la prueba no cambió de criterio, pero el botón ahora siempre está en el cuerpo.
3. **Sobre mí** (`6b3b9cc`): la tarjeta y el panel dicen la frase corta nueva; la presentación completa vive en `interestPage.intro` y es el lead de la página. Criden con el texto pedido (y su tarjeta de Proyectos). Maquetas: título propio por imagen, una por fila, rótulo de muestra una sola vez. El «(Una idea, no una capacidad.)» salió del pensamiento: el aviso queda una sola vez, en `notice`.
4. **Proyectos** (`0f877e8`, más un ajuste de alineación en el commit de cierre): la tarjeta de bots nace abierta, ocupa toda la fila (sin hueco en las vecinas), un renglón por bot (primera frase de su texto actual; «planificación» solo con nombre). En la portada la vista previa sigue cerrada.
5. **Portada** (`3282665`): la propuesta sube a 600 de peso y ~1,75 cqw en escritorio (≥ 18 px), 19 px en móvil (17 px en pantallas bajas). Mismo color de texto (AA). Zona protegida de la red intacta.

## Pruebas que pasaron
- vitest completo: 1074/1074 (hay que hacer `npm run build` antes: algunas pruebas leen `dist/`).
- e2e: contact, sections, critica-1 (incluidas barra a 390×844 y 360×640 con es/en, y maquetas), first-screen, mobile-landing, network, theme.

## Decisiones
- Maquetas SVG: su texto interno es de 14–22 px sobre 1200 px de ancho. En 390 px no se lee escalado, así que en móvil el marco se desplaza de lado (la página no) con la imagen a ≥ 820 px; en escritorio ocupa todo el ancho. Alternativa: rediseñar los SVG en vertical.
- Corregí un fallo que destapó el cambio: en «Explorar» móvil la última tarjeta no se encendía al llegar al final con el texto corto de Sobre mí; ahora al final de la página se encienden todas.
- Pruebas ajustadas por el nuevo diseño: C-01/C-07/C-09, P-09, `leadOff`, tarjeta de bots, título de maquetas.

## No probado
- Tema claro: capturas solo de la barra y la portada; el resto de páginas no se revisó en claro.
- Rutas en inglés: cubiertas por pruebas, sin capturas.
- No se pasó la batería e2e completa (timeline, privacy, contact-real, Lighthouse, Astra).
- Falta ver en un móvil real el marco desplazable de las maquetas.

## Capturas
`02-DOCS/evidencia/criticos2-{barra,contacto,sobre-mi,proyectos,portada}-es-{390,1440}-oscuro.png`; claro solo `barra` y `portada`.
