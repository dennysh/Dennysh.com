# Correcciones 1 — primera pantalla

Estado: decisiones de Dennys cerradas (2026-11-01). Lo que aún diga **[DECIDE DENNYS]** usa el valor por defecto indicado y se avisa en el informe. Reglas 18 y 19: NO hacer commit ni push, ni tocar Cloudflare o secretos, sin autorización expresa de Dennys. Entregar los cambios verdes en el árbol de trabajo y reportar.

Orden sugerido: F1/F2 (clic y centrado) → C1 (líneas) → C2/C3 (páginas y vista previa) → C4/C5 (inicio limpio y contacto) → C6/C7/C10 (textos, proyectos, capacidades) → C8/C9 (brillo y modo oscuro). Después: revisión adversarial (seguridad, pruebas, corrección) y `bash scripts/verify.sh`.

## 1. Fallos medidos en producción (1280×800, https://dennysh.com/es/)

| # | Síntoma que reporta Dennys | Causa medida |
|---|---|---|
| F1 | Pasar el mouse por Demo o Trayectoria "no deja" hacer clic; hay que ir más abajo | La barra `.bar` (z-index 6, 70 px de alto, ancho completo) cubre la parte superior de esos dos nodos. `elementFromPoint` sobre 15 puntos de cada botón: 6/15 bloqueados por `DIV.bar` en Demo y en Trayectoria; 0/15 en los otros cuatro. |
| F2 | Demo y Trayectoria "no están bien centrados" | Mismo origen: sus botones quedan en y=47 y la barra los pisa. Revisar además que el círculo y la etiqueta estén centrados sobre el punto del arco en los seis. |
| F3 | "Contacto" aparece dos veces | Barra superior "Contacto" (`#contact`), botón "Contactar" bajo la primera pantalla (y≈808), enlace "Contacto →" dentro del panel de Código y sección Contacto al final. |
| F4 | Las líneas invaden la cabeza | Las seis curvas convergen en (550,262) del lienzo, que es la coronilla del retrato (retrato en y=261–784). |

Criterio F1/F2: en 1280×800, 1440×900, 1920×1080 y 1024×768, los 15 puntos de cada nodo deben dar el propio nodo en `elementFromPoint`. Prueba automatizada.

## 2. Cambios pedidos

### C1. Líneas que no tapen la cabeza — **ELEGIDA: opción C** (Dennys, 2026-11-01)
Le gusta que se anime al pasar el mouse y que la descripción se vaya cargando a la vez (se une con C3).
Corrección que Dennys detectó en el boceto, para el desarrollo real: las líneas no salían centradas en cada nodo. Causa: en el boceto el botón se centraba sobre el conjunto círculo + etiqueta, y la línea partía de ese punto y no del centro del círculo. En la versión real: la línea parte del borde del círculo, en la dirección hacia el anillo; la etiqueta va debajo sin afectar al anclaje. El anillo debe ser concéntrico con la cabeza del retrato (tolerancia ±2 % del ancho del retrato) y los seis puntos de llegada deben ser simétricos. Prueba que mida ambas cosas.

(Opciones descartadas para referencia:)
Boceto: https://claude.ai/artifact/NBrymt4AWKg9gzTgmbUB8s
- A. Anillo tenue detrás de la cabeza; las líneas terminan en un punto del anillo.
- B. Líneas por detrás de la figura (el retrato es un recorte con alfa) que se juntan a la altura del pecho.
- C. Arco que une los seis nodos por encima; al señalar aparece el anillo y la línea de ese nodo.
Criterio: ningún trazo entra en el rectángulo de la cabeza del retrato. Con `prefers-reduced-motion`, sin animación.

### C2. Cada nodo es una página propia
Cada nodo es un `<a href>` real (funciona sin JS, regla 31) hacia su página, en ambos idiomas:
- Código → `/{es,en}/codigo/` · `/en/code/`
- Proyectos → `/es/proyectos/` · `/en/projects/` (ya existe)
- Demo → `/es/demo/` · `/en/demo/` (ya existe)
- Trayectoria → `/es/trayectoria/` · `/en/journey/` (ya existe)
- Cómo trabajo → `/es/como-trabajo/` · `/en/how-i-work/` (Dennys escribió "howiwork"; se usa `how-i-work` por defecto y se puede cambiar después con redirección)
- Contacto → `/es/contacto/` · `/en/contact/` (ver C5)
- Interés → `/es/interes/` · `/en/interest/`
Cada página nueva incluye la barra, "Volver" y su contenido actual (el que hoy está en el panel o en la sección larga del inicio).

### C3. Vista previa al pasar el mouse (no al hacer clic)
- Pasar el mouse (o enfocar con teclado) sobre un nodo muestra su panel en la portada. Clic o Enter lleva a su página.
- El panel se queda abierto mientras el puntero está sobre el nodo o sobre el panel, para poder usar sus pestañas.
- Cada nodo muestra su sección al pasar el mouse; p. ej. Proyectos muestra "Trabajo en producción" (ver C7).
- Cómo trabajo: pestañas **Personas / Máquinas**, como ya acordado (Máquinas = `llms.txt`, visible).
- Táctil: primer toque abre la vista previa con botón "Abrir página"; segundo toque o botón navega.
- Retraso de intención ~120 ms; sin salto de layout; texto escrito ≤1,8 s; `Esc` cierra; aria-live solo para los 4 cambios permitidos (regla 30).

### C4. El inicio es solo la primera pantalla — DECIDIDO
Hoy el inicio mide ≈5800 px con 9 secciones (`demo`, `factory`, `governance`, `work`, `skills`, `journey`, `criden`, `contact`, pie). Dennys: "una sola página conmigo", limpia. El inicio queda únicamente con la primera pantalla (sin pie ni contacto). El contenido de cada sección pasa a la página que le corresponde; la Factory propone el reparto en su plan y NO borra contenido (si una sección no tiene página clara, la lista como pregunta).

### C5. Contacto — DECIDIDO
- El inicio no lleva "Contacto" ni "Contactar" (intro limpia). La barra del inicio conserva CV, idioma y el interruptor de tema (C9).
- Las demás páginas (Código, Proyectos, Demo, Trayectoria, Cómo trabajo, Interés) llevan un pie con los contactos (dennys@dennysh.com, LinkedIn y los que ya existen en la sección Contacto actual).
- Además, una página propia `/{es,en}/contacto/` · `/en/contact/` con la sección Contacto actual (formulario y protecciones incluidas, sin perder ninguna: Turnstile, límites).
- Quitar el botón "Contactar" bajo la primera pantalla y el enlace "Contacto →" del panel de Código.
- Aviso a Dennys en el informe: sin contacto visible en el inicio, un reclutador llega al contacto por las páginas internas o por CV; dejarlo como está salvo que Dennys diga otra cosa.

### C6. Textos
- **Decidido por Dennys (2026-11-01): no hay titular.** El único texto principal es "Un poco de lo que hago, en pocos minutos." / "A little of what I do, in a few minutes." Esa frase pasa a ser el único `<h1>` de la portada (accesibilidad y una sola jerarquía), en tamaño de titular. Se elimina "Construyo sistemas con IA que se explican y se auditan" de la vista.
- Se mantiene (salvo que Dennys diga lo contrario): línea de datos ("7 años en fibra óptica · remoto · UTC-5 · español nativo · inglés B1") y tarjeta "Demo en vivo".
- `<title>` y meta description descriptivos para buscadores se conservan; no es texto visible **[DECIDE DENNYS: confirmar o cambiar]**.
- Quitar deportes (jiu-jitsu, triatlón) de todas partes (portada, panel, página, `llms.txt`, `dennys.json`, pruebas). Naunturia no se menciona (no aprobada). El nodo Interés **se queda**, solo con el pensamiento cerebro–IA; Dennys añadirá más después. Interés sigue siendo página propia.
- Resolver la deriva de pruebas: las pruebas atadas al texto de deportes (P-23/24/25) se reescriben, no se borran sin más.

### C7. Página Proyectos
**ACTUALIZACIÓN (Dennys, 2026-10-31 noche) — manda sobre lo que sigue:**
- Al pasar el mouse por **Proyectos** el panel de la portada muestra **"Trabajo en producción" / "Work in production"** (es el texto que ya existe en `projects.title` de `src/content/site.js`). Clic lleva a `/es/proyectos/` · `/en/projects/`.
- **QUITAR** de todo lo público (página Proyectos, `llms.txt`, `dennys.json`, resumen/CV JSON, pruebas): "Sistema contable · React + Flask" (`contable`), "Football Manager" (`futbol`) y "HARDLOCK · Android/Kotlin" (`hardlock`). **Solo esos tres**; no quitar nada más. Las pruebas que dependan de ellos se reescriben, no se borran sin más.
- Por tanto, el Accounting System **ya no se añade** (anula la lista de más abajo).
- **AÑADIR Criden** a "Trabajo en producción / Work in production" como un elemento más de esa lista y de la página Proyectos (hoy Criden solo es la sección `criden` del inicio, con el enlace pendiente P-22; esa sección sale del inicio por C4). Texto: solo lo que ya dice el sitio ("Para negocios y páginas web: Criden. Producto aparte de este sitio.") y su enlace. Si la dirección de Criden o su estado (producción o desarrollo) no constan en el repositorio o en `02-DOCS/preguntas-pendientes-dennys.md`, NO inventarlos: dejar el marcador `pending` fuera del HTML público y anotarlo como pregunta para Dennys en el informe.

(Versión anterior de C7, para referencia:)
Hoy lista: Bot de Telegram · Caja Cercana y Super Gol Kids. Football Manager y HARDLOCK no están publicados y no se añaden.
Dennys indica que están funcionando y se pueden poner:
- Bot de Telegram de reportes.
- Bot Registry.
- ~~Accounting System (React + Flask), hecho para el sitio de Super Gol Kids.~~ (anulado: ahora se quita, ver arriba)
Descripciones: una línea por proyecto, usando solo lo que dijo Dennys ("en funcionamiento"; el Accounting System, "hecho para el sitio de Super Gol Kids"). Cualquier detalle extra (tecnologías, fechas, cifras, repositorio) con marcador `pending` que NO salga en el HTML público (regla 11 y compuerta de pending actual).
Trabajos de telecom (despliegue de red en Macas, rutas nuevas, levantamiento de información, localidades nuevas): NO se incluyen en esta tanda; Dennys aún no confirmó si ponerlos ni dónde. Se deja anotado como pregunta pendiente en `02-DOCS/preguntas-pendientes-dennys.md`.

### C8. Brillo naranja detrás del retrato (medido)
Producción (`.first`): `radial-gradient(48% 38% at 52% 34%, rgb(217 130 43 / .16), transparent 70%)`. El boceto aprobado usaba `closest-side` con `rgba(229,67,45,.34)` → `rgba(217,130,43,.22)` al 50 % → `rgba(232,185,61,.08)` al 80 %. En producción es la mitad de intensidad y sin el rojo, por eso se ve casi blanco. Igualar el brillo del boceto, centrado detrás del retrato, y comprobar contraste AA del texto sobre el brillo.

### C9. Modo oscuro con interruptor
Hoy no existe: `color-scheme: light` fijo y ninguna regla `prefers-color-scheme`. Pedir:
- Paleta oscura completa por tokens (referencia: la del boceto de líneas) con brillo naranja más fuerte.
- Botón en la barra superior (ícono sol/luna inline, `aria-pressed`, etiqueta accesible). Por defecto sigue al sistema; el clic fuerza claro u oscuro.
- Preferencia guardada en `localStorage` (con try/catch) y aplicada con un script externo mínimo en `<head>` para evitar parpadeo (CSP sin `unsafe-inline`). Sin JS sigue funcionando por `prefers-color-scheme`.
- Contraste AA verificado en los dos temas; retrato, líneas y paneles revisados en oscuro.

### C10. Capacidades (página Código)
Hoy: "Bots y automatización" (Python, Bots de Telegram, SQLite, pytest · Webhooks, APIs REST) y "Sistemas con IA" (APIs de LLM, Claude, OpenAI, Gemini, Whisper, Agentes de IA, todo *declarado*).
- **Respuesta de Dennys (2026-11-01):** "Bots autónomos" NO se pone (sus bots responden a una orden, no actúan solos). "Aprendizaje profundo/continuo": NO se pone (solo uso rápido, sin énfasis). Agentes: ha programado chats que responden preguntas, p. ej. un chat de atención al cliente para un ISP que nunca llegó a producción.
- **Corrección de Dennys (posterior):** el chat de atención al cliente de un ISP respondía y además consultaba datos del cliente (saldo pendiente de pago). Quería darle acceso a lecturas de potencias ópticas, de uso interno para soporte y área técnica **[DECIDE DENNYS: ¿se construyó o solo se planeó?]**. Nunca llegó a producción.
  Por tanto (revisa la versión anterior, que decía quitar "Agentes de IA"): se mantiene "Agentes de IA" como *declarado*, redactado de forma acotada: "Asistente conversacional con acceso de solo lectura a datos de clientes (prototipo, sin producción)". Añadir además "Chatbots con LLM" y "LLM". Las potencias ópticas NO se mencionan (decidido por Dennys). Sin nombre de empresa ni datos de clientes.
- (Descartado) Quitar "Agentes de IA": ya no aplica porque el chat usaba datos.
- El chat del ISP, si se menciona: "asistente de atención al cliente para un ISP, prototipo que no llegó a producción", sin nombre de empresa salvo autorización expresa (regla 11, y trabajo no publicado).
- (Versión anterior, descartada:) Añadir "Agentes de IA" también en Bots y automatización y "Bots autónomos".
- Añadir "LLM" como capacidad propia, además de "APIs de LLM".
- "Aprendizaje profundo" y "aprendizaje continuo": solo si Dennys los ha usado de verdad (entrenar o ajustar modelos). Si no, no se ponen (regla 11). "Aprender de forma continua" como rasgo personal va en Cómo trabajo o Interés, no como capacidad técnica **[DECIDE DENNYS]**.
- Cada ítem nuevo entra como "declarado" salvo que haya prueba pública.

## 3. Restricciones que se mantienen
Constitución v1.1.0: sin fuentes ni íconos externos, CSP sin `unsafe-inline`, JS ≤150 KB gzip, LCP ≤2 s, primera pantalla en 360×640 (AC-01), sin Co-Authored-By, sin push sin autorización.

## 4. Controles de seguridad previstos
S18 (cabeceras de las páginas nuevas), S19 (rutas nuevas bajo HTTPS), S15 (texto de paneles insertado como texto), S20 (`npm audit` en verify.sh). No tocan datos ni secretos.
