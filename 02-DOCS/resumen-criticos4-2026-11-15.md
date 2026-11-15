# Resumen: cuarta ronda de críticos (2026-11-15)

Capturas en `02-DOCS/capturas-criticos4-2026-11-15/`. Sin push. Un solo commit (el contenido de `site.js` mezcla varios temas).

## Qué se hizo, punto por punto

1. **Titular de la portada.** El único h1 es ahora «Software, automatizaciones, bots y agentes de IA para empresas.» (en: «Software, automation, bots and AI agents for businesses.»). «Un poco sobre mí» / «A little about me» es una etiqueta pequeña encima (`home.kicker`). Se quitó `home.offer` (la propuesta ya no se repite) y la frase inglesa larga. La línea de datos se mantiene en dos líneas, con color de texto pleno (antes atenuado) y 13 px (antes 12). Tamaños y saltos revisados en 1440x900, 390x844 y 360x640, es y en: sin palabras sueltas ni cortes (prueba e2e que mide la última línea).
2. **Portada móvil.** El lienzo es ahora una columna: texto, retrato (ocupa lo que sobra) y una franja inferior de 72 px con «Escríbeme» a la izquierda y «Desliza» a la derecha. Ninguno toca la caja del retrato; el botón se ve sin desplazar y queda en la mitad baja. Contrapartida: en 360x640 el retrato queda más pequeño (unos 250 px de ancho en es).
3. **Proyectos.** Caja más cercana: «Hoy lo usan más de 10 técnicos de la empresa.» (es/en, también en Trayectoria y en la tarjeta de Explorar). Registro de cajas, Reportes y Planificación: «En desarrollo». Planificación con el texto dado. Cada bot es una caja propia con nombre y estado en la misma línea; en las tarjetas Super Gol Kids y Criden el estado va junto al título (antes iba encima y se leía como del bot anterior). Entradilla y título: «Proyectos» / «Projects» y «Cada proyecto indica si está en producción o en desarrollo.». Tarjeta de Explorar actualizada.
4. **Cómo trabajo.** Arriba: la frase llana y las reglas para personas. Bajo «Detalle técnico» (`<details>` plegado, con teclado y lector de pantalla): reglas para máquinas/llms.txt, método, fábrica, pasos y diagrama. Nada se borró. La línea de evidencia en preparación ya no se muestra (el marcador P-04 sigue en el contenido y en el registro interno). La tarjeta de Explorar usa la frase llana.
5. **Sobre mí.** La sección es una sola línea discreta al final, sin título ni pregunta (`interestPage.longTerm.line`). El id interno `interest` no cambia.
6. **Contacto.** Frase de rol nueva (es/en). «UTC-5» ya no se muestra en la página; **sigue en `profile.timezone` y en llms.txt/datos de máquina**, y una prueba lo exige (`contact.timezone` se conserva en el contenido).
7. **Código.** Ninguna capacidad quitada. Demostradas primero, destacadas (borde verde, relleno suave, negrita); declaradas atenuadas (borde punteado, color apagado). Una leyenda única; las listas llevan su nombre accesible por `aria-label`, sin rótulo repetido.
8. **Barra interior en móvil.** Dos filas: marca/tema/idioma y una fila con las seis secciones, desplazable (`src/components/TopNav.jsx`, único JavaScript nuevo). La sección actual se centra al cargar y el borde que tiene más se difumina. Rótulos en una línea, 44 px de alto. Medido a 390 y 360 px: la barra entera mide unos 104 px (antes ~150).
9. **Pie en móvil.** El correo ocupa su fila y los demás enlaces van de dos en dos (LinkedIn|GitHub, CV|Página de contacto): sin «CV» huérfano. En escritorio los separadores «·» los pone el CSS.

## title / meta / og
No dependían del titular de la portada y no se cambiaron. Ojo: siguen diciendo «Sistemas con IA que se explican y se auditan», mientras el h1 ahora habla de software, bots y automatizaciones. Es una duda de abajo.

## Pruebas
Vitest completo: 1091 pasan. E2E (proyecto mocked, conjunto completo): 213 pasan. `test:static` y `scripts/verify.sh`: OK (el aviso de `npm audit` son 4 avisos moderados ya existentes). Se ajustaron las pruebas que fijaban textos o el diseño viejo (incluidas las de CSS de la barra, que prohibían el desplazamiento horizontal: era el diseño anterior). No se relajó ninguna de contraste, tamaño táctil ni desbordes; se añadieron pruebas nuevas de cada punto. Revisión Astra: no se pasó (solo textos, estilos y un efecto pequeño de DOM en `TopNav`, sin lógica de rutas).

## Qué no se pudo / dudas
- No corrí el proyecto «real» de Playwright (necesita wrangler/D1) ni Lighthouse; el cambio no toca el formulario.
- **Dudas para Dennys:** (a) ¿actualizar title/meta/og de la portada a la nueva propuesta? (b) El retrato móvil en 360x640 queda más pequeño para dejar la franja del botón. (c) «agentes de IA» puede partirse entre líneas en 390 px (sin palabras sueltas, pero «IA» abre línea); arreglarlo exigiría un espacio duro dentro del texto aprobado.
