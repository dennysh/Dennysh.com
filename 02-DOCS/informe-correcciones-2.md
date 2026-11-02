# Informe: correcciones 2 (2026-11-01)

Spec: `docs/superpowers/specs/2026-11-01-correcciones-2.md`. Estado: D1–D4 implementados en el árbol de trabajo. **Sin commit** (Dennys no los ha autorizado en el chat), **sin push**, sin tocar Cloudflare ni secretos. HEAD sigue en `4360858`.

## Evidencia
- `bash scripts/verify.sh`: OK (960 pruebas unitarias, build, compuertas estáticas). `npm audit` pasa en nivel alto; hay 5 avisos *moderados* en `lighthouse` (herramienta de desarrollo: glob/minimatch), sin tocar.
- `NODE_ENV=production npm run build`: OK. `npm run test:wrangler3`: compila (incluye `functions/api/contact.js`).
- Playwright: 146/146 (47 de contacto, secciones y tema; 91 de portada, galería y demo; 8 con `wrangler pages dev`, incluidas las nuevas de contacto desactivado).
- Revisión adversarial (seguridad, pruebas, corrección): ningún crítico. Corregido con pruebas:
  - Seguridad: `buildContactServices` no tenía la guarda de la clave de prueba de Turnstile (ahora queda desactivado fuera de localhost); se rechazan caracteres bidi y de ancho cero (spoofing visual en el correo).
  - Corrección: el foco saltaba al primer campo con error mientras se escribía en otro; `maxLength` recortaba emoji (cuenta UTF-16, el contrato cuenta puntos de código); el botón de envío perdía el foco al fallar (ahora `aria-disabled`); el widget de Turnstile se acumulaba tras un error o un timeout (`src/demo/turnstile.js`, afecta también a la demo).
  - Pruebas: límites de tasa, enums, tope de 254 del correo, tipo de contenido y tamaño en bytes, textos y rangos del formulario, Naunturia en los dos idiomas, texto de cada bot, anfitrión de Turnstile con clave real. Mutantes verificados (ipMax, globalMax, ventana del correo, enum `phone`, tope del correo): mueren.
- Un hallazgo de mis propias pruebas: `contactHandler` desactivado devolvía 503 sin validar la entrada; ahora recorre método, tipo, tamaño y esquema y termina en `E_DISABLED`.
- Prueba inestable ya existente, corregida: `response-shape.test.js` usaba la IP `203.0.113.7`, que los escenarios sintéticos pueden generar al azar (falló una vez de 5).

## Hecho
- **D1** Criden: insignia "En producción", sin enlace (el marcador P-22 queda en los datos, fuera del HTML). Panel de la portada y página Proyectos.
- **D2** "Bots para Telegram": un solo elemento `<details>` (cerrado por defecto, funciona sin JS, con teclado y lector de pantalla) en la página Proyectos y en el panel "Trabajo en producción". Orden: registro de cajas · caja más cercana · reportes · planificación. Solo Caja Cercana lleva estado ("En producción", el que ya tenía) y su texto; registro y reportes llevan su línea ya publicada; planificación solo el nombre. `llms.txt`, `dennys.json` y JSON-LD salen de la misma fuente (`site.js`).
- **D3** Naunturia igual que antes (en desarrollo, sin enlace) en web, `llms.txt` y `dennys.json`. C6 ("no se menciona") y C7 ("quitar solo tres") se contradecían: se aplicó C7 y D3, y Dennys podrá quitarla.
- **D4** Formulario adaptativo en `/es/contacto/` · `/en/contact/` (el inicio sigue limpio; correo, LinkedIn, GitHub y CV debajo):
  - Cuatro opciones; las preguntas dependen de la opción (web: tipo, presupuesto, plazo, dominio; bots: qué automatizar, dónde, presupuesto, plazo; hablar conmigo: motivo, empresa opcional, respuesta; otra cosa: mensaje). Último paso: nombre, correo, mensaje opcional; resumen, consentimiento con enlace a Privacidad y Turnstile.
  - Una pregunta por paso, barra de progreso (`<progress>`), botón Atrás, foco al título del paso, errores con `role="alert"` solo del paso actual, teclado completo, contraste AA en los dos temas (axe en cada paso).
  - Servidor (`functions/api/contact.js`, `server/contact*.js`, `core/contact.js`): esquema estricto con enums, longitudes en puntos de código, rechazo de saltos de línea y caracteres de control/bidi (S14); Turnstile en el servidor (S12); límite de tasa por IP (/64 en IPv6, 3/hora), por correo (2/día) y global (40/día) con 429 (S11), en una sola sentencia atómica de D1; texto llano y asunto fijo, sin inyección de cabeceras (S13, S15); respuesta solo con el estado (S17); aviso de privacidad actualizado (S5).
  - **Desactivado en producción por defecto** y probado así (ver "Lo que falta").
  - Sin JS: se muestra el enlace de correo en lugar del formulario.
- Rangos de presupuesto neutros en USD (menos de 300, 300–1 000, 1 000–3 000, más de 3 000, aún no lo sé); sin tarifas de Dennys (hay una prueba que lo impide).

## Valores por defecto usados
Rangos de presupuesto del spec; límites de tasa 3/hora por IP, 2/día por correo, 40/día en total (elegidos por mí: el spec no da números); mensaje ≤1 500 caracteres, "qué automatizar" ≤300, nombre ≤80, empresa ≤120; correo solo ASCII; los bots de registro y reportes sin estado (Dennys dijo "funcionando", no "en producción"); la aclaración "Bot Registry" (P-31) se trata como el mismo bot que "registro de cajas": **duda para Dennys**.

## Lo que falta de parte de Dennys (el formulario no envía nada hasta entonces)
1. **Mecanismo de entrega hacia dennys@dennysh.com: no existe ninguno en el proyecto.** El único canal, Telegram, avisa con texto fijo y no es correo. `createDelivery()` (`server/contact-services.js`) devuelve `null` y el formulario queda desactivado. Hace falta decidir el proveedor (por ejemplo el envío de correo de Cloudflare Email Service o similar) y su configuración; se enchufa en esa función con la forma `{ send({subject, text, replyTo}) → {kind} }`. No se inventó ningún proveedor ni cuenta. Alternativa más rápida si Dennys la prefiere: enviar el mensaje por el bot de Telegram existente (cambia el aviso de privacidad, que hoy dice "por correo").
2. **Migración `migrations/0002_contact.sql`** (tabla de límites de tasa, solo hashes y hora): aplicarla en D1 (`wrangler d1 migrations apply`), como la 0001. Mientras no se aplique, la demo no se ve afectada (la purga del contacto es aparte).
3. **Variable `CONTACT_ENABLED=true`** en Cloudflare (no es secreto), además de lo anterior. Los secretos que ya existen (`TURNSTILE_SECRET`, `VISITOR_HMAC_KEY`) se reutilizan; no se añadió ninguno. La clave pública de Turnstile ya está en `.env.production`.
4. Cuando haya proveedor de correo, nombrarlo como encargado del tratamiento en el aviso de privacidad (hoy dice "se envía por correo… y no se guarda en este sitio", cierto solo con el formulario activo).
5. Preguntas (en `02-DOCS/preguntas-pendientes-dennys.md`, P-39…P-43): estado real de los bots de registro, reportes y planificación; si "Bot Registry" es el de registro de cajas; rangos de presupuesto y topes de tasa definitivos.

## Controles de seguridad (estándar del proyecto)
| Control | Estado |
| --- | --- |
| S1 sin secretos en cliente ni repositorio | Verificado (compuerta `secrets`; ningún secreto nuevo) |
| S5 / S17 datos mínimos y respuesta solo con estado | Verificado (pruebas de lista blanca; D1 solo guarda hashes y hora) |
| S11 límite de tasa por IP y correo, 429 | Verificado (unitarias con literales y e2e real del estado desactivado); activo solo cuando se habilite |
| S12 Turnstile en el servidor | Verificado (orden, host y clave de prueba fuera de localhost) |
| S13 sin SQL concatenado / S15 texto como texto | Verificado (regla estática `rules`, `.prepare().bind()`, React escapa) |
| S14 validación con esquema en el servidor | Verificado (39 + 38 pruebas; mutantes muertos) |
| S18 cabeceras de las páginas y de `/api/contact` | Verificado (`api-headers`, e2e real) |
| S19 rutas bajo HTTPS | No aplica en local; HSTS presente en las cabeceras |
| S20 `npm audit` | Verificado en nivel alto; 5 moderados en `lighthouse` (dev) |
| Entrega real del mensaje | **Pendiente** (sin mecanismo de entrega) |
| Migración 0002 aplicada en D1 de producción | **Pendiente** (lo aplica Dennys) |
| Turnstile real con clave de producción en el formulario | **Pendiente** (no se pudo ejercitar sin entrega) |

## Notas
- Tensión con la regla 30 de la constitución ("`aria-live` solo para cuatro cambios"): el spec D4 pide errores con `aria-live` en el paso actual; se usó `role="alert"` solo en el error del paso actual. Conviene enmendar la regla 30 si Dennys está de acuerdo.
- La portada no cambió en esta tanda salvo el desplegable de bots en el panel de Proyectos.
