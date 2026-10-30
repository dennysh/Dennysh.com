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
| P-08 | ¿Se mantiene Supabase y las reseñas abiertas del público? | Retirar de v1 (menos superficie; una prueba funcionando pesa más). Si se mantiene, RLS obligatorio | Secciones 10 (S4), 13 |
| P-09 | ¿Qué rol y qué tipo de empresa buscas (remoto/zona horaria/idiomas/disponibilidad) y qué datos personales publicar (foto, ciudad)? | Solo lo que ya está público (nombre, correo, LinkedIn, GitHub). Resto como marcador | Secciones 4.1, 4.9, 8 |
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

