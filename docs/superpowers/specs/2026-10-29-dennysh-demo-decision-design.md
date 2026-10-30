# dennysh.com: diseño de la demo de decisión automatizada y del sitio que la rodea

- Fecha: 2026-10-29
- Estado: **Diseño aprobado por Dennys (confirmado en su chat). `clarify` aplicado el 2026-10-29. Sigue sin haber código de producto.**
- Las preguntas P-01 a P-18 (`02-DOCS/preguntas-pendientes-dennys.md`) **siguen siendo de Dennys y no están respondidas**. El documento usa la recomendación por defecto de cada una, marcada como *supuesto por confirmar* (sección 16).
- Siguiente paso: `plan` → `tasks` → `analyze` → `implement` (cadena SDD del arnés RSC).
- Puerta pendiente: la constitución (`02-DOCS/wiki/sdd/constitution.md`) sigue en borrador. Decisión del dueño: diseño primero, constitución después. **Debe ratificarse antes de `implement`** (P-14). Tampoco hay commit ni push autorizados (P-13).

## 0. Cómo se verificó esta base

| Hecho | Cómo se comprobó | Estado |
|---|---|---|
| Arnés RSC instalado (`.rsc.json`, `.claude/`, hooks, 32 skills, 7 agentes, catálogo 3.6.0) | Leído; `rsc doctor` → `healthy: true` | Verificado |
| Constitución | Existe pero `status: draft`, secciones vacías | Pendiente (ver arriba) |
| Arnés sin commit en git | Aviso del hook de sesión; `.rsc.json`, `.claude/`, `01-TOOLS/`, `02-DOCS/` sin trackear | Pendiente, requiere orden de Dennys |
| Repo de la laptop = `origin/main` = `b616bb9` | `git fetch` | Verificado |
| Reglas globales de seguridad (`~/.claude/CLAUDE.md`) | **No existe en la laptop.** Se aplicó la lista de respaldo S1, S3, S4, S6, S8, S9, S11–S15, S17–S20 | Ver sección 10 y pregunta P-03 |
| Copia de solo lectura del código de la PC (`~/projects/_pc-snapshot`) | Consultada **solo** para `src/data/content.js`, `src/data/projects.js`, `public/_headers`. No se copió nada | Verificado |

**Alcance de "diseñar de cero" (aclaración de Dennys):** vale para el diseño visual, la estructura de la página y el orden de secciones. No se hereda el layout actual ni ninguna lista de componentes "que salen o se quedan". Los **datos** sí son los que ya existen (sección 3). Todo lo que no esté en esos archivos ni en el prompt es **marcador por confirmar**: no se inventan trabajos, proyectos, cifras ni clientes.

## 1. Propósito y mensaje

dennysh.com es una **carta de presentación para que una empresa de vanguardia me contrate**. No es el sitio comercial de Criden (clientes finales y páginas web). Entrar a una empresa así me hará mejorar Criden.

Mensaje central, en una frase:

> Diseño y construyo sistemas con IA que se pueden gobernar: límites claros, revisión automática, supervisión humana y trazabilidad. No solo uso chatbots.

Prueba que ya existe: una **fábrica de software con agentes** (orquestador de Claude Code en una laptop Ubuntu, tareas delegadas con límites, revisiones automáticas, túnel y acceso con Cloudflare, verificación humana de lo que reportan los agentes).

**Criterio de éxito:** un reclutador (o su agente) entiende en 30 segundos quién soy y qué sé hacer, ve una prueba funcionando, y tiene un camino claro para contactarme.

**Qué lo haría fallar** (se usan como criterios de rechazo en revisión):
1. Un efecto vistoso que no demuestra lo que ofrezco (la página "templo" desfasada).
2. Que parezca un dashboard falso, un adorno o una herramienta de ataque.
3. Cualquier afirmación que no pueda respaldar con evidencia.

## 2. Visitantes y qué necesita cada uno

| Visitante | Qué busca | Qué le damos |
|---|---|---|
| Reclutador / hiring manager | Decidir en 1–2 minutos si me llama | Resumen claro arriba, demo de 30 s, prueba verificable, contacto directo |
| Ingeniero revisor | Ver criterio técnico real | Arquitectura de la fábrica, reglas de la demo, enlaces al repo y a este diseño |
| Bot / agente de búsqueda | Datos extraíbles sin ejecutar JS | HTML prerenderizado, JSON-LD, `llms.txt`, perfil JSON, sitemap |

## 3. Datos reales disponibles y su uso

Fuente: `src/data/content.js` y `src/data/projects.js`, en el repo (`b616bb9`) y en la copia de la PC. Los dos difieren; la copia de la PC es más reciente y más cautelosa con las cifras. **Regla:** se usa solo lo que coincide en ambas o lo que Dennys dio en el prompt; las diferencias quedan como pregunta.

| Dato | Valor | Fuente | Estado |
|---|---|---|---|
| Nombre público | Dennys Heras | `content.js` (footer) | Verificado |
| Trayectoria | 7 años en campo con fibra óptica; aprendió Python para resolver problemas propios | `content.js` (ambas copias) | Verificado en archivo |
| Contacto | `dennys14_hq@hotmail.com` · LinkedIn `dennys-heras-27b0b520b` · GitHub `dennysh` | `content.js` | Verificado en archivo |
| CV | `/cv-dennys-heras.pdf` | `public/` | Existe; contenido sin revisar |
| Proyecto en producción | Bot Telegram "Caja Cercana": ubicación → Haversine → cajas cercanas → rutas en mapas; SQLite; pytest; acceso restringido por `GROUP_ID` | `projects.js` | Verificado en archivo |
| Cifra "1,719 cajas" y "lo usan técnicos reales en Ecuador" | Aparece en el repo y en un campo de la copia de la PC; la copia de la PC la quitó del texto "Sobre mí" | `content.js` | **Por confirmar (P-05)** |
| URL del repo del bot | `Bot_cajacercana` (PC) vs `Bot_Telegram_Caja_Cercana` (laptop) | `content.js` | **Por confirmar (P-06)** |
| En desarrollo | Registro de Cajas (bot), Reportes Telecom (bot), Sistema Contable (React + Flask + MySQL), Fútbol Manager (HTML/CSS/JS) | `projects.js` | Verificado en archivo |
| Exploración | HARDLOCK (Kotlin/Android), marcado "pendiente de documentar" | `projects.js` | Verificado en archivo |
| Stack declarado | Python, Go, JS, React, Node, SQL (Postgres, SQLite, MongoDB), Docker, Cloudflare, Git/GitHub, Linux, SSH, Telegram Bots, LLM APIs, Claude, OpenAI, Gemini, Whisper, AI Agents, etc. | `content.js` | Declarado; sin pruebas aún |
| Fábrica de software con agentes | Orquestador de Claude Code en laptop Ubuntu, tareas delegadas con límites, revisiones automáticas, túnel y acceso con Cloudflare, verificación humana | Prompt de Dennys | Verificado por su palabra; **sin evidencia pública aún (P-04)** |
| Criden | Producto aparte para clientes finales y páginas web | Prompt de Dennys | Sin datos públicos disponibles |

Consecuencias de diseño:
- Las cifras y afirmaciones se muestran con su estado (producción / desarrollo / exploración), como ya hace `projects.js`.
- Las "stats" decorativas ("5+ repos", "3 bots") se sustituyen por hechos listados y enlazados, no por contadores.
- Los textos de `aiNews` son opinión genérica sin fuente: no se usan como evidencia. Su idea sirve de material para las reglas de la sección "Cómo trabajo con IA", solo si Dennys las hace suyas (P-07).
- El mensaje sobre gobernanza ("automatización sin perder control", "trazabilidad", "seguridad desde el primer prototipo") **ya existe** en `howICanHelp.principles` de la copia de la PC. El diseño lo eleva de principio secundario a tesis.

## 4. Estructura de la página

Orden pensado para la decisión de un reclutador. Todas las secciones tienen ancla y existen en HTML sin JS.

1. **Cabecera + Hero.** Una frase de tesis, una línea de quién soy (rol buscado, ubicación/zona horaria, disponibilidad), dos botones: "Probar la demo" y "Contactar". Debajo, un bloque **"Resumen en 5 líneas"** (el mismo texto que consumen las máquinas).
2. **Demo de decisión automatizada** (pieza central, sección 5). Va inmediatamente tras el Hero: es la prueba y el reclutador no debe buscarla.
3. **La fábrica de software con agentes.** Diagrama SVG propio (sin video): orquestador, tareas delegadas con límites, revisión automática, túnel y acceso con Cloudflare, verificación humana. Debajo, qué controles tiene cada paso y la evidencia (enlaces a repos, capturas, registros que yo confirme). *Justificación:* es la prueba real del mensaje; la demo es su versión explicable en 30 s.
4. **Cómo trabajo con IA (gobernanza).** Cuatro o cinco reglas operativas propias, cortas y comprobables (límites por tarea, revisión antes de aceptar, el humano verifica lo que reportan los agentes, trazabilidad, costo controlado). Enlace a este documento de diseño como muestra del método (spec-driven). *Justificación:* diferencia a un perfil que "usa IA" de uno que la gobierna.
5. **Trabajo demostrado.** Datos reales de `projects.js` (sección 3): Bot Caja Cercana en producción; Registro de Cajas, Reportes Telecom, Sistema Contable y Fútbol Manager en desarrollo; HARDLOCK como exploración. Cada ítem con estado explícito y enlace al repo.
6. **Capacidades.** Lista breve agrupada por lo que sé hacer, cada una enlazada a la prueba de arriba.
7. **Trayectoria.** Fibra óptica 7 años → programación → sistemas con IA, en 4–5 líneas. Es el diferenciador humano: fiabilidad de campo.
8. **Criden.** Un bloque pequeño y separado: "Para negocios y páginas web: Criden" con enlace. Deja clara la diferencia con este sitio.
9. **Contacto.** Correo, LinkedIn, GitHub, CV (PDF), idiomas, zona horaria, tipo de rol buscado.
10. **Pie.** Privacidad, términos, idioma.

## 5. Pieza central: decisión automatizada en vivo, explicada

### 5.1 Qué demuestra

Que sé diseñar un sistema automatizado que decide, **explica**, **deja rastro** y **cede el control a una persona**, con los tres pilares: transparencia, equidad/no discriminación (regla visible) y rendición de cuentas (supervisión humana y trazabilidad).

### 5.2 Guion de 30 segundos

| t | Qué ve el visitante |
|---|---|
| 0 s | Botón grande **"Simular acceso anómalo"**. Etiqueta fija: "Entorno de prueba simulado. Nada real se ataca ni se bloquea." |
| 1 s | Clic. El servidor genera un evento simulado y lo procesa. |
| 1–6 s | El evento aparece en vivo, línea por línea (reproducción escalonada del evento ya generado; las horas mostradas son las reales del servidor). |
| 6–9 s | Clasificación y **decisión**: Bloquear · Limitar · Alertar. |
| 9–15 s | **Explicación en lenguaje claro** (qué decidió, cómo, por qué, qué regla, qué módulos usó). |
| 15–22 s | **Pista de auditoría** completa y legible. |
| 22–26 s | **Estado de la alerta**, p. ej. "Notificado a Telegram ••••67 a las 02:41:18 · Entregada a Telegram". |
| 26–30 s | Botones **Aprobar · Anular · Escalar**. Lo elegido se añade a la pista de auditoría. Luego "Probar otro escenario". |

Quien llega con prisa puede saltar la animación ("Mostrar todo").

### 5.3 Los tres escenarios

Cada clic elige uno (el visitante puede forzar otro con chips tras la primera ejecución). Así se ven las tres salidas.

| Escenario | Señales (sintéticas) | Regla | Decisión |
|---|---|---|---|
| A. Ráfaga de intentos | 14 intentos fallidos en 40 s a la misma cuenta | R-02 `intentos-en-rafaga` | **Limitar** (bloqueo temporal de 15 min a esa cuenta) |
| B. Viaje imposible | Inicio de sesión correcto; 9 000 km en 12 min desde la sesión anterior | R-01 `viaje-imposible` | **Bloquear** la sesión hasta verificación |
| C. Acción fuera de horario | Exportación masiva de datos a las 03:12, dispositivo ya conocido | R-03 `accion-privilegiada-fuera-de-horario` | **Alertar** (no se bloquea) |

**Parámetros de las reglas** (supuesto de diseño, ajustables en el conjunto de reglas versionado):

| Regla | Condición | Acción |
|---|---|---|
| R-01 `viaje-imposible` | Dos inicios de sesión correctos de la misma cuenta cuya velocidad implícita supera 900 km/h | Bloquear sesión |
| R-02 `intentos-en-rafaga` | ≥ 10 intentos fallidos a una misma cuenta en 60 s | Limitar 15 min |
| R-03 `accion-privilegiada-fuera-de-horario` | Exportación masiva fuera de 07:00–20:00 en la zona de la organización simulada | Alertar |

- **Varias reglas a la vez:** gana la acción más severa (bloquear > limitar > alertar) y la auditoría lista **todas** las reglas que coincidieron.
- **Ninguna regla coincide:** el resultado es "Permitir y registrar". El motor tiene ese caso definido aunque los tres escenarios siempre coinciden con una regla.
- **Equidad de R-03:** una regla de horario podría perjudicar a quien trabaja por turnos. Por eso solo alerta (la acción de menor impacto) y la persona puede anularla. La pantalla lo dice.

Datos de entrada 100 % sintéticos: cuentas ficticias, IP de rangos reservados para documentación (RFC 5737), ciudades genéricas.

### 5.4 Equidad y no discriminación (regla visible)

- Cada decisión muestra el **texto de la regla** y la versión del conjunto de reglas (con su hash).
- Se muestran los **datos usados** y los **datos deliberadamente no usados** (nacionalidad, nombre, idioma, tipo de dispositivo, género).
- "Lugar raro" se evalúa como **velocidad geográfica** (distancia/tiempo), nunca como "país sospechoso". El umbral es el mismo para todos.
- Idea opcional v1.1: interruptor "¿y si fuera otro país?" que repite la decisión y muestra que no cambia.

### 5.5 Rendición de cuentas

- Pista de auditoría de solo añadir (sin edición), con un sello de integridad (hash del registro) por evento.
- Cada intervención humana (Aprobar/Anular/Escalar) añade una línea con hora y actor ("visitante, demo"). Los errores y fallos también se registran.
- Significado de los botones:
  - **Aprobar:** confirma la decisión del sistema.
  - **Anular:** revierte la decisión automática (se levanta el bloqueo/límite simulado) y deja el motivo "anulación humana".
  - **Escalar:** marca el caso para revisión de una persona. Actualiza el mensaje de Telegram ya enviado con `editMessageText` (no genera otra notificación y no gasta el tope).

**Reglas de secuencia de las intervenciones:** se aceptan hasta 3 por evento y todas quedan en la pista. El **estado efectivo** es el de la última acción de decisión (Aprobar o Anular); Escalar no cambia el estado, solo marca el caso. Si el evento no generó mensaje (tope alcanzado), Escalar deja la línea "sin mensaje que actualizar". Si la edición del mensaje de Telegram falla, se muestra el fallo.

### 5.6 Contenido de la pista de auditoría

Todos los campos son visibles, en lenguaje legible y con el valor técnico entre paréntesis.

| Campo | Ejemplo |
|---|---|
| ID de evento | `ev_2026-10-29_8f3a` |
| Hora exacta (servidor) | UTC como referencia, más la hora local del navegador del visitante: `07:41:17.402 UTC · 02:41:17 (tu hora, UTC-5)` |
| Datos de entrada | cuenta ficticia, intentos, ventana, origen sintético |
| Motor de decisión | `rules-engine v1.0.0 (determinista, sin IA en tiempo real)` |
| Regla usada | `R-02 intentos-en-rafaga · ruleset sha256:ab12…` |
| Resultado | `LIMITAR (15 min)` |
| Explicación | `Texto generado con IA antes, revisado por una persona, v3` |
| Módulos usados | `detector-ráfaga v1 · clasificador-severidad v1 · notificador-telegram v1` |
| Estado de alerta | `Notificado · Entregada a Telegram` o fallo real |
| A quién | `Telegram ••••67` (últimos 2 dígitos del chat; el ID completo nunca sale del servidor) |
| Cuándo | `02:41:18.115` |
| Intervención humana | `02:41:40 · Aprobar · visitante (demo)` |

**Metadatos de la explicación:** cada plantilla lleva `version`, `generadaCon`, `revisadaPor` y `revisadaEn`. La pantalla escribe "revisada por humano" **solo si** esos campos existen. Si faltan, muestra "borrador pendiente de revisión" y la publicación a producción se bloquea. Así la frase de la pista de auditoría es verdad por construcción, no por costumbre.

**Aviso de honestidad (siempre visible):** la decisión y la explicación salen de reglas y plantillas versionadas; **no se llama a un modelo en tiempo real**. Las plantillas se redactaron con IA y las revisó una persona.

### 5.7 Qué significa "Entregada"

La API de Telegram responde `ok: true` y un `message_id` cuando **Telegram aceptó** el mensaje. Eso **no** prueba que mi teléfono lo mostró. Se propone el texto **"Entregada a Telegram"**, y solo con esa confirmación. Si la API falla o hay tiempo de espera, la pantalla muestra el fallo real ("No entregada: Telegram respondió 429") y se intenta el correo de respaldo, con su propio estado. (P-02.)

**Tiempo de espera:** el servidor espera la respuesta de Telegram hasta 4 s. Si no llega, el estado es "No confirmada (tiempo agotado)" y **nunca** "Entregada"; no se reintenta en esa misma petición. Una respuesta tardía no actualiza el estado en v1. El respaldo por correo se intenta solo si Telegram falló de forma explícita o venció el tiempo.

### 5.8 Alertas

- La alerta real llega **a mí** (Telegram al teléfono y al escritorio). Al visitante no se le pide ningún dato.
- El mensaje empieza por **[SIMULACIÓN]** para no confundirlo con un incidente real, y es corto: escenario, decisión, regla, hora, enlace al evento.
- Respaldo por correo si falla Telegram. Sin SMS ni WhatsApp de pago.
- **Topes:** 1 alerta real cada 10 min por visitante y 20 en cualquier ventana móvil de 24 h en total (no "por día de calendario", para que no haya ráfagas a medianoche). El correo de respaldo cuenta como la misma alerta, no como otra.
- **Pasado el tope** la simulación **sigue completa** (decisión, explicación, auditoría) y el estado dice: "Agrupada con la alerta de las HH:MM para evitar ruido". `HH:MM` es la última alerta real enviada: la del propio visitante si le tocó el tope personal, o la más reciente de la ventana si fue el tope global. Solo se muestra la hora. El tope nunca rompe la demo.
- **Idioma y zona de la alerta real:** el mensaje que me llega va **en español** y con mi zona horaria (supuesto: America/Guayaquil, UTC-5), sea cual sea el idioma del visitante (P-15).
- **Entornos de vista previa y local:** no tienen el token real. Las alertas están desactivadas y la pantalla dice "Modo prueba: no se envía alerta real". Si se quiere probar el envío, se usa un bot y un chat de prueba distintos (P-18).
- **Enlace en el mensaje:** incluye el `eventId` firmado; abre la auditoría de ese evento en modo solo lectura (datos sintéticos, caduca a las 24 h).
- Visitante = HMAC de la IP con una clave secreta, **sin fecha** (supuesto, P-19): no se guarda la IP en claro y el tope de 10 min no se reinicia a medianoche. Como todo se purga a las 24 h, el hash no permite seguir a nadie más allá de ese plazo. Las filas de cupo se conservan 25 h para que la ventana global de 24 h sea exacta.

### 5.9 Estados y errores de la interfaz

Reposo · ejecutando · decidido · intervención registrada · tope alcanzado · Telegram falló (con respaldo) · verificación anti-bot fallida · servidor no disponible (mensaje claro y enlace a contacto) · sin JavaScript (se muestra un ejemplo estático pregrabado en HTML, marcado "Ejemplo estático, no es un envío real", para que bots y lectores lo vean).

- **Turnstile no carga** (bloqueador de anuncios, red): mensaje claro, el botón no falla en silencio, y se ofrece el ejemplo estático.
- **Doble clic o reintento:** el botón se desactiva mientras corre; un token solo vale una vez, así que no hay dos eventos.
- **Recarga de la página:** el `eventId` se guarda en `sessionStorage` del navegador (sin cookies); si se recarga dentro de 24 h se restaura la auditoría, después se dice "El registro expiró".
- **Lectores de pantalla:** `aria-live` anuncia solo cuatro cambios (evento, decisión, estado de alerta, intervención), no cada línea. Con `prefers-reduced-motion` se muestra todo de golpe.
- **Agentes y bots:** no pueden ejecutar la demo en vivo (Turnstile, por diseño). Reciben el ejemplo estático y, públicos y de solo lectura, el conjunto de reglas (`/demo/ruleset.v1.json`, con su hash) y las plantillas de explicación. Eso refuerza la transparencia.

### 5.10 Costo

Cero llamadas a modelos por clic. Clasificación, decisión y explicación salen de reglas en JSON y plantillas versionadas en el repo. Todo el servidor corre en capas gratuitas (sección 7).

## 6. Estilo visual

**Dirección:** "editorial técnico sereno". Oscuro por defecto, alto contraste, un solo color de acento (propuesta: ámbar o lima, a decidir con prueba en pantalla), tipografía sans variable para texto y monoespaciada solo para datos y auditoría.

Justificación de cada elección:
- **Oscuro + acento único:** actual, llama la atención y deja el foco en la demo, que es lo único que brilla.
- **Monoespaciada solo en datos:** los datos se leen como evidencia; el resto se lee como texto de una persona.
- **Movimiento solo con función:** la aparición escalonada del evento y los cambios de estado. Respeta `prefers-reduced-motion`.
- **Sin 3D, sin matriz verde, sin contadores, sin partículas:** nada de lo que parezca "hacker" o adorno.
- **Diagramas SVG propios:** cargan rápido y se leen por máquinas (con `<title>`/`<desc>`).
- **Presupuestos:** JS inicial ≤ 150 KB gzip; LCP ≤ 2,0 s en 4G; WCAG 2.2 AA; navegable por teclado; lectores de pantalla anuncian los eventos (`aria-live="polite"`); móvil primero.

La skill `design` del arnés se usará en la fase de plan para proponer 2–3 direcciones concretas con prueba en navegador antes de fijar paleta.

## 7. Cómo se sirve (opciones y recomendación)

La demo necesita un servidor pequeño: guardar secretos, hablar con Telegram, aplicar topes. Vite solo da archivos estáticos.

| Opción | Cómo | Pros | Contras |
|---|---|---|---|
| **A. Cloudflare Pages Functions (mismo proyecto)** | Carpeta `functions/api/*` junto al sitio. Secretos como variables cifradas de Pages. D1 (SQLite) para topes y auditoría. Turnstile anti-bot. | Una sola unidad de despliegue, mismo origen (sin CORS), gratis, siempre encendido, sin abrir mi laptop a internet | Límites de la capa gratuita (hay que verificar cifras vigentes al implementar). Atado a Cloudflare |
| B. Worker separado | Worker propio en `api.dennysh.com` | Despliegue independiente | CORS, otro dominio de confianza, más piezas |
| C. Servicio en la laptop tras el túnel de Cloudflare | App pequeña en Ubuntu expuesta por `cloudflared` | Control total; refuerza el relato de la fábrica | **Si la laptop se apaga o duerme, la demo muere justo cuando entra un reclutador.** Expone mi equipo al tráfico público. Sin SLA |

**Recomendación: A.** Es la única que garantiza que la demo esté viva sin depender de mi laptop, y mantiene los secretos en el servidor de Cloudflare. La fábrica de agentes se muestra como evidencia (sección 4.3), no como dependencia de la demo. La opción C queda como respaldo de contingencia solo si se descarta A.

Nota: `dennysh.com` sigue siendo público y sin login. El incidente del dominio raíz del 2026-10-02 (solo `www` como dominio personalizado) figura en notas como corregido; **se vuelve a comprobar antes de publicar** (criterio de aceptación AC-18).

### API mínima

| Endpoint | Hace | Entrada validada en servidor |
|---|---|---|
| `POST /api/simulate` | Genera evento, decide, registra, intenta alertar | `lang` ∈ {es,en}; `scenario` ∈ {A,B,C} u omitido; token Turnstile. Nada más. Cuerpo máximo pequeño, `Content-Type` exacto |
| `POST /api/intervene` | Añade Aprobar/Anular/Escalar | `eventId` firmado (HMAC); `action` ∈ {approve, override, escalate}; máximo 3 por evento |
| `GET /api/event/:id` | Devuelve la auditoría de ese evento | El `eventId` firmado actúa como enlace de solo lectura (datos sintéticos, caduca a las 24 h). No hay lista pública |

El visitante nunca elige destino, URL ni texto libre. Esto hace imposible usar la demo como herramienta de ataque o de spam hacia terceros.

## 8. Datos de máquina, SEO y privacidad

- **HTML prerenderizado** de ambos idiomas (un paso de build con `react-dom/server`, sin cambiar de framework). Justificación: muchos bots no ejecutan JS; hoy el sitio es una SPA vacía para ellos.
- **JSON-LD:** `Person` (nombre, rol, ubicación, enlaces `sameAs`, `knowsAbout`), `ProfilePage`, y `SoftwareSourceCode` para proyectos públicos. Solo datos que yo confirme.
- **`/llms.txt`:** resumen claro de quién soy, qué sé hacer, mejores enlaces (formato Markdown corto). Aún no es estándar universal, pero cuesta casi nada.
- **`/dennys.json`:** perfil en formato JSON Resume.
- **`robots.txt`:** permite explícitamente a los rastreadores de IA (es el público objetivo) y a buscadores. `sitemap.xml` con `hreflang`.
- **Metadatos:** título y descripción alineados con el mensaje nuevo (hoy dicen "Automatización y Bots para Negocios", que es Criden). Imagen Open Graph con la tesis.
- **Privacidad:** se almacena por visitante solo el hash de IP con sal y los datos sintéticos del evento, con retención de 24 h y purga automática. Se declara en `privacidad` junto con Turnstile y Telegram. Sin analítica en v1 (supuesto, P-17): así no hace falta banner ni excepción de CSP; si Dennys elige Cloudflare Web Analytics (sin cookies) se añade con su excepción de CSP. (P-11.)

## 9. Regla de honestidad del contenido

Ninguna afirmación sin evidencia. Cada logro, cifra o proyecto lleva: estado (en producción / en construcción / idea), enlace o prueba, y fecha. Lo no comprobable se omite o se marca "en construcción". Los datos reales son los de la sección 3; lo demás es marcador por confirmar (`02-DOCS/preguntas-pendientes-dennys.md`).

## 10. Controles de seguridad

**Base normativa.** `~/.claude/CLAUDE.md` no existe en esta laptop, así que se aplica la lista de respaldo que dio Dennys: S1, S3, S4, S6, S8, S9, S11, S12, S13, S14, S15, S17, S18, S19, S20. Los números S2, S5, S7, S10, S16 no están definidos en lo que tengo: no se inventan (P-03). Los controles propios del diseño llevan prefijo **D-** para no chocar con esa numeración.

### 10.1 Superficie a proteger

Un solo endpoint público dispara una acción con efecto externo (un mensaje real a mi Telegram): `POST /api/simulate`. Alrededor: `POST /api/intervene` y `GET /api/event/:id`. Todo corre en Pages Functions (opción A, sección 7) con D1 y secretos del entorno.

### 10.2 Evaluación de los controles

| Control | Aplicación a este diseño | Cómo se verificará |
|---|---|---|
| **S1 Secretos** | Token del bot, ID de chat, sal de hash, clave HMAC, clave de correo y secreto de Turnstile: solo variables cifradas de Pages (producción y vista previa por separado). Nunca en frontend, git, registros ni mensajes de error. `.env*` y `01-TOOLS/**/.env` en `.gitignore`. Plantilla `.env.example` sin valores. Procedimiento de rotación escrito (BotFather `/revoke`) | (a) Búsqueda de patrones de token (`\d{8,10}:[\w-]{35}`) y de cada valor real contra `dist/`, el repo y su historial; (b) prueba que provoca errores y comprueba que ninguna respuesta contiene secretos; (c) ensayo de rotación antes de publicar |
| **S3 Clave pública** | Solo se publica la *site key* de Turnstile (pública por diseño). El prefijo `VITE_` queda prohibido para cualquier otra cosa. Si se conserva Supabase, su *anon key* es pública y **solo es segura con S4 activo** | Lista blanca de variables `VITE_*` comprobada en build; el build falla si aparece una variable no listada |
| **S4 RLS / acceso a datos** | La demo usa D1 solo desde el servidor mediante *binding*; D1 no tiene acceso desde el navegador, así que no hay RLS que olvidar. Si Dennys mantiene Supabase (reseñas), RLS es obligatorio: leer solo `approved = true`, insertar solo `approved = false` (P-08) | Prueba con la *anon key*: leer filas no aprobadas, actualizar y borrar deben fallar. Si se retira Supabase: comprobar que el bundle ya no contiene su URL ni clave |
| **S6 Autenticación** | La demo es pública a propósito: no hay login ni cuentas. Se compensa con D-03 (Turnstile) y D-04 (`eventId` firmado). **No existe ningún endpoint administrativo**; mi panel es Telegram. Futuro webhook de Telegram (v2): exigir `X-Telegram-Bot-Api-Secret-Token` | Revisión de rutas: solo las tres listadas; ninguna acepta credenciales; la ruta de webhook no existe en v1 |
| **S8 Asignación masiva** | El servidor construye el registro con campos que él decide. El cliente solo puede enviar `lang`, `scenario`, `turnstileToken` (y `eventId`+`action` en intervención). Decisión, regla, estado de alerta y hora **nunca** vienen del cliente. Se rechaza todo campo extra | Prueba: enviar `decision`, `ruleId`, `alertStatus`, `timestamp`, `__proto__`, `isAdmin` y comprobar 400 y que nada se persiste |
| **S9 Cookies** | La demo no usa cookies ni sesión. Analítica sin cookies. No se emite `Set-Cookie` | Prueba automática: ninguna respuesta de `/api/*` ni de las páginas contiene `Set-Cookie`. Si en el futuro hubiera una: `HttpOnly; Secure; SameSite=Strict` |
| **S11 Límite de tasa** | Capas, de fuera adentro: (1) regla de Cloudflare por IP sobre `/api/*`; (2) por visitante (hash de IP con sal): 1 alerta real cada 10 min; (3) global: 20 alertas reales en cualquier ventana móvil de 24 h; (4) máximo 3 intervenciones por evento; (5) interruptor de corte si Telegram responde 429 o 5xx. Los contadores viven en D1 con operación atómica (`UPDATE … WHERE count < N`), no leer-y-luego-escribir | Prueba de concurrencia: 50 peticiones simultáneas deben producir como máximo 1 alerta por visitante y nunca más de N globales. Prueba de ventana móvil (24 h) y de reloj |
| **S12 Anti-bot** | Turnstile verificado en el servidor (`siteverify`) **antes de cualquier trabajo o llamada saliente**; un token vale una vez y caduca; el `hostname` devuelto debe ser el mío. Sin refuerzos adicionales (campo trampa y tiempo mínimo descartados: chocan con el esquema de tres campos y Turnstile de un solo uso ya cumple la función) | Peticiones sin token, con token repetido, caducado o de otro sitio: todas 403 y sin envío. Prueba con la clave de pruebas de Turnstile |
| **S13 Consultas** | Solo sentencias preparadas de D1 con parámetros enlazados. Prohibido concatenar texto en SQL. Ningún dato del cliente forma parte del SQL salvo como parámetro | Revisión estática: búsqueda de `+`/plantillas en cadenas SQL; prueba con entradas `' OR 1=1 --` |
| **S14 Validación** | Esquema estricto en servidor: tipos, longitudes, enums (`lang`, `scenario`, `action`), tamaño máximo de cuerpo, `Content-Type: application/json` exacto, método permitido, rechazo de campos desconocidos, validación del formato del `eventId` antes de tocar la base | Tabla de pruebas de entradas inválidas (campo extra, enum fuera de lista, cuerpo enorme, JSON roto, otro método/tipo): todas 4xx sin efectos |
| **S15 Sanitizado** | Cero texto libre del visitante. Mensajes de Telegram y correo salen de plantillas fijas con valores de lista cerrada; si algún valor dinámico llegara, se escapa para el `parse_mode` usado. En pantalla, React escapa; prohibido `dangerouslySetInnerHTML` y `innerHTML`. Se eliminan caracteres de control en cualquier cadena que llegue a registros | Prueba: valores con `<script>`, saltos de línea y marcado de Telegram no alteran el mensaje; análisis estático prohíbe `dangerouslySetInnerHTML` |
| **S17 Respuestas mínimas** | Las respuestas devuelven solo lo que la pantalla necesita. Errores genéricos con código (`E_RATE`, `E_BOT`, `E_INPUT`), sin trazas ni versiones. Nunca se devuelven: ID de chat completo, token, sal, IP, nombres de variables. Se muestra "••••67" en lugar del identificador. El estado de tope solo revela la hora de la alerta agrupada | Pruebas que revisan el JSON completo de cada respuesta contra una lista de campos permitidos |
| **S18 Cabeceras (CSP, HSTS)** | `_headers`: `Content-Security-Policy` con `default-src 'self'`, `script-src 'self' https://challenges.cloudflare.com`, `frame-src https://challenges.cloudflare.com`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, sin `unsafe-inline` ni `unsafe-eval`; `Strict-Transport-Security: max-age=31536000; includeSubDomains` (preload solo tras comprobar que todos los subdominios son HTTPS); `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` restrictivo; `Cross-Origin-Opener-Policy: same-origin`; respuestas de `/api/*` con `Cache-Control: no-store`. Las páginas estáticas las reciben por `_headers`. Las respuestas de `/api/*` **no** las cubre `_headers` (Cloudflare: no se aplica a respuestas de Pages Functions, verificado 2026-10-29), así que las fija un middleware común del código de las Functions. Nunca por `<meta>` (hoy el sitio las duplica ahí, que no equivale) | Prueba automática que lee las cabeceras de `/`, `/en/`, `/es/` y 404 en el build, y de respuestas reales de cada endpoint de `/api/*` (también errores); escáner externo de cabeceras como contraste |
| **S19 HTTPS** | "Always Use HTTPS", TLS mínimo 1.2, redirección de `http` y de `www` ↔ apex a una sola URL canónica, HSTS. Comprobar que **apex y `www`** están asignados al proyecto (incidente 2026-10-02) | `curl -I` a las cuatro variantes (`http/https` × apex/`www`); prueba de contenido mixto en el build |
| **S20 Dependencias** | Lista mínima; versiones fijadas con *lockfile*; sin paquetes sin uso (se descarta `three` y afines si no se usan); `npm audit` bloqueante para severidad alta; Pages Functions sin dependencias de ejecución si es posible; revisión de cada paquete nuevo (mantenimiento, scripts de instalación) | `npm audit` y revisión de `package-lock.json` en la fase `verify`; comparar árbol de dependencias contra la lista aprobada |

Controles propios del diseño (prefijo **D-**):

| Control | Detalle | Verificación |
|---|---|---|
| D-01 Tráfico saliente acotado | El servidor solo llama a la API de Telegram y al proveedor de correo, con destinos fijos y tiempo de espera corto. Ningún valor del cliente forma parte de una URL de salida | Revisión estática de cada `fetch`; prueba con intentos de SSRF en campos |
| D-02 Alertas de plantilla fija | Cada mensaje empieza con **[SIMULACIÓN]**; contenido derivado solo de listas cerradas | Prueba de instantánea de los mensajes |
| D-03 Orden de comprobaciones | Primero método/tipo/tamaño → esquema → Turnstile → tope → decisión → envío. Nada caro ocurre antes de pasar lo barato | Prueba de orden con simulacros: un tope alcanzado nunca llega a invocar Telegram |
| D-04 Identificadores firmados | `eventId` aleatorio de 128 bits con HMAC; sin enumeración ni acceso a eventos ajenos; ningún listado público | Prueba: adivinar, modificar o reutilizar IDs → 404 uniforme |
| D-05 Privacidad | IP solo como hash salado; retención 24 h con purga; ningún dato personal del visitante | Prueba de la tabla tras 25 h simuladas; revisión de `privacidad` |
| D-06 Degradación honesta | Si falla Telegram, correo o D1, la demo sigue y lo dice; si D1 falla, no se envía alerta (cierre seguro) | Pruebas de fallo inyectado en cada dependencia |
| D-07 No es herramienta de ataque | La demo no genera tráfico hacia terceros ni acepta destinos. Los eventos son sintéticos, con IP de rangos de documentación | Revisión de la lista de destinos salientes (D-01) |

### 10.3 Modelo de amenazas del endpoint que dispara la alerta

Activo: mi atención (un Telegram real), el token del bot, la cuota gratuita y la integridad del registro.

| Amenaza | Vector | Impacto | Mitigación (control) | Riesgo residual |
|---|---|---|---|---|
| **Abuso / spam a mi teléfono** | Un script llama en bucle a `/api/simulate` | Notificaciones sin fin; ruido real | Turnstile (S12), tope por visitante y global (S11), plantillas fijas (D-02). El tope global limita el peor caso a ~20/día aunque el atacante rote IP | Un atacante con muchas IP agota el cupo del día y deja sin alerta a visitantes legítimos; la demo sigue funcionando sin alerta (D-06) |
| **Suplantación de visitante / evasión del tope** | Cambiar cabeceras `X-Forwarded-For` | Evadir el tope por visitante | Usar solo `CF-Connecting-IP` puesto por Cloudflare; ignorar cabeceras del cliente (S11) | IP compartidas (CGNAT) agrupan visitantes: aceptado |
| **Robo del token del bot** | Fuga por git, bundle, registros, errores, respuestas, capturas, CI, copia del `.env` | Un tercero envía mensajes en mi nombre o lee `getUpdates` | S1, S3, S17, rotación documentada; el token nunca sale del servidor; búsqueda automática en bundle e historial | Compromiso de mi cuenta de Cloudflare o de mi máquina (fuera del alcance del diseño; recomendar 2FA) |
| **Denegación por costo (DoS económico)** | Volumen alto para agotar la cuota gratuita de Functions/D1/Turnstile o provocar el límite 429 de Telegram | Demo caída o factura | Regla de límite en el borde antes de ejecutar Functions, validación barata primero (D-03), cierre seguro (D-06), corte por 429 (S11), **sin planes de pago activados**: el límite gratuito corta en vez de cobrar (confirmar al implementar) | Un ataque de volumen puede dejar la demo sin servicio ese día; el resto del sitio, estático, sigue en línea |
| **Enumeración** | Adivinar `eventId`; probar valores de `scenario`; sondear topes; leer ID de chat o estado interno | Fuga de eventos ajenos o de datos internos | D-04, S17, 404 uniforme, sin listados, ID de chat enmascarado, estado de tope solo con la hora | Ninguno relevante: los eventos son sintéticos |
| **Repetición / reutilización** | Reenviar la misma petición o token | Alertas duplicadas | Token Turnstile de un solo uso; operación atómica del tope (S11, S12) | Ninguno relevante |
| **Condición de carrera en el tope** | Muchas peticiones simultáneas | Superar el tope | Actualización atómica en D1; prueba de concurrencia | Ninguno si pasa la prueba |
| **Inyección** | Campos con SQL, marcado de Telegram o saltos de línea | Manipular consultas o mensajes | S13, S14, S15, S8 | Ninguno si pasan las pruebas |
| **Falsificación de intervención** | Llamar a `/api/intervene` con IDs ajenos o acciones inventadas | Registros falsos | `eventId` firmado, enum de acciones, máximo 3 (D-04, S14) | Un visitante puede intervenir su propio evento: es lo previsto |
| **Eco de errores del proveedor** | Telegram o correo devuelven el error con datos | Fuga del token en el cuerpo | Traducir a códigos propios; no reenviar cuerpos del proveedor (S17) | Ninguno si pasa la prueba |
| **Uso como arma contra terceros** | Convertir la demo en emisor de tráfico | Daño y reputación | D-01, D-07 | Ninguno: no hay destino configurable |
| **Fuga de privacidad** | Conservar IP o datos del visitante | Incumplimiento y confianza | D-05, `privacidad` actualizada | Hash salado de IP: dato personal en algunas jurisdicciones, declarado |

### 10.4 Cómo se comprobará todo (puerta de `verify`)

Un conjunto de pruebas automáticas, sin llamar al Telegram real (proveedor simulado), que cubre las filas "Cómo se verificará" de arriba, y una lista manual previa a publicar: rotar el token, probar una alerta real desde producción, confirmar apex y `www`, contraste con un escáner externo de cabeceras. Cada control tiene su prueba antes de dar la tarea por terminada. Las pruebas adversariales las pasan los agentes `refuter-security` y `refuter-tests` del arnés.

## 11. Idioma

Español e inglés, con URLs separadas para que los rastreadores indexen ambos: `/en/` y `/es/`, `hreflang` y selector visible. Un único archivo de contenido con las dos lenguas para que no se desincronicen. La raíz `/` sirve el mismo contenido en inglés con `rel=canonical` a `/en/`; `hreflang`: en→`/en/`, es→`/es/`, `x-default`→`/en/`; el `sitemap` lista solo `/en/` y `/es/` (supuesto, P-21). Idioma por defecto inglés porque las empresas de vanguardia a las que apunto suelen operar en inglés. Las explicaciones y plantillas de la demo existen en ambos idiomas y se revisan por persona. (P-01.)

## 12. Criterios de aceptación (base para la spec)

- AC-01: el Hero muestra la tesis y el resumen de 5 líneas sin necesidad de desplazarse en móvil.
- AC-02: con JS desactivado, el contenido principal, el JSON-LD y un ejemplo estático de la demo son legibles.
- AC-03: un clic en el botón produce evento, decisión, explicación, auditoría y estado de alerta en ≤ 30 s con animación y, con "Mostrar todo", en ≤ 2,5 s en el percentil 95 y ≤ 5 s como máximo (incluye la espera de Telegram, tope de 4 s).
- AC-04: los tres escenarios producen tres decisiones distintas (limitar, bloquear, alertar) con regla y versión visibles.
- AC-05: la auditoría contiene todos los campos de 5.6, con horas del servidor.
- AC-06: "Entregada a Telegram" aparece solo tras `ok: true` con `message_id`; ante fallo se muestra el fallo real.
- AC-07: el segundo clic dentro de 10 min no envía alerta real y muestra "Agrupada con la alerta de las HH:MM…"; la demo sigue completa.
- AC-08: tras ~20 alertas reales en el día, ninguna más se envía y el mensaje es honesto.
- AC-09: Aprobar/Anular/Escalar añaden una línea a la auditoría con hora; "Escalar" no envía una notificación nueva.
- AC-10: no hay llamada a modelos de IA en el flujo del clic (verificable por prueba).
- AC-11: el token de Telegram no aparece en el bundle, el HTML, el repo ni los registros (prueba de búsqueda de secretos).
- AC-12: entradas inválidas (campo extra, enum fuera de lista, cuerpo grande, sin token) devuelven 4xx sin ejecutar nada.
- AC-13: las cabeceras de S18 están presentes en todas las respuestas (prueba automática).
- AC-14: cambiar solo nombre/país/idioma/dispositivo sintético no cambia la decisión (prueba de equidad).
- AC-15: JSON-LD válido, `llms.txt`, `dennys.json`, `robots.txt`, `sitemap.xml` y `hreflang` publicados.
- AC-16: Lighthouse móvil ≥ 90 en rendimiento y 100 en accesibilidad; JS inicial ≤ 150 KB gzip.
- AC-17: la página no pide ningún dato del visitante y no usa cookies de seguimiento.
- AC-18: `dennysh.com` y `www.dennysh.com` resuelven y sirven la misma página (comprobado antes de publicar).
- AC-19: toda hora de la auditoría aparece en UTC y en la hora local del navegador.
- AC-20: con varias reglas coincidentes gana la más severa y se listan todas; sin coincidencias el resultado es "Permitir y registrar".
- AC-21: si Telegram no responde en 4 s el estado es "No confirmada (tiempo agotado)", nunca "Entregada".
- AC-22: en vista previa y local no hay token real, no se envía nada y la pantalla dice "Modo prueba".
- AC-23: una plantilla sin `revisadaPor` y `revisadaEn` muestra "borrador pendiente de revisión" y bloquea la publicación a producción.
- AC-24: `/demo/ruleset.v1.json` es público y su hash coincide con el que muestra la auditoría.
- AC-25: recargar dentro de 24 h restaura la auditoría; pasado ese tiempo se muestra "El registro expiró".
- AC-26: tras 3 intervenciones no se acepta otra; el estado efectivo es la última de Aprobar/Anular; Escalar sin mensaje deja "sin mensaje que actualizar".
- AC-27: doble clic o token repetido producen un solo evento y una sola alerta.
- AC-28: si Turnstile no carga, el visitante ve un mensaje y el ejemplo estático.
- AC-29: el ejemplo estático está etiquetado como no real y no afirma ninguna entrega.
- AC-30: `aria-live` anuncia solo cuatro cambios; con `prefers-reduced-motion` no hay animación.
- AC-31: existen `privacidad`, `términos` y `404`, y `privacidad` describe hash de IP, Turnstile, Telegram y retención de 24 h.
- AC-32: el tope global es una ventana móvil de 24 h; el texto "Agrupada con la alerta de las HH:MM" usa la última alerta real que corresponde (propia o global).
- AC-33: `/` declara `canonical` a `/en/`; `hreflang` en/es/x-default presente; el sitemap lista solo `/en/` y `/es/`.

## 13. Fuera de alcance (v1)

Modelo de IA en vivo por clic, aprendizaje automático, cuentas o login, panel de administración (Telegram es mi panel), video, 3D, reseñas abiertas del público (salvo que Dennys lo decida, P-08), tráfico real o pruebas de carga contra terceros, botones de Telegram para decidir desde el teléfono (idea v2: bandeja de intervención real desde Telegram con webhook), enlaces compartibles permanentes de auditoría, historial de eventos de otros visitantes, actualización tardía del estado de una alerta, ejecución de la demo en vivo por bots o agentes, soporte de navegadores fuera de las dos últimas versiones estables, métricas de conversión del sitio, y el texto final de todo el sitio (la redacción completa se hace en `plan` con aprobación de Dennys).

## 14. Riesgos

| Riesgo | Mitigación |
|---|---|
| Parecer un adorno | Datos y reglas visibles, aviso de honestidad, enlace al diseño y al código |
| Dependencia de Cloudflare | Lógica de reglas pura y portable; las funciones solo la envuelven |
| Cifras de capa gratuita cambian | Verificarlas con fuente primaria al implementar; degradación prevista (S17) |
| Spam a mi Telegram | S3, S4, S6 |
| Afirmar de más sobre la fábrica | Sección 9; solo evidencia que yo entregue |
| Correo de respaldo no gratuito o no disponible | Verificar el servicio vigente al planificar; si no, solo Telegram + registro en D1 y aviso de fallo visible |

## 15. Decisiones tomadas y pendientes

Tomadas por el dueño: diseñar de cero en composición; datos reales los entrega él; diseño antes que constitución; la demo no usa IA por clic; Telegram principal, correo respaldo; sin SMS ni WhatsApp de pago; sin video.

Pendientes: `02-DOCS/preguntas-pendientes-dennys.md` (P-01 a P-18), cada una con recomendación por defecto que este diseño ya usa como supuesto por confirmar. Al aprobarse el diseño se registran en `02-DOCS/wiki/harness/decisions.md`.

## 16. Puntos a clarificar (tipados)

Resultado de `clarify`. Ninguna pregunta de Dennys se da por respondida: cada **suposición tomada** usa la recomendación por defecto y queda **por confirmar** hasta que él conteste.

| Tipo | Punto | Resultado |
|---|---|---|
| Suposición tomada (por confirmar) | P-01 inglés en `/`, español en `/es/` | Se mantiene; pendiente de Dennys |
| Suposición tomada (por confirmar) | P-02 texto "Entregada a Telegram" | Se mantiene; pendiente |
| Suposición tomada (por confirmar) | P-03 reglas S1–S20 | Lista de respaldo aplicada; pendiente |
| Suposición tomada (por confirmar) | P-04 evidencia de la fábrica | Solo descripción y diagrama; sin cifras; pendiente |
| Suposición tomada (por confirmar) | P-05 cifra "1,719 cajas" y uso en Ecuador | No se usa; pendiente |
| Suposición tomada (por confirmar) | P-06 URL del repo del bot | `Bot_cajacercana`; pendiente |
| Suposición tomada (por confirmar) | P-07 reglas inspiradas en `aiNews` | Sí, con sus palabras; pendiente |
| Suposición tomada (por confirmar) | P-08 retirar Supabase y reseñas abiertas | Fuera de v1; pendiente |
| Suposición tomada (por confirmar) | P-09 rol buscado y datos personales | Solo datos ya públicos; pendiente |
| Suposición tomada (por confirmar) | P-10 correo de respaldo y creación del bot | Telegram + correo si hay proveedor gratuito verificado; el token lo carga Dennys; pendiente |
| Suposición tomada (por confirmar) | P-11 retención de 24 h y hash de IP | Aceptado; pendiente |
| Suposición tomada (por confirmar) | P-12 "skills" = módulos del sistema | Aceptado; pendiente |
| Suposición tomada (por confirmar) | P-13 commit | **No autorizado**; no se hace |
| Suposición tomada (por confirmar) | P-14 ratificar constitución antes de `implement` | Se mantiene; **no se ratifica** todavía |
| Pregunta abierta → resuelta por defecto, nueva | P-15 idioma y zona de la alerta real | Español, America/Guayaquil (UTC-5); pendiente |
| Pregunta abierta → resuelta por defecto, nueva | P-16 quién es la "persona que revisa" las explicaciones | Dennys, con fecha; pendiente |
| Pregunta abierta → resuelta por defecto, nueva | P-17 analítica del sitio | Ninguna en v1 (cambia el valor anterior para no romper la CSP); pendiente |
| Pregunta abierta → resuelta por defecto, nueva | P-19 hash de visitante sin fecha (el tope de 10 min no se reinicia a medianoche) | Sin fecha; pendiente |
| Pregunta abierta → resuelta por defecto, nueva | P-20 quitar campo trampa y tiempo mínimo del anti-bot | Quitarlos; pendiente |
| Pregunta abierta → resuelta por defecto, nueva | P-21 `/` con canónico a `/en/` | Sí; pendiente |
| Pregunta abierta → resuelta por defecto, nueva | P-18 bot y chat de prueba para vista previa | Alertas desactivadas en vista previa hasta que exista un bot de prueba; pendiente |
| Decisión diferida | Botones de Telegram para decidir (webhook), interruptor "¿y si fuera otro país?" (v1.1), HSTS con *preload* | Fuera de v1, conservada |
| Área no formulable | Paleta y dirección visual exacta; texto final del sitio; cifras vigentes de la capa gratuita; proveedor de correo de respaldo | Se concretan en `plan` (skills `design` y `source-grounded-development`, con fuente primaria). Nada se asume mientras tanto |

Resueltos internamente (sin molestar a Dennys): ubicación de secretos y de cabeceras (sección 10), servidor (sección 7), método de sustitución de plantillas (sección 5.10), estilo (sección 6).

## 17. Clarifications

Registro `pregunta → decisión → por qué`, 2026-10-29. Todas son decisiones por defecto, sujetas a confirmación de Dennys.

| # | Pregunta (taxonomía) | Decisión | Por qué |
|---|---|---|---|
| C-01 | ¿Qué zona horaria muestra "02:41:18"? (supuestos no dichos) | UTC como referencia y hora local del navegador; la alerta real a Dennys en UTC-5 | Una hora sin zona no es auditable |
| C-02 | ¿"20 al día" es día de calendario? (términos ambiguos) | Ventana móvil de 24 h | Evita ráfaga a medianoche |
| C-03 | ¿A qué alerta se "agrupa" el visitante? (comportamiento incompleto) | A la última real que corresponde (propia o global), solo la hora | Honesto sin exponer datos |
| C-04 | ¿Qué pasa si Telegram tarda? (fallo y recuperación) | Espera de 4 s y "No confirmada"; sin reintento ni actualización tardía | "Entregada" solo con confirmación |
| C-05 | ¿Qué hace cada intervención y en qué orden? (actores y estados) | Máximo 3; gana la última de Aprobar/Anular; Escalar solo marca | Estado final sin ambigüedad |
| C-06 | ¿Y si dos reglas coinciden o ninguna? (casos límite) | Gana la más severa y se listan todas; ninguna = Permitir | Auditoría completa |
| C-07 | ¿Los umbrales de las reglas? (criterios faltantes) | 900 km/h, 10 intentos/60 s, horario 07:00–20:00 | Hace las reglas comprobables |
| C-08 | ¿Cómo es verdad "revisada por humano"? (honestidad) | Metadatos obligatorios y bloqueo de publicación | La frase no puede ser decorativa |
| C-09 | ¿Qué ven los bots, si Turnstile los frena? (actores) | Ejemplo estático, reglas y plantillas públicas | El público objetivo incluye agentes |
| C-10 | ¿Las vistas previas pueden enviar alertas reales? (seguridad y datos) | No; modo prueba sin token | Evita filtrar el token y ruido |
| C-11 | ¿Qué pasa al recargar o al hacer doble clic? (casos límite) | `sessionStorage` 24 h; un solo evento por token | Sin cookies y sin duplicados |
| C-12 | ¿Idioma del mensaje de Telegram? (supuestos no dichos) | Español siempre | Es para Dennys |
| C-13 | ¿Latencia aceptable? (criterios no funcionales) | p95 ≤ 2,5 s, máx. 5 s | Compatible con el tope de 4 s de Telegram |
| C-14 | ¿Quién ve la auditoría por el enlace de Telegram? (permisos) | Quien tenga el `eventId` firmado, solo lectura, 24 h | Coherente con datos sintéticos |
| C-15 | ¿Una regla de horario discrimina? (equidad) | Solo alerta y se puede anular; se explica en pantalla | Menor impacto con supervisión |

**Segunda lectura:** al resolver estos puntos no apareció ninguna laguna nueva que cambie el diseño. Quedan abiertas solo las de Dennys (P-01 a P-18) y las "áreas no formulables" de arriba.

### Clarifications añadidas tras `analyze` (2026-10-29)

| # | Hallazgo | Decisión (por defecto, por confirmar) | Por qué |
| --- | --- | --- | --- |
| C-16 | F06: fila S11 con "~20 al día" | Corregida a ventana móvil de 24 h | Coherencia con §5.8 y C-02 |
| C-17 | F07: hash con fecha reinicia el tope a medianoche | Hash sin fecha; cupos retenidos 25 h (P-19) | El tope de 10 min debe ser real; la privacidad la sostiene la purga a 24 h |
| C-18 | F08: campo trampa choca con el esquema | Se descartan campo trampa y tiempo mínimo (P-20) | Turnstile de un solo uso ya cubre; menos superficie |
| C-19 | F15: dos URL con el mismo contenido | `/` con canónico a `/en/`; `x-default`→`/en/`; sitemap sin `/` (P-21) | Evita contenido duplicado ante buscadores y agentes |
| C-20 | F02: `_headers` no cubre Functions | Middleware común fija las cabeceras de `/api/*` | Verificado en la documentación de Cloudflare |
| C-21 | F12: analítica contra CSP estricta | Sin analítica en v1 (P-17) | La CSP sin excepciones es más valiosa que una métrica que no se usa |

