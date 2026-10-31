# Preguntas pendientes para Dennys

Estado 2026-10-29: Dennys aprobó el diseño (confirmado en su chat). **P-01 a P-18 siguen sin responder**; el diseño usa cada recomendación por defecto como supuesto por confirmar. P-13 y P-14 no están autorizadas.

Origen: diseño `docs/superpowers/specs/2026-10-29-dennysh-demo-decision-design.md`. Cada una tiene una recomendación por defecto; el diseño la usa y la marca "supuesto por confirmar". Responder una no bloquea las demás.

| ID | Pregunta | Recomendación por defecto | Afecta a |
|---|---|---|---|
| P-01 | ¿Idioma principal en `/`: inglés o español? (`/en/` y `/es/` existirán en ambos casos) | Inglés en `/`, español en `/es/` | Sección 11 |
| P-02 | ¿Basta "Entregada a Telegram" como texto de entrega? La API solo confirma que Telegram aceptó el mensaje, no que se vio en el teléfono | Sí, con esa redacción exacta | Sección 5.7 |
| P-03 | `~/.claude/CLAUDE.md` no existe en esta laptop. ¿Dónde están las reglas globales S1–S20 (¿PC?) y qué dicen S2, S5, S7, S10, S16? | Usé la lista de respaldo; copiar el archivo a la laptop para que el arnés lo vea | Sección 10 |
| P-04 | ¿Qué evidencia pública puede mostrarse de la fábrica de agentes (repo, capturas, registros de tareas, cifras reales)? | Diagrama + descripción de controles; enlaces solo a lo que confirmes. Sin cifras inventadas | Secciones 4.3, 9 |
| P-05 | ¿Es cierto y demostrable "1,719 cajas" y "lo usan técnicos reales en Ecuador"? La copia de la PC quitó esa frase de "Sobre mí" | No usarla hasta que lo confirmes. Mostrar solo "en producción" | Sección 3 |
| P-06 | ¿Cuál es la URL correcta del repo del bot: `Bot_cajacercana` o `Bot_Telegram_Caja_Cercana`? | Usar `Bot_cajacercana` (la copia más reciente) tras tu confirmación | Sección 3 |
| P-07 | ¿Quieres reutilizar como reglas propias las ideas de `aiNews` (flujo manual primero, permisos y trazabilidad, no subir secretos)? | Sí, como 4–5 reglas de "Cómo trabajo con IA", con tus palabras | Sección 4.4 |
| P-08 | **Resuelta 2026-10-30: las reseñas de Supabase quedan fuera por ahora; la tabla de Supabase no se tocó (D-IMPL-12).** ¿Se mantiene Supabase y las reseñas abiertas del público? | Retirar de v1 (menos superficie; una prueba funcionando pesa más). Si se mantiene, RLS obligatorio | Secciones 10 (S4), 13 |
| P-09 | **Respondida en parte el 2026-10-30** (rol): no busca un puesto concreto; quiere trabajar con IA, y a largo plazo le interesa la relación IA-cerebro como visión (publicado como interés). **Siguen pendientes** ubicación, zona horaria, idiomas y disponibilidad (se publican como "por confirmar"). ¿Qué rol y qué tipo de empresa buscas (remoto/zona horaria/idiomas/disponibilidad) y qué datos personales publicar (foto, ciudad)? | Solo lo que ya está público (nombre, correo, LinkedIn, GitHub). Resto como marcador | Secciones 4.1, 4.9, 8 |
| P-10 | ¿Correo de respaldo: qué dirección y qué servicio gratuito? ¿Crearás tú el bot en BotFather y guardarás el token en Cloudflare? | Telegram + correo a tu dirección pública; el token lo cargas tú, yo nunca lo veo | Sección 5.8 |
| P-11 | ¿Retención de 24 h para los registros de la demo y hash de IP con sal son aceptables? | Sí, y declararlo en `privacidad` | Secciones 8, 10 |
| P-12 | ¿"Skills usados" en la explicación significa los módulos del sistema de decisión (detector, clasificador, notificador)? ¿O quieres mencionar skills de Claude Code? | Módulos del sistema, con nombre y versión | Sección 5.6 |
| P-13 | ¿Autorizas hacer commit del arnés (`.rsc.json`, `.claude/`, `01-TOOLS/`, `02-DOCS/`, este diseño) cuando regreses? | Sí, un commit separado del código del sitio | Git |
| P-14 | ¿Confirmas que la constitución se ratifica antes de `implement`? | **Resuelta 2026-10-29:** ratificada v1.0.0 por instrucción directa ("ractificalo directamente"). Dennys puede enmendarla cuando regrese | Cabecera |
| P-15 | ¿La alerta real a ti va en español y en tu zona horaria (América/Guayaquil, UTC-5)? | Sí, español y UTC-5 | Sección 5.8 |
| P-16 | ¿Eres tú quien revisa las explicaciones y plantillas ("revisada por humano")? ¿Cada cuánto? | Sí, tú, con fecha en cada versión | Sección 5.6 |
| P-17 | ¿Quieres analítica en el sitio (Cloudflare Web Analytics, sin cookies) o ninguna? | **Ninguna en v1** (antes proponía Cloudflare Web Analytics; cambió porque exige una excepción de CSP) | Secciones 8, 10 |
| P-18 | ¿Crearás un segundo bot y chat de prueba para las vistas previas? | No por ahora: las vistas previas no envían alertas | Sección 5.8 |
| P-19 | ¿Aceptas que el hash de visitante no lleve fecha, para que el tope de 10 min no se reinicie a medianoche UTC? (la privacidad la sostiene la purga a 24 h) | Sí, sin fecha | Secciones 5.8, 10 |
| P-20 | ¿Quitamos el campo trampa y el tiempo mínimo del anti-bot (Turnstile de un solo uso basta)? | Sí, quitarlos | Sección 10 (S12) |
| P-21 | ¿`/` sirve inglés con canónico a `/en/`, y el sitemap lista solo `/en/` y `/es/`? | Sí | Secciones 8, 11 |
| P-22 | ¿Cuál es la dirección pública de Criden (el producto para negocios y páginas web) y qué una línea quieres decir de él? | Sin enlace hasta que lo confirmes; el bloque queda como marcador | Sección 4.8 |

**Publicación 2026-10-30:** Dennys autorizó publicar con P-04, P-06, P-09 (parte pendiente) y P-22 como "por confirmar" y con las 4 plantillas sin revisar (D-IMPL-11). No están resueltas: siguen abiertas hasta que las respondas.

**P-22 (Criden):** sigue pendiente; su sitio aún no está en producción (quizá este fin de semana). Se publica "Enlace próximamente".

## Primera pantalla (2026-10-31)

Origen: `docs/superpowers/specs/2026-10-31-primera-pantalla-design.md`. Mientras no respondas, el sitio las publica como "por confirmar" solo si las autorizas (el build de producción falla con marcadores sin autorizar).

| ID | Pregunta | Recomendación por defecto | Afecta a |
|---|---|---|---|
| P-23 | ¿Qué otros deportes (además de jiu-jitsu) van en el nodo Interés? | Solo jiu-jitsu; el resto queda como marcador | Interés |
| P-24 | ¿Qué proyectos adicionales van en la página Proyectos? | Solo Caja Cercana y Super Gol Kids (ya confirmados) | Proyectos |
| P-25 | Trayectoria: ¿texto corto o línea de tiempo, y qué datos puedes publicar? | Texto corto y verdadero (7 años en fibra; paso a IA), sin cifras ni fechas sin respaldo | Trayectoria |
| P-26 | ¿Qué reglas más quieres sumar a `content/working-rules.json`? | Las 6 del spec más "no hay llamada a un modelo por clic" | Cómo trabajo |
| P-27 | Retrato `dennys-portrait.webp` | **Entregado 2026-10-31** (900×1210, 87 KB, sin EXIF/XMP/ICC, verificado) | Retrato (TH23) |
| P-28 | ¿Las URL en inglés de las páginas nuevas usan `projects`/`journey` o los mismos segmentos que en español? | `projects` y `journey` en `/en/`; `proyectos` y `trayectoria` en `/es/` | Rutas |
| P-29 | Fotos de cada fila de la galería de Trayectoria (cuántas, cuáles, texto alternativo) y empresas que autorizas nombrar (p. ej. la de fibra óptica) | Ninguna foto hasta que las entregues; cada hueco queda como marcador | Trayectoria, Interés |

**Respuestas de Dennys, 2026-10-31 (resueltas):**
- **P-23** (otros deportes): además de jiu-jitsu, ha hecho triatlón y pistas de obstáculos (ciclismo, natación y pista), pocas veces, no de forma constante. Publicado así en el nodo Interés (ES y EN), sin "competidor", resultados ni frecuencia. Ya no es pendiente.
- **P-24** (proyectos adicionales): no añadir más; se queda Caja Cercana y Super Gol Kids. Autorizado como está, sin marcador.
- **P-25** (Trayectoria): se queda como está, sin añadir nada. Autorizado como está.
- **P-26** y **P-28**: sin cambio (valores por defecto: las siete reglas del spec; URL `projects`/`journey` en inglés).
- **P-29** (fotos de la galería): las fotos están en otra computadora y llegan en unos días. Hasta entonces la galería de Trayectoria queda oculta (cada fila muestra solo su texto), sin marcadores ni nombre de la empresa de fibra. P-29 sigue registrado como pendiente y autorizado a publicarse (no bloquea el build) mientras la galería esté oculta. Al añadir las fotos reales a `journeyPage.rows[].photos` (con `src`, `alt`, `width`, `height`), la galería se activa sola.
