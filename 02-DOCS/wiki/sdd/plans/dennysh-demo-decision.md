---
type: plan
title: Plan — dennysh.com demo de decisión automatizada y sitio de presentación
description: Plan a nivel de estructura (contratos, datos, flujos, pruebas, tareas) para la demo de decisión explicada y el sitio que la rodea.
tags: [sdd, plan, tasks]
timestamp: 2026-10-29T00:00:00Z
topic: sdd
slug: dennysh-demo-decision
status: draft
---

# Plan — dennysh.com demo de decisión automatizada y sitio de presentación

> Spec: [`docs/superpowers/specs/2026-10-29-dennysh-demo-decision-design.md`](../../../../docs/superpowers/specs/2026-10-29-dennysh-demo-decision-design.md) (aprobada por Dennys; `clarify` aplicado; secciones 16 y 17)
> Constitución: [../constitution.md](../constitution.md) — **v1.0.0 ratificada el 2026-10-29** (P-14). Las elecciones de pila siguen siendo *supuestos por confirmar* donde dependen de P-01 a P-21.
> Estado: borrador, revisado tras `analyze` (F02–F05, F09–F14, F16–F18 corregidos; F01, F06–F08 y F15 con supuestos por confirmar) · Última actualización: 2026-10-29
> Desvío del flujo estándar: la spec vive en `docs/superpowers/specs/` (ruta fijada por Dennys), no en `02-DOCS/wiki/sdd/specs/`. No se duplicó.
> Alcance de este turno: **solo documentos**. Sin código de producto, sin dependencias nuevas, sin commit ni push.

## 0. Global Constraints

Valores exactos que toda tarea hereda. Todos salen de la spec; cada uno es un supuesto por confirmar mientras Dennys no responda P-01 a P-18.

- **Servidor:** Cloudflare Pages Functions en el mismo proyecto; datos en D1; anti-bot Turnstile (spec §7, §10).
- **Cero IA por clic:** ninguna llamada a un modelo en el flujo del clic (spec §5.10, AC-10).
- **Tope de alertas:** 1 alerta real cada 10 min por visitante; 20 en ventana móvil de 24 h en total; el correo cuenta como la misma alerta (spec §5.8).
- **Espera de Telegram:** 4 s; si vence, estado "No confirmada (tiempo agotado)", nunca "Entregada" (spec §5.7).
- **"Entregada":** solo con `ok: true` y `message_id` de Telegram, redactada "Entregada a Telegram" (P-02).
- **Mensaje de alerta:** en español, empieza por `[SIMULACIÓN]`, plantilla fija, zona America/Guayaquil (UTC-5) (P-15).
- **Texto libre del visitante:** ninguno. Entradas permitidas: `lang` ∈ {es,en}, `scenario` ∈ {A,B,C}, `turnstileToken`; en intervención `eventId` y `action` ∈ {approve,override,escalate} (spec §7).
- **Intervenciones:** máximo 3 por evento; estado efectivo = última acción entre Aprobar y Anular; Escalar solo marca (spec §5.5).
- **Retención:** 24 h para eventos, hash de visitante e intervenciones; las filas de cupo (`alert_slots`) se conservan 25 h para que la ventana móvil de 24 h sea exacta; purga oportunista (spec §5.8, §10).
- **Hash de visitante:** HMAC de la IP (`CF-Connecting-IP`) con clave secreta, **sin fecha**, de modo que el tope de 10 min no se reinicie a medianoche UTC (supuesto, P-19).
- **Secretos:** solo variables cifradas del entorno de Pages; nunca en frontend, git ni registros; variables `VITE_*` permitidas: solo la clave pública de Turnstile (spec §10 S1, S3).
- **Entornos de vista previa y local:** sin token real; alertas desactivadas; la pantalla dice "Modo prueba" (AC-22).
- **Cabeceras:** CSP sin `unsafe-inline` ni `unsafe-eval`, HSTS, `nosniff`, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, COOP, `no-store` en `/api/*`. Páginas estáticas: `public/_headers`. Respuestas de `/api/*`: las fija un middleware común de las Functions, porque `_headers` **no se aplica** a respuestas de Pages Functions (documentación de Cloudflare, verificada 2026-10-29). Nunca por `<meta>` (spec §10 S18, corregida).
- **Cookies:** ninguna (AC-17, S9).
- **Analítica:** ninguna en v1; si Dennys elige Cloudflare Web Analytics (P-17) se añade con tarea T094, excepción de CSP y mención en `privacidad`.
- **Interruptor de corte:** tras un 429, 5xx o vencimiento de Telegram, el notificador queda en pausa 60 s (estado en D1) y las alertas dicen "No enviada: servicio en pausa temporal" (spec §10 S11 capa 5; el tiempo de pausa es un supuesto).
- **Fuentes y tema:** fuentes alojadas en el propio sitio (`font-src 'self'`), tema oscuro por defecto y claro por `prefers-color-scheme` (spec §6).
- **Respuestas de la API:** solo campos de una lista permitida; errores con códigos propios (`E_INPUT`, `E_BOT`, `E_RATE`, `E_NOT_FOUND`, `E_INTERNAL`); sin trazas, sin ID de chat completo (S17).
- **Presupuestos:** JS inicial ≤ 150 KB gzip; LCP ≤ 2,0 s en 4G; Lighthouse móvil ≥ 90 rendimiento y 100 accesibilidad; WCAG 2.2 AA; p95 de `/api/simulate` ≤ 2,5 s y máximo 5 s (AC-03, AC-16).
- **Idiomas y URLs:** `/en/` inglés, `/es/` español; `/` sirve el mismo contenido en inglés con `rel=canonical` a `/en/`; `hreflang`: en→`/en/`, es→`/es/`, `x-default`→`/en/`; el `sitemap` lista solo `/en/` y `/es/` (P-01 y P-21). Textos del sitio solo con datos de spec §3; lo demás es marcador `pending`.
- **Honestidad de contenido:** ninguna cifra, cliente ni logro que no esté en spec §3 o en el prompt de Dennys (spec §9).
- **Dependencias:** ninguna nueva sin aprobación de Dennys (T002); versiones fijadas, `npm audit` sin severidad alta (S20).
- **Git:** sin commit ni push hasta que Dennys lo autorice (P-13).

## 1. Context & constraints

- Criterios que dan forma al diseño: AC-03 (30 s), AC-06/AC-21 (honestidad de "Entregada"), AC-07/AC-08/AC-32 (topes), AC-10 (sin IA), AC-11/AC-13 (secretos y cabeceras), AC-14 (equidad), AC-02/AC-15 (máquinas y sin JS).
- No funcionales: latencia (§0); privacidad 24 h; costo cero (spec §10.3 y D-06: degradar, no cobrar).
- Reglas de la constitución: **ninguna ratificada**. Se asume la pila ya presente (React 18 + Vite 5, Cloudflare Pages). Cambiarla exige ratificar primero.
- Verificado en fuente primaria el 2026-10-29: las Functions de Pages cuentan contra la cuota gratuita de Workers (100 000 peticiones/día, reinicio 00:00 UTC); D1 gratuito 5 M filas leídas, 100 000 escritas y 5 GB por día/total, y al superar el límite las consultas **fallan** hasta el reinicio (no se menciona cobro automático); un token de Turnstile caduca a los 300 s y vale una sola vez (`timeout-or-duplicate`), y existen claves de prueba. **No verificado:** código y `retry_after` de la respuesta 429 de Telegram, límites de edición de mensajes, proveedor de correo de respaldo, cualquier cambio de Cloudflare en la dirección Pages → Workers.
- Fuera de alcance (spec §13): modelo de IA por clic, login, panel, video, 3D, reseñas abiertas (salvo P-08), webhook de Telegram, historial de otros visitantes, enlaces permanentes, métricas de conversión.

## 2. Architecture

```text
 Visitante (navegador)                          Bots / agentes
   │  HTML prerenderizado + React (isla de demo)       │  lee HTML, JSON-LD, llms.txt,
   │                                                    │  dennys.json, ruleset público
   ▼                                                    ▼
┌──────────────────────────── Cloudflare Pages (estático) ────────────────────────────┐
│  [ Sitio ES/EN prerenderizado ]   [ Archivos de máquina ]   [ _headers ]            │
└────────────────────────────────┬────────────────────────────────────────────────────┘
                                  │ fetch same-origin (JSON)
                                  ▼
┌──────────────── Pages Functions: capa fina de E/S (EXTERNA al núcleo) ───────────────┐
│  handler simulate ─┐                                                                  │
│  handler intervene ┼─► validación → Turnstile → reserva de cupo → decidir → registrar│
│  handler event     ─┘                           → notificar → actualizar               │
└──────┬───────────────┬──────────────────┬───────────────────┬────────────────────────┘
       │ puerto        │ puerto           │ puerto            │ puerto
       ▼               ▼                  ▼                   ▼
 [ Turnstile ]   [ Almacén D1 ]     [ Notificador ]      [ Reloj / Azar ]
 (EXTERNO)       (EXTERNO)          Telegram + correo    (inyectables)
                                    (EXTERNOS)

 Núcleo de decisión (INTERNO, puro, sin E/S, compartido por servidor, build y pruebas):
   ruleset v1 + motor + generador de escenarios + plantillas de explicación
   + constructor de registro de auditoría + renderizador de mensaje de alerta
```

- **Sitio estático prerenderizado** (interno) — el contenido bilingüe y los archivos de máquina existen como HTML y JSON sin ejecutar JS.
- **Isla de demo** (interno, React) — máquina de estados de la demo, panel de auditoría, barra de intervención; no contiene lógica de decisión, solo muestra.
- **Núcleo de decisión** (interno, puro) — única fuente de verdad de reglas, escenarios, plantillas y formato del registro. Sin red, sin reloj, sin azar propios.
- **Handlers** (interno) — orquestan el orden fijado por D-03 y no contienen reglas de negocio.
- **Middleware de respuestas** (interno) — único lugar donde se fijan las cabeceras de seguridad y `no-store` de toda respuesta de `/api/*`.
- **Puertos y adaptadores** (frontera) — Turnstile, almacén, notificador, reloj, azar. Cada uno se prueba con un doble y con un contrato.
- **Contenido** (interno) — un único archivo bilingüe con los datos reales de spec §3 y marcadores `pending`.
- **Herramientas de build** (interno) — prerender, JSON-LD, `llms.txt`, `dennys.json`, `sitemap`, copia pública del ruleset con su hash.

**Decisión arquitectónica principal.** *Núcleo puro + capa fina de E/S con puertos inyectables, y reserva del cupo de alerta **antes** de llamar a Telegram.*
- Núcleo puro: lo que más hay que demostrar (reglas visibles, explicación, auditoría, equidad) se vuelve testeable sin red ni reloj, y portable si se abandona Cloudflare (riesgo de dependencia de la spec §14).
- Reserva antes de enviar: el orden es *cupo atómico → envío → registro del resultado*. Si hubiera "enviar y luego contar", una ráfaga simultánea superaría el tope (amenaza "condición de carrera" de spec §10.3). El cupo reservado se consume aunque el envío falle: impide martillar a Telegram y el estado se muestra tal cual (decisión D-PLAN-02).
- Alternativa descartada: servicio en la laptop tras el túnel. Se rechazó en spec §7 (la demo moriría con la laptop). Un Worker separado se descartó por CORS y una segunda superficie. Recomendación vigente: Pages Functions.

## 3. Interfaces & contracts

Notación neutral. Los errores son valores, no excepciones.

```text
core.evaluate(rules: Ruleset, signals: Signals) -> Outcome
  - Outcome = { decision: Block|Limit|Alert|Allow, matched: RuleMatch[≥0], effectiveRule?: RuleId }
  - puro y determinista; mismas señales → mismo Outcome
  - invariante: severidad Block > Limit > Alert > Allow; matched lista TODAS las coincidencias
  - invariante de equidad: no lee name, country, language, device, gender (solo señales de comportamiento)

core.loadRuleset(json) -> Ruleset | InvalidRuleset
  - rechaza campos desconocidos; hash = SHA-256 del JSON canónico; version semver

core.scenario(id: A|B|C, rng: Rng, now: Instant) -> Signals + SyntheticInput
  - solo datos sintéticos (cuentas ficticias, IP de rangos de documentación)
  - determinista con el mismo rng

core.explain(outcome, templates, lang) -> ExplanationRef { templateId, version, params, reviewState: Reviewed|PendingReview }
  - reviewState = Reviewed solo si existen revisadaPor y revisadaEn

core.buildAudit(event) -> AuditRecord { campos de spec §5.6, recordHash }
  - recordHash = SHA-256 del registro canónico; cada intervención encadena el hash anterior
  - todas las horas en UTC (ISO 8601 con milisegundos)

core.effectiveState(interventions) -> Decision | Overridden | Approved + flags(escalated)

core.renderAlert(auditRecord) -> TelegramText (es, plantilla fija, empieza por "[SIMULACIÓN]")

port Store
  reserveSlot(visitorHash, now) -> Reserved(slotId) | VisitorCap(lastAlertAt) | GlobalCap(lastAlertAt) | StoreDown
    - atómico: una sola sentencia condicional; nunca lee-y-luego-escribe
  putEvent(record) -> Ok | StoreDown
  updateAlert(eventId, alertState) -> Ok | StoreDown
  appendIntervention(eventId, action, at) -> Ok | LimitReached | NotFound | StoreDown
  getEvent(eventId, now) -> AuditRecord | NotFoundOrExpired
  purgeExpired(now) -> count   (oportunista, en escrituras; sin cron; eventos 24 h, cupos 25 h)
  getBreaker(now) -> Closed | Open(untilAt)
  tripBreaker(now, seconds=60) -> Ok | StoreDown

port Verifier
  verify(token, expectedHost) -> Human | Bot(reasonCode) | VerifierDown

port Notifier
  send(text, channel: telegram|email) -> Delivered{messageId?} | Failed{code} | Unconfirmed(timeout)
  edit(messageId, text) -> Edited | Failed{code}
  - timeout 4 s; no devuelve cuerpos del proveedor ni el token; Delivered solo con ok:true y message_id
  - modo prueba: DryRun -> NotSent("modo prueba")

port Clock { now() -> Instant }      port Rng { next() -> [0,1) }

API pública (same-origin, JSON, sin cookies). Toda respuesta pasa por el middleware de cabeceras.
POST /api/simulate   { lang, scenario?, turnstileToken }
  -> 200 { eventId, audit: AuditView } | 400 E_INPUT | 403 E_BOT | 429 E_RATE | 503 E_INTERNAL
  - idempotente por token (token repetido -> 403, sin segundo evento)
POST /api/intervene  { eventId, action }
  -> 200 { audit: AuditView } | 400 E_INPUT | 404 E_NOT_FOUND | 409 E_LIMIT
GET  /api/event/:eventId
  -> 200 { audit: AuditView } | 404 E_NOT_FOUND (uniforme: inexistente, caducado y firma inválida)
  - eventId = 128 bits aleatorios + HMAC; sirve de enlace de solo lectura 24 h
Error (cualquier código): { code: "E_INPUT"|"E_BOT"|"E_RATE"|"E_NOT_FOUND"|"E_LIMIT"|"E_INTERNAL" } y nada más

eventId
  signEventId(rawId, key) -> eventId        verifyEventId(eventId, key) -> rawId | Invalid
  - HMAC-SHA-256 truncado; comparación en tiempo constante; Invalid se trata como inexistente (404 uniforme)

Vistas de respuesta (listas exactas; todo campo fuera de estas listas es un defecto, S17)
AuditView = {
  eventId, createdAtUtc,                                   # ISO 8601 con milisegundos
  scenario: "A"|"B"|"C",
  input: InputView,
  engine: { name: "rules-engine", version, kind: "deterministic" },
  ruleset: { version, hash },                              # hash completo, 64 hex
  matched: [ { ruleId, ruleVersion } ],                    # todas las reglas que coincidieron
  decision: "Block"|"Limit"|"Alert"|"Allow",
  explanation: { templateId, version, params, reviewState: "Reviewed"|"PendingReview", reviewedAt? },
  modules: [ { id, version } ],                            # p. ej. burst-detector, severity-classifier, telegram-notifier
  usedData: [ string ], unusedData: [ string ],            # claves de lista cerrada, el cliente las traduce
  alert: AlertView,
  interventions: [ { seq: 1..3, action: "approve"|"override"|"escalate", atUtc, actor: "visitor-demo" } ],
  effectiveState: "Decided"|"Approved"|"Overridden", escalated: boolean,
  recordHash                                               # SHA-256 del registro canónico
}
InputView = { accountLabel, sourceIp, kind: "A"|"B"|"C", params }
  params A = { failedAttempts, windowSeconds }
  params B = { fromCity, toCity, distanceKm, minutes, impliedSpeedKmh }
  params C = { action: "bulkExport", localTime, orgZone }
  - todos sintéticos; sourceIp de rangos de documentación
explanation.params = { ruleId, thresholds: object, observed: object, durationLabel? }   # solo números y claves de lista cerrada
AlertView = {
  status: "Delivered"|"Failed"|"Unconfirmed"|"Grouped"|"TestMode"|"Paused",
  channel: "telegram"|"email"|"none",
  atUtc?, maskedChat?: "••••NN", messageIdPresent?: boolean,
  groupedWithAtUtc?,                                       # solo la hora de la alerta real a la que se agrupó
  code?,                                                   # código propio, nunca texto del proveedor
  fallback?: { channel: "email", status: "Delivered"|"Failed"|"Unconfirmed", atUtc?, code? }
}
  - "Paused" = interruptor de corte abierto; "TestMode" = entorno sin token real
Campos nunca presentes en ninguna respuesta: ID de chat completo, token, sal o claves, IP del visitante, hash de visitante, mensajes crudos de proveedores, trazas.

Orden obligatorio dentro de `simulate` (D-03): método/tipo/tamaño → esquema → Turnstile → cupo (`reserveSlot`) → interruptor (`getBreaker`) → decidir (núcleo) → persistir → notificar por Telegram (4 s) → si falló o venció, correo de respaldo (si existe) → actualizar estado (y `tripBreaker` si hubo 429, 5xx o vencimiento) → responder. Un cupo agotado o un interruptor abierto no invocan nunca al notificador; un fallo de `Store` cierra seguro (sin alerta). El correo de respaldo comparte el mismo cupo.

## 4. Data model & flow

**Entidades (D1)**

- **events** — `id` (PK), `createdAt` (UTC ms), `expiresAt`, `visitorHash`, `lang`, `scenario`, `rulesetVersion`, `rulesetHash`, `inputJson` (sintético), `decision`, `matchedRulesJson`, `explanationRef` (id+versión+parámetros), `alertStatus`, `alertChannel`, `alertMessageId`, `alertAt`, `recordHash`.
- **interventions** — `eventId` (FK), `seq` (1–3), `action`, `at`, `prevHash`, `hash`. Solo se añaden filas.
- **alert_slots** — `id`, `visitorHash`, `at`, `eventId`, `status`. Ventanas móviles: por visitante (10 min) y global (24 h). Se conservan 25 h.
- **breaker** — una fila: `openUntil`. Interruptor de corte del notificador.
- Sin tabla de usuarios. La IP nunca se guarda: solo `visitorHash`.

**Flujo principal (clic en "Simular acceso anómalo")**

1. El navegador ejecuta Turnstile y envía `{lang, scenario?, turnstileToken}` a `/api/simulate`.
2. El handler valida forma y tamaño, luego verifica el token con el verificador (host propio, un solo uso).
3. Calcula `visitorHash` = HMAC(IP de `CF-Connecting-IP`, clave secreta), sin fecha.
4. `reserveSlot` aplica ambos topes en una sentencia atómica. Si se agotó, la simulación continúa y el estado será "Agrupada con la alerta de las HH:MM".
5. El núcleo elige escenario (aleatorio si se omitió), genera señales sintéticas, evalúa reglas, resuelve la explicación y construye el registro con su hash.
6. Se persiste el evento; si se reservó cupo y el interruptor está cerrado, se renderiza y envía la alerta (límite 4 s). Si falla o vence se intenta el correo de respaldo (si existe) y, ante 429, 5xx o vencimiento, se abre el interruptor 60 s. Se actualiza el estado.
7. La respuesta lleva el registro permitido. El navegador reproduce el evento de forma escalonada (la animación es presentación; las horas son las del servidor) y guarda `eventId` en `sessionStorage`.
8. Aprobar/Anular/Escalar llaman a `/api/intervene`; Escalar edita el mensaje de Telegram si existe (sin nueva notificación ni cupo).

- **Consistencia:** el cupo, el evento y su estado de alerta se actualizan en pasos ordenados; el cupo es la única operación que debe ser atómica. Todo lo demás tolera repetición porque el token es de un solo uso.
- **Retención y purga:** eventos e intervenciones 24 h, cupos 25 h; la lectura trata lo caducado como inexistente; la purga corre de forma oportunista en escrituras (no hay cron en Pages).
- **Límites de cuota:** cada simulación escribe del orden de 3–4 filas, lejos de las 100 000 escrituras/día; el cuello de botella real son las 100 000 peticiones/día compartidas con cualquier otra Function. Al agotarse la cuota D1 las consultas fallan: la demo muestra "temporalmente no disponible" y el resto del sitio (estático) sigue.
- **Impacto de migración:** base nueva; sin datos previos. Esquema y SQL concretos: a cargo de la herramienta de D1 en `implement`.

**Secretos y variables** (nombres de contrato, valores nunca en el repo): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `VISITOR_HMAC_KEY`, `EVENT_HMAC_KEY`, `TURNSTILE_SECRET`, `ALERTS_ENABLED` (solo `true` en producción), `EMAIL_*` (si procede). Pública: `VITE_TURNSTILE_SITEKEY`.

## 5. Testing strategy

Niveles: **unit** (núcleo puro), **contract** (puertos con dobles que respetan el contrato), **integration** (handlers con D1 local real y dobles de red), **e2e** (navegador contra una instancia local en modo prueba, Turnstile con claves de prueba), **static** (análisis y comprobaciones sobre el build).

| Criterio | Nivel | Qué afirma | Qué se simula |
| --- | --- | --- | --- |
| AC-01 Hero sin desplazar en móvil | e2e | tesis y resumen visibles en 360×640 | nada |
| AC-02 sin JS | static + e2e | HTML contiene texto clave, JSON-LD y el ejemplo estático con JS desactivado | nada |
| AC-03 30 s / ≤2,5 s | e2e + integration | secuencia con animación ≤30 s; "Mostrar todo" ≤2,5 s p95 con Telegram simulado | Telegram con retardo configurable |
| AC-04 tres decisiones | unit | A→Limitar, B→Bloquear, C→Alertar; regla y versión presentes | rng sembrado |
| AC-05 campos de auditoría | unit + contract | los 12 campos de spec §5.6 presentes; horas en UTC | reloj |
| AC-06 / AC-21 "Entregada" honesta | contract | `Delivered` solo con `ok:true`+`message_id`; error y timeout → `Failed`/`Unconfirmed` | `fetch` de Telegram |
| AC-07 / AC-08 / AC-32 topes | integration (D1 real) | 2.º clic <10 min agrupa; tras 20 en 24 h no hay envío; ventana móvil; texto con la hora correcta | reloj, notificador espía |
| AC-09 / AC-26 intervenciones | unit + integration | 3 máximo; última de Aprobar/Anular gana; Escalar sin mensaje deja la línea; Escalar no crea alerta nueva | notificador espía |
| AC-10 sin IA | static | ningún import ni URL de proveedores de modelos; destinos salientes = lista cerrada (Telegram, verificación de Turnstile, correo); solo existen las tres rutas de `functions/api/` (S6) | nada |
| AC-11 secretos | static | patrón de token y cada valor real ausentes en `dist/`, repo e historial | nada |
| AC-12 entradas inválidas | integration | tabla: campo extra, enum fuera de lista, cuerpo grande, JSON roto, método/tipo erróneo → 4xx y cero efectos | doble de Turnstile |
| AC-13 cabeceras | static + integration | cabeceras presentes en `/`, `/en/`, `/es/` y 404 (leídas del build) **y en respuestas reales de cada endpoint de `/api/*`, incluidos errores** (leídas del handler con el middleware) | nada |
| AC-14 equidad | unit (propiedad) | cambiar nombre, país, idioma, dispositivo, género no cambia la decisión | generador de entradas |
| AC-15 máquinas | static | JSON-LD válido (estructura), `llms.txt`, `dennys.json`, `robots`, `sitemap` con `hreflang` | nada |
| AC-16 rendimiento | static | tamaño de JS ≤150 KB gzip; Lighthouse móvil ≥90/100; LCP ≤2000 ms con perfil 4G de laboratorio | red limitada |
| AC-17 sin datos ni cookies | integration + e2e | ningún `Set-Cookie`; se interceptan todas las peticiones salientes del navegador y solo hay estáticos, Turnstile y `/api/*` con el cuerpo permitido | nada |
| AC-18 apex y www | manual + script | `curl -I` a http/https × apex/www devuelve la misma URL canónica | nada |
| AC-19 UTC y hora local | unit + e2e | ambas horas en cada registro; zona del navegador simulada | zona horaria |
| AC-20 reglas múltiples / ninguna | unit | gana la más severa y se listan todas; ninguna → Permitir | nada |
| AC-22 modo prueba | integration | sin `ALERTS_ENABLED` no se envía; pantalla "Modo prueba" | notificador espía |
| AC-23 revisión de plantillas | unit + static | sin `revisadaPor/revisadaEn` → "borrador pendiente"; el build de producción falla | nada |
| AC-24 ruleset público | static | `/demo/ruleset.v1.json` existe y su hash coincide con el mostrado | nada |
| AC-25 recarga y caducidad | integration + e2e | restaura la auditoría en 24 h; después "El registro expiró" | reloj |
| AC-27 doble clic | integration | token repetido → 403 y un solo evento/alerta | doble de Turnstile |
| AC-28 Turnstile no carga | e2e | mensaje claro y ejemplo estático | bloqueo de red |
| AC-29 ejemplo estático | static | etiquetado como no real; no afirma entrega | nada |
| AC-30 accesibilidad dinámica | e2e | `aria-live` anuncia 4 cambios; `prefers-reduced-motion` sin animación; axe sin violaciones | nada |
| AC-31 páginas legales | static | existen y mencionan hash de IP, Turnstile, Telegram, 24 h | nada |
| AC-33 canónico e idiomas | static | `/` con `canonical` a `/en/`; `hreflang` en/es/x-default; el sitemap solo lista `/en/` y `/es/` | nada |

Pruebas de seguridad adicionales (de spec §10): concurrencia (50 peticiones simultáneas ≤1 envío por visitante y ≤20 globales); inyección en cada campo; respuesta de cada endpoint contra la lista de campos permitidos (S17); orden D-03 con espías (cupo agotado nunca llama al notificador); fallo inyectado en D1, Telegram y correo (D-06); intento de SSRF (D-01); ninguna cadena SQL concatenada (S13); prohibición de `dangerouslySetInnerHTML` (S15).

- **Línea del e2e:** el e2e cubre el recorrido completo en modo prueba con Turnstile de prueba y Telegram simulado. El envío real a Telegram se prueba **una vez, a mano, antes de publicar** (lista de T091), porque ninguna prueba automática puede probar que mi teléfono lo recibió.
- **Dependencias que deben ser reales:** D1 local (la atomicidad del cupo no se prueba con un doble), el navegador real en el e2e, y el verificador de Turnstile con claves de prueba. Si no es real, esa prueba no significa nada.
- **Orden de pruebas rojo-verde:** el núcleo puro se construye primero precisamente para que `implement` pueda hacer TDD sin infraestructura.

## 6. Sequencing & dependencies

1. **Puertas, herramientas y limpieza** (T001–T007) — serial. T006 y T007 retiran las dependencias y el código del layout anterior. Requieren decisiones de Dennys (T002) y, antes de `implement`, ratificar la constitución (T003).
2. **Núcleo puro** (T010–T024) — serial dentro; **paralelizable con 5 y 6** tras T005 (archivos distintos).
3. **Almacén y firma de `eventId`** (T030–T038) — depende de 2 (formas de registro) y de T004.
4. **Adaptadores, interruptor de corte y handlers** (T040–T059, T067–T068) — depende de 2 y 3. Verificador, notificador y correo son paralelizables entre sí.
5. **Cabeceras (estáticas y de la API), seguridad e infraestructura** (T060–T066, T069) — paralelizable con 4 (T060–T062); runbooks humanos (T063–T064) pueden empezar ya.
6. **Frontend de la demo** (T070–T079) — depende de la forma de `AuditView` (2) y del contrato de API (3 de este plan); el e2e (T077) depende de 4.
7. **Sitio, contenido y capa de máquinas** (T080–T089) — paralelizable con 3–6 salvo el prerender, que espera al componente de demo.
8. **Cierre** (T090–T094, T099) — revisión humana de plantillas, lista previa a publicar, revisión adversarial y `verify`.

- **Restricciones duras de orden:** firma de `eventId` (T038) y middleware (T066) antes de los handlers (T049, T051, T053); cupo atómico antes que notificador (T031 antes de T049); interruptor (T068) antes de T048; revisión de plantillas antes de cualquier build de producción (T090); constitución ratificada antes de `implement` (T003); runbook de Cloudflare ejecutado por Dennys antes del e2e en vista previa real (T063).
- **Candidatos paralelos:** T010–T024 ∥ T060–T062 ∥ T080–T083; T040/T042/T044 entre sí.

## 7. Risks & open decisions

**Riesgos** (ordenados por probabilidad × impacto; identificadores K1–K12 para no chocar con las reglas R-01..R-03)

| # | Riesgo | Disparador | Impacto | Mitigación / prueba que lo retira |
| --- | --- | --- | --- | --- |
| K1 | Agotar la cuota gratuita (100 000 peticiones/día compartidas) por abuso o éxito | Pico de tráfico o ataque de volumen | Demo y Functions caen ese día hasta las 00:00 UTC | Regla de límite en el borde; validación barata primero; degradar a "no disponible"; el sitio estático no depende de Functions. Prueba: simulacro de D1 caída (T058) |
| K2 | Contenido sin evidencia o con datos no confirmados llega a producción | P-04/P-05/P-06/P-09 sin respuesta | Pérdida de credibilidad con el reclutador | Marcadores `pending` y compuerta de build que lista cada uno (T080). Nada de cifras no verificadas |
| K3 | Carrera en el cupo permite más alertas que el tope | Muchas peticiones simultáneas | Spam a mi Telegram | Cupo atómico por sentencia única; prueba de concurrencia (T031) |
| K4 | Cambios de plataforma: Pages vs Workers con activos estáticos | Cloudflare orienta el producto hacia Workers | Rehacer configuración de despliegue | Núcleo puro y puertos aíslan la lógica; spike T005b de verificación con fuente primaria antes de T060 (verificar el estado vigente de Pages Functions) |
| K5 | Semántica de Telegram distinta de la supuesta (`retry_after`, límites de edición) | Respuesta 429 o edición rechazada | Estado de alerta incorrecto | Contrato mínimo basado solo en `ok`/`message_id`/`description`; tratar todo lo demás como `Failed`; spike en T042 leyendo la sección completa de la API |
| K6 | Prerender complica el build y la hidratación | Diferencias entre HTML y cliente | SEO degradado o parpadeos | Generar HTML con el mismo componente en un paso de build y probar con JS apagado (T084) |
| K7 | Presupuesto de JS (≤150 KB) no cabe con React + isla | Dependencias de animación | LCP y Lighthouse fallan | Animación con CSS; isla cargada diferida; medición en T088; sin librerías de animación |
| K8 | La constitución se ratifica con reglas que contradicen el plan | P-14 | Retrabajo | Plan marcado supuesto; `analyze` vuelve a cruzar tras ratificar |
| K9 | La revisión humana de plantillas se atrasa | Dennys ocupado | Bloquea publicar (por diseño) | T090 es compuerta explícita; el ejemplo estático puede mostrar "borrador" mientras tanto |
| K10 | Correo de respaldo no disponible gratis | Proveedor cambia o exige pago | Sin respaldo | Spike T046; si no hay opción, solo Telegram + registro y fallo visible |
| K11 | Falsas expectativas de "Entregada" | Lectura literal en el teléfono | Afirmación inexacta | Texto "Entregada a Telegram" y aviso en la pista |
| K12 | Pruebas e2e inestables por Turnstile | Reto interactivo | CI intermitente | Solo claves de prueba de Turnstile en e2e |

**Decisiones abiertas**

- Herramientas nuevas para `implement` (ejecutor de pruebas, CLI de Cloudflare, accesibilidad/Lighthouse, e2e): cierra con la aprobación de Dennys (T002) y con la ratificación de la constitución (T003).
- Analítica (P-17): por defecto ninguna en v1; T094 es condicional.
- Elección entre `react-dom/server` para prerender y otra técnica: se decide en T084 tras medir; cualquiera de las dos queda dentro del presupuesto.
- Dirección visual concreta: cierra cuando Dennys elige entre 2–3 propuestas de la skill `design` (T081).
- Proveedor de correo de respaldo: cierra con el spike T046 y P-10.
- P-01 a P-18: abiertas, con supuestos por defecto.

**Decisiones tomadas al planificar** (registradas en `../decisions.md`): D-PLAN-01 núcleo puro con puertos; D-PLAN-02 cupo reservado antes de enviar y consumido aunque falle; D-PLAN-03 el servidor devuelve identificadores de plantilla y parámetros, no texto libre; D-PLAN-04 purga oportunista sin cron; D-PLAN-05 `eventId` firmado como enlace de solo lectura; D-PLAN-06 modo prueba por defecto fuera de producción; D-PLAN-09 las cabeceras de `/api/*` las fija un middleware (Cloudflare no aplica `_headers` a Functions); D-PLAN-10 la firma de `eventId` se hace antes de los handlers; D-PLAN-11 interruptor de corte de 60 s en D1; D-PLAN-12 hash de visitante sin fecha y cupos retenidos 25 h; D-PLAN-13 sin campo trampa ni tiempo mínimo (solo Turnstile de un uso); D-PLAN-14 `/` con canónico a `/en/`; D-PLAN-15 sin analítica en v1.

## Tasks
<!-- generated by tasks on 2026-10-29; IDs are stable, do not renumber -->

**Orden de ejecución:** manda la columna *Depends-on*, no el número ni la posición en la tabla (los IDs son estables y varias tareas se insertaron después; p. ej. T037–T038 y T065–T069).

Convenciones de comandos (se concretan en T001/T004; son el contrato de verificación): `npm test` (unit+contract+integration), `npm run test:e2e`, `npm run test:static`, `npm run build`, `bash scripts/verify.sh`. Una tarea "(prueba)" termina cuando la prueba existe y falla por la razón correcta; la siguiente termina cuando está en verde sin regresiones. Las tareas marcadas **[H]** son de Dennys (humanas) y no las ejecuto yo.

| ID | [P] | Task | Done-check | Depends-on | Trace |
| --- | --- | --- | --- | --- | --- |
| T001 |  | Ejecutar `sdd-init`: escribir `02-DOCS/wiki/sdd/config.yaml` y el esqueleto de `scripts/verify.sh` | `bash scripts/verify.sh` termina con código 0 en el repo actual; `config.yaml` existe | — | spec §12 (puerta verify) |
| T002 | ✅ | **[H]** Dennys aprueba la lista de dependencias de desarrollo nuevas (ejecutor de pruebas, CLI de Cloudflare, accesibilidad, Lighthouse, e2e) | `decisions.md` contiene una entrada "aprobada" con la lista y fecha | — | §0 Dependencias, S20 |
| T003 | | **[H]** ✅ Hecha 2026-10-29: constitución v1.0.0 ratificada con la skill `constitution` (P-14) | `constitution.md` sin `status: draft` y con `version: 1.0.0` | T002 | spec cabecera |
| T004 | ✅ | Instalar y configurar las herramientas aprobadas; scripts `test`, `test:e2e`, `test:static`, `verify` | `npm test` ejecuta y reporta 0 pruebas sin error; `npm audit --audit-level=high` termina en 0 | T001, T002, T003 | S20 |
| T005 | ✅ | Crear la estructura (`core/`, `functions/api/`, `migrations/`, `content/`, `scripts/`, `tests/`), `.env.example` sin valores y reglas de `.gitignore` | `git check-ignore .env .dev.vars` imprime ambos; `npm run test:static` ejecuta el escáner de secretos y pasa en vacío | T004 | S1 |
| T005b | | Spike: verificar con fuente primaria el estado vigente de Pages Functions, D1 en Pages y Turnstile; anotar fecha y fuentes en `decisions.md` | entrada con fuentes y fecha; riesgo K4 marcado cerrado o escalado | T004 | K4 |
| T006 | ✅ | Retirar `three`, `@react-three/fiber`, `@react-three/drei`, `@react-spring/three` y todo componente que los importe; quitar el `<link>` de Google Fonts y las cabeceras `<meta>` de `index.html` | `npm ls three @react-three/fiber @react-three/drei @react-spring/three` no lista ninguno; `npm run build` termina en 0; `grep -R "fonts.googleapis\|fonts.gstatic" index.html src` no devuelve nada | T004 | S20, AC-16, spec §6 |
| T007 | ✅ | Retirar Supabase (supuesto P-08): `src/lib/supabase.js`, secciones de reseñas, `@supabase/supabase-js` y toda referencia a `VITE_SUPABASE_*`. Si Dennys decide conservarlo, esta tarea se convierte en "verificar RLS" (spec S4) | `npm ls @supabase/supabase-js` vacío; `grep -R "supabase\|VITE_SUPABASE" src index.html` vacío; el build no contiene la URL de Supabase | T004 | S4, S20, P-08 |
| T010 | ✅ | (prueba) Esquema y carga del ruleset: rechaza campos desconocidos; hash canónico estable | `npm test -- ruleset` falla: no existe el cargador | T005 | spec §5.3, AC-24 |
| T011 | ✅ | Implementar `content/ruleset.v1.json` (R-01..R-03 con umbrales de spec §5.3) y `core.loadRuleset` | T010 en verde; el hash no cambia al reordenar claves | T010 | spec §5.3 |
| T012 | ✅ | (prueba) `core.evaluate`: A→Limitar, B→Bloquear, C→Alertar; precedencia; ninguna regla → Permitir | `npm test -- evaluate` falla | T011 | AC-04, AC-20 |
| T013 | ✅ | Implementar `core.evaluate` | T012 en verde | T012 | AC-04, AC-20 |
| T014 | ✅ | (prueba de propiedad) Equidad: cambiar nombre, país, idioma, dispositivo y género sintéticos no cambia `Outcome` | `npm test -- fairness` falla o, si ya pasa, se demuestra con un mutante que lee `country` y hace fallar la prueba | T013 | AC-14 |
| T015 | ✅ | (prueba) Generador de escenarios: tres escenarios, IP de rangos de documentación, determinista con rng sembrado | `npm test -- scenarios` falla | T011 | spec §5.3 |
| T016 | ✅ | Implementar `core.scenario` | T015 en verde | T015 | spec §5.3 |
| T017 | ✅ | (prueba) Resolución de explicaciones: `reviewState` solo es Reviewed con `revisadaPor` y `revisadaEn`; build de producción falla con plantillas sin revisar | `npm test -- explain` falla | T011 | AC-23 |
| T018 | ✅ | Implementar `core.explain`, las plantillas ES/EN v1 en `content/explanations/` (todas `PendingReview`) y el script de compuerta de build que falla en modo producción si alguna plantilla no tiene `revisadaPor` y `revisadaEn` | T017 en verde; `npm run test:static -- explain-review` falla en modo producción y pasa en modo desarrollo | T017 | AC-23, P-16 |
| T019 | ✅ | (prueba) `core.buildAudit` y `core.effectiveState`: 12 campos de spec §5.6, UTC, hash del registro, cadena de hashes, estado efectivo | `npm test -- audit` falla | T013, T016 | AC-05, AC-19, AC-26 |
| T020 | ✅ | Implementar `core.buildAudit` y `core.effectiveState` | T019 en verde | T019 | AC-05, AC-26 |
| T021 | ✅ | (prueba) `core.renderAlert`: español, empieza por `[SIMULACIÓN]`, solo valores de listas cerradas; instantánea | `npm test -- alert-text` falla | T020 | AC-09, S15, D-02 |
| T022 | ✅ | Implementar `core.renderAlert` | T021 en verde | T021 | D-02 |
| T023 | ✅ | (prueba) Mutantes del núcleo: el motor que ignora la severidad, o que lee `country`, hace fallar al menos una prueba | informe de mutación o verificación manual de 3 mutantes: las 3 pruebas fallan | T013, T020 | AC-14, AC-20 |
| T030 | ✅ | Migraciones D1: `events`, `interventions`, `alert_slots` | la migración se aplica limpia sobre una base local vacía y se puede volver a aplicar sin error | T005 | spec §5.6, §10 |
| T031 | ✅ | (prueba) `Store.reserveSlot` atómico: 50 llamadas simultáneas ≤1 por visitante y ≤20 globales; ventana móvil | `npm test -- slots` falla | T030 | AC-07, AC-08, AC-32 |
| T032 | ✅ | Implementar `Store.reserveSlot` con una sentencia condicional única | T031 en verde con D1 local real | T031 | AC-32, S11 |
| T033 | ✅ | (prueba) Caducidad y purga: a las 24 h 30 min el evento no existe pero su cupo aún cuenta para la ventana global; a las 25 h 30 min las filas de cupo se purgan | `npm test -- retention` falla | T030 | AC-25, AC-32, D-05 |
| T034 | ✅ | Implementar `getEvent` con caducidad y `purgeExpired` oportunista | T033 en verde | T033 | AC-25, D-05 |
| T035 | | (prueba) `appendIntervention`: máximo 3, orden, cadena de hashes, `LimitReached` | `npm test -- interventions` falla | T030, T020 | AC-26 |
| T036 | | Implementar `putEvent`, `updateAlert`, `appendIntervention` | T035 en verde | T035 | AC-09, AC-26 |
| T037 | ✅ | (prueba) `signEventId`/`verifyEventId`: ida y vuelta; firma alterada, truncada o de otra clave → `Invalid`; comparación en tiempo constante | `npm test -- event-id` falla | T005 | D-04, AC-25 |
| T038 | ✅ | Implementar `signEventId` y `verifyEventId` | T037 en verde | T037 | D-04 |
| T040 | [P] | (prueba) Verificador de Turnstile con doble de red: token repetido, caducado, host ajeno, caída | `npm test -- verifier` falla | T005 | AC-27, S12 |
| T041 | | Implementar el adaptador del verificador (host esperado, un uso, tiempo límite) | T040 en verde; el contrato también pasa con la clave de pruebas | T040 | S12 |
| T042 | [P] | (prueba) Notificador de Telegram con doble de red: `Delivered` solo con `ok:true`+`message_id`; error → `Failed`; 4 s → `Unconfirmed`; el token no aparece en ninguna salida; `edit` | `npm test -- notifier` falla | T022 | AC-06, AC-21, S1, S17 |
| T043 | | Implementar el adaptador del notificador (destino fijo, tiempo límite 4 s, modo prueba `NotSent`) | T042 en verde | T042 | AC-06, AC-21, D-01 |
| T044 | | Spike: comprobar con fuente primaria si hay correo de respaldo gratuito y vigente; registrar el resultado y decidir | entrada en `decisions.md` con fuentes y decisión (implementar o descartar) | T005b | K10, P-10 |
| T045 | | (condicional a T044) Adaptador de correo con la misma interfaz y pruebas de contrato | si se implementa: `npm test -- email` en verde; si se descarta: tarea marcada "no aplica" con motivo | T044 | spec §5.8 |
| T046 | [P] ✅ | (prueba) Validación de entradas: tabla de inválidos (campo extra, enum, cuerpo grande, JSON roto, método/tipo) y asignación masiva (`decision`, `__proto__`) | `npm test -- validation` falla | T005 | AC-12, S8, S14 |
| T047 | ✅ | Implementar el esquema de validación compartido | T046 en verde | T046 | AC-12 |
| T048 | | (prueba) `POST /api/simulate`: orden D-03 con espías; cupo agotado o interruptor abierto no llaman al notificador; `AlertView` por caso (incluido `Paused`); respaldo por correo cuando Telegram falla o vence, con estado propio y sin segundo cupo; modo prueba; fallo de D1 cierra seguro | `npm test -- simulate` falla | T036, T038, T041, T043, T047, T057, T068 | AC-03, AC-06, AC-07, AC-21, AC-22, D-03, D-06, spec §5.7 |
| T049 | | Implementar `POST /api/simulate` (con respaldo y corte) | T048 en verde | T048, T066 | AC-03, D-03 |
| T050 | | (prueba) `POST /api/intervene`: acciones válidas, `eventId` firmado, 409 al cuarto, Escalar con y sin mensaje | `npm test -- intervene` falla | T038, T049 | AC-09, AC-26, D-04 |
| T051 | | Implementar `POST /api/intervene` | T050 en verde | T038, T050 | AC-09, AC-26 |
| T052 | | (prueba) `GET /api/event/:id`: 404 uniforme para inexistente, caducado y firma inválida | `npm test -- event` falla | T038, T049 | AC-25, D-04 |
| T053 | | Implementar `GET /api/event/:id` (usa `verifyEventId`) | T052 en verde | T052 | AC-25, D-04 |
| T054 | | (prueba) Lista blanca de respuestas (S17): cada respuesta de la API, incluidos errores, contiene solo los campos de `AuditView`, `InputView`, `AlertView` y `Error` de §3; ninguno de los "nunca presentes" | `npm test -- response-shape` falla; además comprueba las cabeceras de AC-13 en las respuestas reales de los tres endpoints | T049, T051, T053 | S17, AC-11, AC-13 |
| T055 | | Ajustar respuestas hasta cumplir la lista blanca | T054 en verde | T054 | S17 |
| T056 | ✅ | (prueba) Hash de visitante: HMAC sin fecha, estable durante 24 h (el tope de 10 min no se reinicia a medianoche), IP en claro nunca llega a la base | `npm test -- visitor-hash` falla | T030 | AC-17, AC-32, D-05 |
| T057 | ✅ | Implementar `visitorHash` | T056 en verde | T056 | D-05 |
| T058 | | (prueba) Fallo inyectado: D1, Telegram y correo caídos; la demo sigue o cierra seguro y lo dice | `npm test -- degrade` falla | T049 | D-06, K1 |
| T059 | | Ajustar manejo de fallos hasta cumplir T058 | T058 en verde | T058 | D-06 |
| T067 | | (prueba) Interruptor de corte: tras 429, 5xx o vencimiento se abre 60 s; con el interruptor abierto no se llama a Telegram y el estado es `Paused`; se cierra al vencer | `npm test -- breaker` falla | T036 | spec §10 S11 capa 5, D-06 |
| T068 | | Implementar `getBreaker`/`tripBreaker` y su uso en el orquestador | T067 en verde | T067 | spec §10 S11 capa 5 |
| T060 | [P] | Crear `public/_headers` para páginas estáticas con la política de spec §10 S18 (la API se cubre en T065/T066) | `npm run test:static -- headers` lee el build y confirma CSP, HSTS, `nosniff`, `frame-ancestors` y COOP en `/`, `/en/`, `/es/` y 404 | T005, T006 | AC-13, S18 |
| T061 | [P] | (prueba) Lista blanca de variables `VITE_*` y escáner de secretos sobre `dist/`, repo e historial | `npm run test:static -- secrets` falla si se inyecta un token falso y pasa sin él | T005, T007 | AC-11, S1, S3 |
| T062 | [P] | (prueba) Reglas estáticas: sin `dangerouslySetInnerHTML`, sin SQL concatenado, sin `fetch` a destinos no listados, sin `Set-Cookie` | `npm run test:static -- rules` falla ante un ejemplo malo y pasa en el código | T005 | S9, S13, S15, D-01 |
| T069 | [P] | (prueba) Sin IA por clic y superficie de rutas: falla si el código importa o llama a un proveedor de modelos, si un `fetch` apunta fuera de la lista cerrada de destinos, o si `functions/api/` contiene una ruta distinta de las tres previstas | `npm run test:static -- no-ai-routes` falla ante un import/URL/ruta de ejemplo y pasa en el código | T005 | AC-10, S6, D-01 |
| T063 | | **[H]** Runbook de Cloudflare ejecutado por Dennys: variables cifradas (producción y vista previa), D1, widget de Turnstile, regla de límite de tasa, "Always Use HTTPS", TLS mínimo 1.2, apex + `www` | `02-DOCS/wiki/sdd/runbooks/cloudflare-setup.md` con cada paso marcado y la fecha de cada verificación | T005b | S1, S11, S12, S19, AC-18 |
| T064 | | **[H]** Runbook de Telegram: crear el bot, guardar el token solo en Cloudflare, procedimiento de rotación (`/revoke`) ensayado | `runbooks/telegram-bot.md` con rotación probada y fecha | T063 | S1, spec §10.3 (robo del token) |
| T065 | | (prueba) Cabeceras de `/api/*` con manejadores de ejemplo (200, 4xx, 5xx, 404): toda respuesta trae CSP, `nosniff`, HSTS, COOP, `Cache-Control: no-store` y ningún `Set-Cookie` | `npm test -- api-headers` falla | T005 | AC-13, AC-17, S9, S18 |
| T066 | | Implementar el middleware de respuestas de las Functions (cabeceras comunes) | T065 en verde con los manejadores de ejemplo | T065 | AC-13, S18, D-PLAN-09 |
| T070 | | (prueba) Máquina de estados de la demo: reposo→ejecutando→decidido→intervención; errores; "Mostrar todo"; `prefers-reduced-motion` | `npm test -- demo-machine` falla | T020 | AC-03, AC-30 |
| T071 | | Implementar la máquina de estados | T070 en verde | T070 | AC-03 |
| T072 | | (prueba) Componentes: panel de auditoría (campos de `AuditView`), horas en UTC y en la hora local del navegador, visor de regla con "datos usados / no usados", estado de alerta, chips "Probar otro escenario" (A/B/C), "Mostrar todo" y barra Aprobar·Anular·Escalar; axe y `aria-live` con 4 anuncios | `npm run test:e2e -- demo-a11y` falla (incluye zona America/Guayaquil mostrando "UTC-5") | T071 | AC-05, AC-19, AC-30, spec §5.2 |
| T073 | | Implementar los componentes de la demo (estilos según la dirección elegida en T081) | T072 en verde; `axe` sin violaciones | T072, T081 | AC-05, AC-30 |
| T074 | | Cliente de API (con `scenario` opcional) + restauración con `sessionStorage`; integración con Turnstile (clave pública, estados de fallo) | `npm run test:e2e -- demo-client` en verde: recarga restaura, expirado muestra "El registro expiró", Turnstile bloqueado muestra mensaje, los chips envían el escenario elegido | T049, T053, T073 | AC-25, AC-28, spec §5.2 |
| T075 | | Ejemplo estático sin JS generado desde el núcleo con un caso fijo y etiqueta "no es un envío real" | `npm run test:static -- static-example` confirma etiqueta y ausencia de "Entregada" | T020 | AC-02, AC-29 |
| T076 | | Modo "Mostrar todo" y cronología de 30 s | `npm run test:e2e -- timing` mide ≤30 s y ≤2,5 s con "Mostrar todo" | T074 | AC-03 |
| T077 | | e2e completo en modo prueba: tres escenarios, tope, Anular, Escalar, fallo de Telegram simulado | `npm run test:e2e -- full-flow` en verde con claves de prueba de Turnstile | T049, T051, T074 | AC-03..AC-09, AC-21, AC-27 |
| T078 | | e2e de privacidad: se interceptan todas las peticiones salientes del navegador; solo hay estáticos, Turnstile y `/api/*` con el cuerpo permitido; ninguna respuesta lleva `Set-Cookie` | `npm run test:e2e -- privacy` en verde | T077 | AC-17, S9 |
| T079 | | Alojar fuentes propias, tema oscuro por defecto y claro por `prefers-color-scheme` | `npm run test:static -- fonts` confirma que el build no referencia dominios de fuentes externos y que la CSP lleva `font-src 'self'` | T081 | spec §6, S18 |
| T080 | [P] | Archivo de contenido bilingüe con los datos de spec §3 y marcadores `pending` por cada dato sin confirmar; compuerta que lista los `pending` en el build de producción | `npm run test:static -- content` lista los `pending` y falla en modo producción si hay alguno no autorizado | T005 | spec §3, §9, K2 |
| T081 | | **[H]** Proponer 2–3 direcciones visuales con la skill `design` y probarlas en navegador; Dennys elige | `docs/…/design-direction.md` con la elección de Dennys y fecha | T005 | spec §6 |
| T082 | | Implementar las secciones del sitio en el orden de spec §4 | `npm run build` termina en 0; `npm run test:e2e -- sections` encuentra las 10 secciones con ancla y, con viewport 360×640, el Hero muestra tesis, resumen y botón de la demo sin desplazarse | T080, T081 | spec §4, AC-01 |
| T083 | [P] | Diagrama SVG de la fábrica con `<title>`/`<desc>` accesibles y solo afirmaciones del prompt de Dennys | `npm run test:static -- svg` confirma título, descripción y ausencia de cifras | T080 | spec §4.3, P-04 |
| T084 | | Prerender ES/EN (HTML con el contenido clave) | `npm run test:static -- prerender` confirma el texto de la tesis en `/`, `/en/` y `/es/` sin ejecutar JS | T082 | AC-02 |
| T085 | | Capa de máquinas: JSON-LD, `llms.txt`, `dennys.json`, `robots.txt`, `sitemap.xml` (solo `/en/` y `/es/`), `canonical` de `/` hacia `/en/`, `hreflang` en/es/x-default | `npm run test:static -- machine` valida estructura, datos coherentes con el contenido y las reglas de AC-33 | T084 | AC-15, AC-33 |
| T086 | | Publicar `/demo/ruleset.v1.json` y plantillas, con el hash mostrado en la auditoría | `npm run test:static -- ruleset-public` confirma igualdad de hashes | T011, T084 | AC-24 |
| T087 | | Páginas `privacidad`, `términos` y `404` bilingües con el tratamiento real de datos | `npm run test:static -- legal` confirma las menciones de AC-31 | T084 | AC-31 |
| T088 | | Presupuestos: tamaño de JS, Lighthouse móvil, LCP, WCAG | `npm run test:static -- budgets` ≤150 KB gzip; Lighthouse ≥90/100; LCP ≤2000 ms con perfil 4G de laboratorio | T006, T007, T082, T084, T093 | AC-16 |
| T089 | | **[H]** Comprobar apex y `www` con `curl -I` en las cuatro variantes | salida guardada en `runbooks/cloudflare-setup.md` con la misma URL canónica | T063, T087 | AC-18, S19 |
| T090 | | **[H]** Revisión humana de plantillas ES/EN: rellenar `revisadaPor`, `revisadaEn` y versión | `npm run test:static -- explain-review` pasa; el build de producción ya no se bloquea | T018 | AC-23, P-16 |
| T091 | | **[H]** Lista previa a publicar: rotar token, enviar una alerta real desde producción y comprobarla en el teléfono, revisar el escáner de cabeceras externo | `runbooks/preflight.md` completa con fechas | T063, T064, T077, T090 | AC-06, S18 |
| T092 | | Revisión adversarial con `refuter-security`, `refuter-tests`, `refuter-correctness` sobre todo el cambio | informe sin hallazgos críticos abiertos; cada hallazgo corregido o justificado | T077, T088 | spec §10 |
| T093 | | Eliminar lo que el rediseño ya no usa: secciones, estilos, imágenes y componentes del layout anterior que T082 no reutiliza (lista por diff de imports), y proponer a Dennys la lista de documentos sueltos obsoletos antes de borrarlos | `npm run build` y `npm test` en verde tras la limpieza; `npm run test:static -- unused` no encuentra archivos sin importar; lista de documentos aprobada por Dennys | T082 | S20, AC-16, spec §3 |
| T094 | | (condicional a P-17) Si Dennys elige Cloudflare Web Analytics: añadir la analítica, la excepción mínima de CSP y la mención en `privacidad`. Si elige ninguna: marcar "no aplica" | si se adopta: `npm run test:static -- headers` sigue en verde con la excepción y `legal` menciona la analítica; si no, "no aplica" con motivo | T060, T087 | AC-17, AC-31, P-17 |
| T099 | | Todas las comprobaciones en verde | cada fila anterior marcada; `bash scripts/verify.sh` termina con código 0 | todas | spec §12 |

**Interfaces de las tareas con contratos entre sí**

**T013 — Interfaces**
- Consumes: `loadRuleset(json) -> Ruleset | InvalidRuleset`; `Signals = { failedAttempts, windowSeconds, impliedSpeedKmh, isPrivilegedBulkExport, localHour }`
- Produces: `evaluate(rules, signals) -> { decision: "Block"|"Limit"|"Alert"|"Allow", matched: [{ruleId, ruleVersion}], effectiveRule }`

**T020 — Interfaces**
- Consumes: `Outcome` (T013), `SyntheticInput` (T016), `ExplanationRef` (T018)
- Produces: `AuditRecord = { eventId, createdAtUtc, input, engine: {name, version}, rulesetVersion, rulesetHash, matched, decision, explanation, modules[], alert, interventions[], recordHash }`; `effectiveState(interventions) -> { state: "Decided"|"Approved"|"Overridden", escalated: boolean }`

**T032 — Interfaces**
- Consumes: `visitorHash: string`, `now: Instant` (inyectado)
- Produces: `reserveSlot -> {kind:"Reserved", slotId} | {kind:"VisitorCap", lastAlertAt} | {kind:"GlobalCap", lastAlertAt} | {kind:"StoreDown"}`; ventanas: 600 s por visitante, 86 400 s global (máx. 20)

**T043 — Interfaces**
- Consumes: `text: string` (de `renderAlert`), `chatId`, `token` (solo del entorno)
- Produces: `send(text, channel) -> {kind:"Delivered", messageId?} | {kind:"Failed", code} | {kind:"Unconfirmed"} | {kind:"NotSent"}`; `edit(messageId, text) -> {kind:"Edited"} | {kind:"Failed", code}`; el valor de `token` no aparece en ninguna salida

**T048 — Interfaces**
- Consumes: puertos `Verifier.verify(token, host) -> Human|Bot|VerifierDown`; `Store.reserveSlot`, `getBreaker`, `tripBreaker`, `putEvent`, `updateAlert` (formas de §3); `Notifier.send(text, channel) -> Delivered|Failed|Unconfirmed|NotSent`; `signEventId` (T038); `visitorHash` (T057)
- Produces: orden D-03; el correo de respaldo comparte cupo; `audit.alert` según `AlertView`

**T054 — Interfaces**
- Consumes: `AuditView`, `InputView`, `AlertView` y `Error` exactamente como en §3 "Vistas de respuesta"
- Produces: prueba que falla ante cualquier campo fuera de esas listas o ante cualquiera de: ID de chat completo, token, claves, IP, hash de visitante, texto crudo del proveedor, traza

**T072 — Interfaces**
- Consumes: `AuditView` de §3 (campos: `eventId, createdAtUtc, scenario, input, engine, ruleset, matched, decision, explanation{templateId,version,params,reviewState,reviewedAt?}, modules, usedData, unusedData, alert, interventions, effectiveState, escalated, recordHash`); `AlertView.status` ∈ Delivered|Failed|Unconfirmed|Grouped|TestMode|Paused
- Produces: componentes que muestran UTC y hora local, chips de escenario (A/B/C), "Mostrar todo" y Aprobar·Anular·Escalar

**T049 — Interfaces**
- Consumes: puertos `Verifier`, `Store`, `Notifier`, `Clock`, `Rng`; validación T047
- Produces: respuesta `200 { eventId, audit: AuditView }` según §3 (la alerta va dentro de `audit.alert`); códigos `400 E_INPUT | 403 E_BOT | 429 E_RATE | 503 E_INTERNAL`; orden D-03; todas las respuestas pasan por el middleware (T066)

**T051 — Interfaces**
- Consumes: `verifyEventId` (T038), `Store.appendIntervention`, `Notifier.edit`
- Produces: `200 { audit }` | `404 E_NOT_FOUND` | `409 E_LIMIT`; tras la cuarta acción devuelve 409 sin escribir

## Review Workload Forecast

| Dimension | Forecast | Why |
| --- | --- | --- |
| Estimated changed lines | 5 000–8 000 (código, pruebas, contenido y runbooks) | 87 tareas (IDs T001–T099) con pares prueba/implementación, sitio completo bilingüe, build de máquinas |
| Files / areas | 8 áreas: `core/`, `functions/api/`, `migrations/`, `content/`, `src/` (demo y sitio), `scripts/` y build, `public/` (cabeceras, archivos de máquina, legales), `tests/` | atraviesa servidor, datos, interfaz, contenido y seguridad |
| Review risk | **alto** | endpoint público con efecto externo, secretos, topes y datos de visitantes; cambios de despliegue |
| Suggested delivery | **autochain** en rama de funcionalidad con entregas por fase (A núcleo, B almacén y API, C seguridad y cabeceras, D demo, E sitio y máquinas); presupuesto por defecto de 400 líneas superado, así que no `single-pr` | un único cambio sería inrevisable; el núcleo puro y las pruebas de seguridad deben revisarse primero |

_Aislamiento_: el repo está en `main` (abierto) y Dennys eligió trabajar directo sobre `main` (constitución, regla 16). Se recomienda aislar en un worktree; si se declina, se anota. `implement` arrancó el 2026-10-30 tras aprobar T002 (D-IMPL-01); sigue sin commits hasta que Dennys autorice P-13 (regla 18).
