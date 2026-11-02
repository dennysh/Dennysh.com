# Crítica Impeccable 1 · primera pantalla y páginas nuevas

Fecha: 2026-11-02 · Alcance: inicio y las 7 páginas (es), inicio y contacto (en), tema claro y oscuro, escritorio 1440×900 y móvil 390×844 · Solo diagnóstico en esta fase.

Método: dual-agent, aislados (A: revisión de diseño con capturas; B: detector `impeccable detect` + medidas de navegador). No se guardó snapshot en `.impeccable/` (la orden fijó este archivo como único destino).
Limitaciones: A vio con detalle inicio (4 variantes) y las páginas de es, y midió por script las 36 capturas; no abrió una por una las capturas de en ni todas las móviles de interiores. B necesitó Chromium con `--no-sandbox` (las 18 pasadas de URL salieron bien con ese ajuste). La falta de `PRODUCT.md` impide comprobar la intención de marca; se usó el sitio como autoridad.

## Veredicto

La primera pantalla tiene identidad propia: retrato real, brillo cálido, arco de seis nodos y línea con anillo al señalar. Las siete páginas interiores son una plantilla genérica y rompen esa identidad (sans de sistema, tarjetas beige, enlace "Volver"). Puntuación de Nielsen, renormalizada sobre 8 (7 y 10 no aplican a un portafolio): **2,75 / 4 (69 %)**, "Aceptable alto". Carga cognitiva: 5/8 fallos en inicio, 3/8 en interiores.

Medidas sin fallo (B): 0 errores de consola, 0 peticiones fallidas, 0 imágenes sin `alt`, un `h1` por página, `lang` correcto, ningún desborde horizontal, foco visible en todo lo enfocable, contraste correcto en todo texto visible salvo el enlace de salto con foco.

## Prioridades

Leyenda de acción: **Aplicar** (crítico/alto o barato y seguro) · **Aplazar** (caro o con riesgo; queda para Dennys) · **Cerrado** (choca con una decisión de contenido ya tomada; no se toca).

### P1 · Altos

**C-01 · Contacto desactivado: promesa y negación a la vez** (A) — Aplicar
- Evidencia: `/es/contacto/`. El texto introductorio promete "pasos cortos" y debajo dice "El formulario no está disponible". El correo se repite 3 veces. Queda un chip punteado "por confirmar" sin etiqueta.
- Por qué importa: es la acción de conversión del sitio.
- Corrección: con el formulario apagado, un texto que no prometa pasos; un único botón primario de correo; etiquetar o quitar el chip; convertir los párrafos sueltos en lista con etiquetas. Con el formulario activo, el texto actual se conserva.
- Comando: `clarify` + `layout`.

**C-02 · "Bots para Telegram" en Proyectos parece una tarjeta rota** (A) — Aplicar
- Evidencia: `/es/proyectos/`. Es un `<details>` cerrado con solo el título y ~120 px vacíos; las otras tarjetas tienen insignia, texto y enlace.
- Corrección: abrirlo por defecto (sin JS sigue funcionando) o darle cuerpo de tarjeta con la insignia "En producción" y un resumen. Se conserva la decisión D2 (un solo elemento que encapsula los bots).
- Comando: `layout`.

**C-03 · Panel de vista previa: contenido cortado y acción oculta** (A) — Aplicar
- Evidencia: hover de Código (el bloque se corta) y de Cómo trabajo en oscuro (el botón "Abrir" y la etiqueta quedan bajo el scroll interno del panel).
- Corrección: que el pie del panel (etiqueta + botón) quede siempre visible (`position: sticky` abajo) y que el cuerpo haga scroll; o acortar el contenido. No cambia ningún texto.
- Comando: `layout`.

**C-04 · Páginas interiores intercambiables** (A) — Aplicar en parte
- Evidencia: marca "DENNYSH" mono en inicio y "Dennys Heras" en negrita en interiores; sin brillo, sin mono; 60 % de viewport vacío en Interés y Demo.
- Corrección aplicable: etiqueta de sección en mono sobre el `h1`, brillo cálido de fondo heredado del inicio, misma marca en todo el sitio. 
- Aplazar: tipografía autoalojada (hay que escoger y licenciar una fuente; sin internet no se puede validar) y la miniatura del retrato en cabecera (cambia identidad visual: decide Dennys).
- Comando: `typeset` + `colorize`.

### P1 · Accesibilidad (B)

**C-05 · Enlace de salto con foco sin contraste** — Aplicar
- Evidencia: `div.bar > a.skip` con foco en inicio: 2,78:1 (claro) y 2,12:1 (oscuro). Las subpáginas sí cumplen.
- Corrección: usar los pares de tokens que ya cumplen (texto blanco sobre acento en claro; texto oscuro sobre acento claro en oscuro).

**C-06 · Salto de encabezados en Proyectos** — Aplicar
- Evidencia: `/es/proyectos/`: h1 → h3 ("Bots para Telegram").
- Corrección: el título del `<summary>` pasa a h2 (o se ajusta la jerarquía de la página).

**C-07 · Objetivos táctiles pequeños en móvil** — Aplicar
- Evidencia (B, <44 px): marca de las subpáginas 124×25; enlaces de la navegación 33 px; `summary` de Bots 32; en el inicio, enlaces de la barra 24–27 px y botón del panel 32 px. Pie y enlaces de cuerpo: 19 px.
- Corrección: altura mínima 44 px en navegación, botones y `summary`; en el pie, relleno vertical. Los enlaces dentro de párrafos quedan exentos (WCAG 2.5.8) y no se tocan.

**C-08 · Texto menor de 12 px** — Aplicar
- Evidencia (B): etiquetas de nodo 10 px (móvil), tagline 10,5 px (móvil) y 11,78 px (escritorio), `.opens` 11 px, insignia "En producción" 11,52 px, barra superior 11 px en móvil.
- Corrección: suelo de 12 px en todos (sube la medida de lectura sin cambiar el texto).
- Riesgo: el prototipo móvil está medido (docs/design/primera-pantalla-movil); se revisa en capturas que las etiquetas sigan cabiendo.

**C-09 · Navegación móvil de 7 enlaces con scroll horizontal sin indicación** — Aplicar
- Evidencia: A y B. `nav[aria-label="Secciones"]` mide 601 px de contenido en 358; "Cómo trabajo" y "Contacto" quedan fuera de vista.
- Corrección: degradado en el borde derecho (indica que hay más) y que el enlace de la página actual quede visible al cargar. Alternativa mayor (menú desplegable): aplazar.

### P2 · Medios

**C-10 · Primera pantalla móvil con la mitad vacía** (A) — Aplazar
- Retrato de 96 px, nodos de 28 px, 55 % de la pantalla de 844 px sin contenido. La corrección (retrato grande, nodos en 3×2) rehace el prototipo móvil medido y toca la geometría de las líneas: es la tarea de diseño más grande y la menos segura de hacer sin supervisión.
- Parte barata a aplicar: desactivar la animación `float` bajo 760 px (etiquetas desalineadas) y el suelo de 12 px (C-08).

**C-11 · Diagrama de "La fábrica de agentes" ilegible en móvil** (A) — Aplicar
- Texto de ~4 px; repite las tarjetas de debajo. Corrección: ocultar el diagrama bajo 600 px (las tarjetas dicen lo mismo). Lo ocultado sigue en el HTML para lectores y para la capa de máquinas.

**C-12 · "Cómo trabajo" demasiado larga y con dos títulos casi iguales** (A) — Aplazar
- 3031 px en móvil; "Cómo trabajo" y "Cómo trabajo con IA" seguidos. Reordenar o plegar contenido toca textos cerrados.

**C-13 · Trayectoria con contenido duplicado** (A) — Cerrado
- "7 años" aparece 3 veces y la lista repite las filas. Son textos ya aprobados en los specs; se anota para que Dennys decida si fusionarlos.

**C-14 · `.pending` parece un error** (A) — Aplicar
- Borde punteado y fondo rojizo en avisos como "La evidencia pública está en preparación". Corrección: nota atenuada sin borde ni fondo de error. El texto no cambia.

**C-15 · Estado de Demo sin resultado de ejemplo** (A) — Aplazar
- Solo un botón; el reclutador no ve nada sin pulsar. Mostrar un ejemplo precalculado es cambio de contenido de la demo (decisión de producto).

**C-16 · "INGLÉS B1" toca el hombro del retrato en 1440×900 y quedan 117 px vacíos bajo el lienzo** (A) — Aplazar
- Toca la composición medida (geometría de líneas y panel). Dejado para Dennys con captura.

### P3 · Bajos

- **C-17 · Detector `side-tab`** en `.rules li` (`site.css:48`, borde izquierdo de 3 px en tarjeta): real. Aplicar: borde completo o quitar el borde lateral.
- **C-18 · Detector `cream-palette`** (fondo `rgb(246,243,238)`): decisión de color del sistema de diseño ya aprobada; no se toca. Cerrado.
- **C-19 · Detector `straggler`** (palabra suelta en la última línea de varios párrafos): Aplicar `text-wrap: pretty` en párrafos de lectura (sin cambiar texto). Si algún navegador no lo soporta, queda como estaba.
- **C-20 · Detector `line-length`** (~87 caracteres en un párrafo de Cómo trabajo): Aplicar `max-width: 68ch` al texto de lectura.
- **C-21 · Marca duplicada** ("DENNYSH" / "Dennys Heras"): se unifica con C-04.
- **C-22 · "Volver a la primera pantalla" repetido** y enlaces de pie: Aplazar (la cabecera ya enlaza al inicio; quitarlo es decisión de navegación).
- **C-23 · Orden de Tab en inicio** (barra antes que los nodos): Aplazar; cambiar el orden del DOM afecta lectores de pantalla y la geometría.
- **C-24 · Animación `float` perpetua en los nodos**: Aplicar parando la animación al pasar el ratón o enfocar; ya respeta `prefers-reduced-motion`.
- **C-25 · Landmarks del inicio** (sin `header` ni `footer`, solo dos `nav`): Cerrado; el inicio es solo primera pantalla por decisión.
- **C-26 · Pie de la 5.ª tarjeta suelta** en "Cómo trabajo" (3+2 desbalanceado): Aplicar con una rejilla que reparta 3+2 en dos filas centradas.

### Decisiones cerradas que la crítica cuestiona (no se tocan; solo se registran)

- Una frase de rol buscado y disponibilidad en el inicio (el inicio lleva una frase única).
- "Declarado" en 14 de 16 tecnologías y el contenido de Código (capacidades cerradas).
- Reducir las siete páginas o fundir Contacto en el inicio (estructura cerrada: cada nodo es una página).
- El CV como única acción clara: se mejora su tamaño táctil (C-07), no su prominencia.

## Preguntas para Dennys

1. ¿Quieres la miniatura del retrato junto a la marca en las páginas interiores? (C-04)
2. ¿Prefieres un menú desplegable en móvil o el degradado en la barra de 7 enlaces? (C-09)
3. ¿Mostramos un resultado de ejemplo en Demo antes de pulsar? (C-15)
4. ¿Rehacemos la primera pantalla móvil con retrato grande y nodos en 3×2? (C-10)

## Orden de aplicación esta noche

1. Contacto (C-01) · 2. Proyectos (C-02, C-06) · 3. Panel de vista previa (C-03) · 4. Accesibilidad (C-05, C-07, C-08, C-09, C-24) · 5. Identidad de interiores (C-04 parte, C-14, C-17, C-19, C-20, C-26, C-11) · 6. Aplazado: C-10, C-12, C-13, C-15, C-16, C-22, C-23.

## Estado de aplicación (actualizado la noche del 2026-11-02)

| Hallazgo | Estado | Commit |
|---|---|---|
| C-01 Contacto apagado | Aplicado | `4465c14` |
| C-02 Tarjeta de Bots, C-06 saltos de encabezado | Aplicado (la tarjeta sigue cerrada al cargar, con la pista "Ver los N bots"; ver A-05) | `a9e52a1` |
| C-03 Panel de vista previa | Aplicado | `a955939` |
| C-05, C-07, C-08, C-09, C-24 Accesibilidad | Aplicado (la etiqueta de nodo móvil sigue en 10 px; ver A-06) | `949f30a`, `e37c2fb` |
| C-04 Identidad de interiores | Aplicado en parte: marca en mono y brillo; sin fuente nueva ni retrato en cabecera (A-07) | `a0d0080` |
| C-11, C-14, C-17, C-19, C-20, C-26 | Aplicado | `a0d0080` |
| C-10, C-12, C-13, C-15, C-16, C-22, C-23 | Aplazado: decide Dennys | n/a |
| C-18, C-25 | Cerrado (decisión previa) | n/a |
