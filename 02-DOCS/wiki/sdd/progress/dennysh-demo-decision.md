---
type: progress
title: Avance de implement — dennysh-demo-decision
tags: [sdd, implement]
timestamp: 2026-10-30T01:40:00Z
topic: sdd
slug: dennysh-demo-decision
---

# Avance de implement

Sin commits: P-13 no está autorizada (regla 18). El avance queda en el árbol de trabajo.

## T001 — 2026-10-30
- status: complete
- evidence: `bash scripts/verify.sh` → `verify OK` (exit 0); `02-DOCS/wiki/sdd/config.yaml` existe
- decision: D-IMPL-02

## T002 — 2026-10-30
- status: complete
- evidence: D-IMPL-01 en `decisions.md` (aprobación de Dennys en el chat)

## T004 — 2026-10-30
- status: complete
- evidence: `npm test` → sin pruebas, sin error; `npm audit --audit-level=high` → 0 vulnerabilidades
- decision: D-IMPL-03 (Vite 7, constitución v1.1.0, elegida por Dennys)
- note: scripts `test`, `test:e2e`, `test:static`, `verify` en `package.json`. Falta `npx playwright install chromium` (descarga de navegador) antes de la primera prueba e2e.

## T006 — 2026-10-30
- status: complete
- evidence: `npm ls three @react-three/fiber @react-three/drei @react-spring/three` → vacío; `grep -R "fonts.googleapis\|fonts.gstatic" index.html src` → vacío; build en 0
- files: src/sections/Stack.jsx, src/App.jsx, index.html (borrado: src/components/TechOrbit.jsx)

## T007 — 2026-10-30
- status: complete
- evidence: `npm ls @supabase/supabase-js` → vacío; grep `supabase|VITE_SUPABASE` en src e index.html → vacío; 0 coincidencias en `dist/assets/*.js`
- files: borrados src/lib/supabase.js, src/sections/Reviews.*, src/sections/ReviewForm.* (supuesto P-08 por confirmar)

## T005 — 2026-10-30
- status: complete
- red: `npm test` falló: no existía `scripts/lib/scan-secrets.mjs`; luego una prueba de falso positivo (`${VAR:?msg}`) falló por aserción
- green: 6 pruebas en verde; `npm run test:static` → "92 archivos sin secretos"; `git check-ignore .env .dev.vars` imprime ambos
- files: scripts/lib/scan-secrets.mjs, scripts/test-static.mjs, tests/unit/secret-scan.test.js, vitest.config.js, .env.example, .gitignore, carpetas core/ functions/api/ migrations/ content/ tests/

## T010 + T011 — 2026-10-30
- status: complete
- red: `npm test -- ruleset` → "Cannot find module core/ruleset.js"
- green: 7 pruebas; hash estable al invertir claves en profundidad y distinto al cambiar un umbral
- note: una prueba mía estaba mal (el replacer de `JSON.stringify` actúa como lista blanca y borraba claves anidadas); corregí la prueba sin tocar la implementación ni relajar la aserción
- decision: `loadRuleset` es asíncrona (Web Crypto, común a Node, Workers y navegador) y devuelve `{ok, ruleset|reason}`; condiciones en lista cerrada `speed-above | burst | off-hours-export`
- files: core/ruleset.js, content/ruleset.v1.json, tests/unit/ruleset.test.js

## T012 + T013 — 2026-10-30
- status: complete
- red: `npm test -- evaluate` → "Cannot find module core/evaluate.js"
- green: 12 pruebas (3 escenarios, precedencia, vacío → Allow, fronteras 900 km/h, 10/60 s, [07:00, 20:00))
- decision: horario laboral es [07:00, 20:00): las 20:00 exactas alertan (la spec dice "fuera de 07:00–20:00" sin precisar el borde); `localMinutes` desde medianoche
- files: core/evaluate.js, tests/unit/evaluate.test.js

## T014 — 2026-10-30
- status: complete
- red: la prueba pasó de entrada (el motor ya no lee atributos protegidos); se demostró que puede fallar con 3 mutantes (leen país, idioma, dispositivo) que sí la rompen
- green: 3 pruebas; 500 casos × 5 variaciones con generador sembrado (sin dependencias nuevas)
- files: tests/unit/fairness.test.js

## T015 + T016 — 2026-10-30
- status: complete
- red: `npm test -- scenarios` → "Cannot find module core/scenario.js"
- green: 7 pruebas; A/B/C evaluan a Limit/Block/Alert con el motor real; IP en rangos RFC 5737; determinista con rng sembrado
- deviation: el contrato del plan §3 decía `scenario(id, rng, now)`; `now` no se usa (los escenarios no dependen de la hora), así que la firma es `scenario(id, rng)`. Un id desconocido devuelve `{ok:false, reason}`
- files: core/scenario.js, tests/unit/scenarios.test.js

## Checkpoint — 2026-10-30
- `bash scripts/verify.sh` → verify OK; 35 pruebas unitarias en verde
- commits por tarea autorizados (D-IMPL-04); sin push

## T017 + T018 — 2026-10-30
- status: complete
- red: `npm test -- explain` → "Cannot find module core/explain.js"
- green: 13 pruebas; `NODE_ENV=production npm run test:static -- explain-review` sale 1 y nombra las 4 plantillas; en desarrollo sale 0
- deviation: `explain(outcome, templates, lang, ctx)` lleva un 4.º argumento `ctx = {ruleset, signals}` porque los umbrales y valores observados salen de ahí; el contrato del plan §3 no lo traía
- decision: las plantillas de `content/explanations/v1.json` son **borradores v0 míos, todas PendingReview**; Dennys las revisa en T090 (P-16). Marcadores `{observed.x}`/`{thresholds.x}` los sustituye el cliente
- files: core/explain.js, content/explanations/v1.json, scripts/test-static.mjs, tests/unit/explain.test.js

## T019 + T020 — 2026-10-30
- status: complete
- red: `npm test -- audit` → "Cannot find module core/audit.js"
- green: 22 pruebas de auditoría; total 70 en verde
- decision: `recordHash` sella solo la parte inmutable (identidad, entrada, regla, decisión, explicación, módulos, datos); la alerta, las intervenciones y el estado efectivo cambian después y no lo alteran. Las intervenciones encadenan hashes con `chainInterventions(recordHash, lista)`; la vista pública (`AuditView`) no lleva esos hashes
- decision: `usedData`/`unusedData` son claves de lista cerrada; entre lo no usado figura `source-ip` además de nombre, nacionalidad, idioma, dispositivo y género
- refactor: `canonicalJson` y `sha256Hex` pasaron de `ruleset.js` a `core/hash.js`
- files: core/audit.js, core/hash.js, core/ruleset.js, tests/unit/audit.test.js

## T021 + T022 — 2026-10-30
- status: complete
- red: `npm test -- alert-text` → "Cannot find module core/alert-text.js"
- green: 10 pruebas (instantáneas exactas de A/B/C, `[SIMULACIÓN]`, ≤ 400 caracteres, hora de Guayaquil también al cruzar medianoche, entrada hostil no llega al mensaje, eventId inseguro sin enlace)
- decision: enlace del mensaje `https://dennysh.com/es/?evento=<eventId>` (supuesto; la página que lo lee es de T073-T075); texto plano sin `parse_mode`
- files: core/alert-text.js, tests/unit/alert-text.test.js

## Checkpoint — 2026-10-30 (T017-T022)
- `bash scripts/verify.sh` en 0; 80 pruebas unitarias en verde

## T023 — 2026-10-30
- status: complete
- evidence (3 mutantes manuales sobre `core/evaluate.js`, restaurado después): M1 ignora severidad → **sobrevivió** a las 80 pruebas (el orden natural de reglas ya daba la precedencia); añadí una prueba con reglas en orden inverso y ahora M1 falla; M2 lee `country` → falla; M3 `>=` en 900 km/h → falla. Original: 81 pruebas en verde

## T037 + T038 + T056 + T057 — 2026-10-30
- status: complete
- red: `npm test -- event-id visitor-hash` → módulos `server/*.js` inexistentes; green: 90 pruebas en total
- decision: el código de servidor compartido vive en `server/` (no en `functions/`, para que `functions/api/` contenga solo las tres rutas, T069). `eventId = <32 hex>.<firma HMAC de 128 bits en hex>`, comparación en tiempo constante; `visitorHash` sin fecha; IP ausente comparte un cubo estable
- files: server/hmac.js, server/event-id.js, server/visitor-hash.js, tests/unit/event-id.test.js, tests/unit/visitor-hash.test.js

## T046 + T047 — 2026-10-30
- status: complete
- red: `npm test -- validation` → "Cannot find module server/validation.js"; green: 24 pruebas (campo extra, `__proto__`, `constructor`, enums, tamaño, JSON roto, método, tipo)
- note: una prueba mía usaba `undefined` y el valor por defecto del parámetro la volvía JSON válido; la cambié a `null` sin tocar la implementación
- decision: método ≠ POST → 405, tipo ≠ JSON → 415, cuerpo > 4 KB → 413, todo con `{code:"E_INPUT"}`; el resto 400
- files: server/validation.js, tests/unit/validation.test.js

## T030 + T031 + T032 — 2026-10-30
- status: complete
- evidence: `migrations/0001_init.sql` se aplica dos veces sin error sobre base vacía (3 pruebas); sin columnas de IP ni texto libre; restricciones CHECK: 3 intervenciones máx. y acciones cerradas
- red: `npm test -- slots` → "Cannot find module server/store-d1.js"; green: 11 pruebas (tope 10 min, global 20 en ventana móvil de 24 h, 50 llamadas simultáneas: exactamente 20 reservadas / exactamente 1 por visitante, una sola sentencia INSERT condicional, StoreDown)
- decision: el SQL de D1 se prueba con `node:sqlite` (D1 es SQLite) mediante un doble `tests/helpers/d1.js`; sin dependencias nuevas. No se probó contra `wrangler d1` local (necesita `workerd`; queda para el e2e)
- files: migrations/0001_init.sql, server/store-d1.js, tests/helpers/d1.js, tests/unit/migrations.test.js, tests/unit/slots.test.js

## T033 + T034 — 2026-10-30
- status: complete
- red: 6 de 6 pruebas de `retention` fallaban (faltaban `putEvent`, `getEvent`, `purgeExpired`); green: 135 pruebas en total
- note: la tarea T033 dice "a las 24 h 30 min su cupo aún cuenta para la ventana global". Con ventana móvil de 24 h ese cupo ya queda fuera del tope; lo interpreto como "la fila sigue guardada (retención 25 h) pero ya no cuenta", y así lo prueban los tests. A las 25 h 30 min se purga
- decision: `putEvent` (de T036) se implementó aquí porque `getEvent` no se puede probar sin él; `getEvent` devuelve también `messageId` (interno, nunca sale en la API)
- files: server/store-d1.js, tests/unit/retention.test.js, tests/helpers/fixtures.js

## T035 + T036 + T067 + T068 (almacén) — 2026-10-30
- status: complete (la parte de almacén de T068; el uso del interruptor en el orquestador llega con T049)
- red: 12 pruebas fallaban (faltaban `appendIntervention`, `updateAlert`, `getBreaker`, `tripBreaker`); green: 147 en total. Un fallo propio (llamar `.first()` sin `.bind()` en el doble de D1) se corrigió en la implementación
- decision: `appendIntervention` es atómica por clave primaria `(eventId, seq)` con reintento; 10 llamadas simultáneas → exactamente 3 filas. `tripBreaker` usa `MAX(openUntil)`: nunca acorta una pausa abierta
- files: server/store-d1.js, tests/unit/interventions.test.js

## T040–T043 (verificador y notificador) — 2026-10-30
- status: complete
- red: ambos `Cannot find module`; green: 28 pruebas nuevas, 175 en total
- evidence: el token de Telegram y el ID de chat no aparecen en ninguna salida (error de red, 401, cuerpo con el token); `Delivered` solo con `ok:true` + `message_id` entero; 4 s por defecto → `Unconfirmed` sin reintento; `parse_mode` ausente; destino fijo; modo prueba no toca la red; el host de Turnstile se compara salvo en modo prueba
- decision: errores de Turnstile fuera de lista cerrada se reducen a `rejected`; secreto mal configurado o `internal-error` → `VerifierDown` (cierra seguro)
- note: el contrato real contra la clave de prueba de Turnstile y contra la API de Telegram requiere red y cuentas: no se ejecutó aquí (queda para el e2e T077 y el runbook T091)
- files: server/http.js, server/verifier.js, server/notifier.js, tests/unit/verifier.test.js, tests/unit/notifier.test.js

## T044 + T045 — 2026-10-30
- status: T044 complete; T045 **no aplica** (D-IMPL-06). Fuentes: Cloudflare Email Service pricing y Telegram Bot FAQ (consultadas hoy). Telegram `retry_after` sigue sin verificar

## T048 + T049 (orquestador) — 2026-10-30
- status: orquestador complete; el cableado de `functions/api/simulate.js` se hace tras T051/T053 junto con T054
- red: `Cannot find module server/simulate.js`; green: 31 pruebas (orden D-03 con espías, Bot/VerifierDown, cupos por visitante y global, interruptor 60 s, respaldo opcional sin segundo cupo, StoreDown cierra seguro, modo prueba)
- files: server/simulate.js, tests/helpers/harness.js, tests/unit/simulate.test.js

## T050–T053 (intervene y event) — 2026-10-30
- status: complete (lógica); el cableado Pages llega con T054/T055
- red: `Cannot find module server/intervene.js` y `server/event.js`; green: 230 pruebas en total (Aprobar/Anular, 409 al cuarto, 404 uniforme, Escalar con/sin mensaje, edición fallida visible, el id de mensaje de Telegram nunca sale)
- note: `AlertView.escalation` se persiste en `alertJson` (D-IMPL-07)
- files: server/intervene.js, server/event.js, tests/unit/intervene.test.js, tests/unit/event.test.js

## T049 + T054 + T055 (cableado Pages) — 2026-10-30
- status: complete
- red: `Cannot find module functions/api/simulate.js`; green: 235 pruebas. Los tres endpoints reales (`functions/api/simulate.js`, `intervene.js`, `event/[id].js`) pasan por la lista blanca `server/views.js` (un campo contaminado en el registro almacenado no llega a la respuesta) y por las cabeceras; errores solo `{code}`; ni token, chat completo, claves, IP ni hash de visitante aparecen
- evidence: `wrangler pages functions build` compila el Worker (imports JSON incluidos). No se ejecutó `wrangler pages dev` ni D1 local: queda para el e2e
- files: server/views.js, server/services.js, server/handlers.js, functions/api/*.js, functions/api/_middleware.js, tests/unit/response-shape.test.js

## T060 + T061 + T062 + T069 — 2026-10-30
- status: complete
- red: `Cannot find module scripts/static/headers.mjs`; green: 33 pruebas con ejemplos malos y buenos de cada regla
- evidence: ejecutor `npm run test:static` con 4 comprobaciones nuevas (`secrets` ampliado con variables `VITE_*` e historial de git, `headers`, `rules`, `no-ai-routes`). Con un archivo de ejemplo malo (`innerHTML`, `fetch(url)`) el ejecutor sale con 1 y lo nombra; sin él, pasa. `public/_headers` se genera desde la fuente única `server/security-headers.js`; `dist/_headers` coincide tras `npm run build`
- note: variable pública permitida `VITE_TURNSTILE_SITEKEY` (nombre del plan §4; `.env.example` corregido)
- files: scripts/static/{headers,secrets,rules,no-ai-routes}.mjs, scripts/gen-headers.mjs, scripts/test-static.mjs, public/_headers, tests/unit/static-rules.test.js

## T080 — 2026-10-30
- status: complete (con una salvedad: escribí el contenido y la prueba en la misma tanda, así que esta prueba no se vio roja antes; la compuerta `test:static -- content` sí se probó en ambos modos)
- evidence: EN y ES con la misma estructura; sin cifras inventadas ni "1,719" ni "técnicos reales" (P-05); solo "siete años" como dato personal numérico; 8 marcadores `pending` (P-04, P-06, P-09, P-22). `NODE_ENV=production npm run test:static -- content` sale 1 y los nombra mientras `AUTHORIZED_PENDING` esté vacío
- decision: proyectos en desarrollo y exploración tomados del archivo de la copia de la PC (la spec §4.5 los lista); el repo del bot de producción queda `pending(P-06)`. Nueva pregunta P-22 (Criden)
- files: src/content/site.js, tests/unit/content.test.js, scripts/test-static.mjs

## T075, T083–T087 y base de T072/T073/T082 — 2026-10-30
- status: T075, T083, T084, T085, T086, T087 complete; T072, T073, T074, T082 en curso (faltan los e2e)
- evidence: `npm run build` = `vite build` + `scripts/prerender.mjs` (react-dom/server vía Vite SSR, sin cambiar de framework): `/`, `/en/`, `/es/`, legales (`/en/privacy/`, `/en/terms/`, `/es/privacidad/`, `/es/terminos/`), `404.html`, `llms.txt`, `dennys.json`, `robots.txt`, `sitemap.xml` (solo `/en/` y `/es/`), `/demo/ruleset.v1.json` y plantillas. 16 pruebas de las comprobaciones con ejemplos buenos y malos; `npm run test:static` pasa sobre `dist/` (prerender, machine, legal, svg, fonts, budgets, static-example, ruleset-public). JS inicial 62,7 KB gzip (límite 150)
- decision: tipografía = pila del sistema (`system-ui`, `ui-monospace`), sin archivos de fuente: cumple "fuentes propias" con 0 bytes y sin dominios externos (T079 parcial; falta la dirección visual de T081). Estilos en variables (`src/styles/tokens.css`): dirección visual PROVISIONAL, oscuro por defecto y acento ámbar, hasta que Dennys elija
- decision: `scripts/verify.sh` ahora construye antes de las comprobaciones estáticas (necesitan `dist/`)
- note: los marcadores `pending` visibles en el sitio construido son 14 (P-04, P-06, P-09, P-22); el build de producción real exige que Dennys los autorice o los resuelva

## T072–T074, T076–T079, T082 (interfaz y e2e) — 2026-10-30
- status: complete, con la salvedad de que el estilo es PROVISIONAL (T081 la elige Dennys); T073, T079 y T082 se marcan hechas porque cumplen su done-check, no porque la dirección visual esté decidida
- evidence: `npx playwright test` → mocked 24/24 y real 5/5 (29 en total):
  - a11y: axe sin violaciones WCAG 2.2 AA en oscuro y claro, en `/en/`, `/es/` y `/en/privacy/`; `prefers-reduced-motion` muestra todo de golpe y sin animación; botones ≥ 44 px; teclado
  - horas: `America/Guayaquil` muestra `02:41:17 (UTC-5)` junto a `07:41:17.402 UTC`
  - tiempos: reproducción completa ≤ 30 s con cronología evento ~1 s / decisión ~6 s / alerta ~22 s; "Mostrar todo" ≤ 2,5 s; `aria-live` anuncia exactamente 4 cambios
  - cliente: recarga restaura, registro caducado dice "El registro expiró", Turnstile bloqueado muestra aviso y ejemplo estático etiquetado, chips envían el escenario, doble clic = 1 evento
  - AC-01: 360×640 muestra tesis, resumen y botón sin desplazarse (**falló primero**; arreglado compactando cabecera móvil y acortando las líneas del resumen)
  - pila real (`wrangler pages dev` + D1 local + Turnstile real con clave de prueba): tres escenarios → tres decisiones; tope por visitante (Grouped); Anular/Escalar/Aprobar hasta 3 y 409 a la cuarta; 404 uniforme; recarga restaura; ninguna cookie, solo estáticos + Turnstile + `/api` con cuerpo permitido, sin violaciones de CSP
- note (honestidad): las pruebas e2e se escribieron después de los componentes (no rojo→verde); su sensibilidad quedó demostrada porque AC-01 falló de verdad
- note: el envío a Telegram en e2e usa un token INVÁLIDO de prueba, así que hay una llamada real a `api.telegram.org` que responde error; es lo que prueba que "Entregada" no se afirma sin confirmación
- note (entorno): Chromium necesitaba librerías del sistema que faltaban y no hay `sudo`; las descargué con `apt-get download` y las extraje FUERA del repo (carpeta temporal de la sesión) usando `LD_LIBRARY_PATH`. En otra máquina basta `npx playwright install-deps`. La carpeta temporal no persiste
- decision: `npm run test:e2e` construye `dist-e2e` con la clave pública de prueba de Turnstile (`1x00000000000000000000AA`) y arranca vista previa estática + `wrangler pages dev` con enlaces de prueba; nada de eso es un secreto. `wrangler.jsonc` trae `database_id` marcador: lo rellena Dennys en T063
- files: playwright.config.js, tests/e2e/*.spec.js, tests/e2e/helpers.js, wrangler.jsonc, scripts/prerender.mjs (OUT_DIR), src/styles/*, src/content/site.js

## T088, T093, T094 — 2026-10-30
- T088 complete. evidence: `npm run test:lighthouse` (Lighthouse móvil sobre el build de producción, Chromium de Playwright): `/en/` y `/es/` rendimiento 100, accesibilidad 100, LCP 756–761 ms (presupuesto: ≥ 90 / 100 / ≤ 2000); JS inicial 62,7 KB gzip (≤ 150) con `test:static -- budgets`. note: es un perfil móvil simulado de laboratorio, no medición en dispositivo real
- T093 parcial: 43 archivos huérfanos del layout anterior borrados (secciones, componentes, estilos, imágenes sin referencia), detectados por `test:static -- unused` (grafo de imports + referencias a `public/`; 5 pruebas). `src/data/` se conserva a propósito (fuente de datos reales, regla 11). **Falta la aprobación de Dennys de la lista de documentos sueltos**: `02-DOCS/propuesta-limpieza-documentos.md`
- T094 no aplica: P-17 por defecto = sin analítica en v1
- fix: `vite.config.js` traía `server.open: true` (abría un navegador y rompía `vite preview` en scripts); se limpió y se quitaron las cabeceras duplicadas (viven en `server/security-headers.js`)
- note: `lighthouse` con `chrome-launcher` se colgaba con el headless shell; el script conecta Lighthouse al Chromium de Playwright por depuración remota (puerto 9333)

## T092 y cierre de esta tanda — 2026-10-30
- T092 complete: tres revisores adversariales independientes (`refuter-security`, `refuter-correctness`, `refuter-tests`). Cero críticos. Hallazgos válidos corregidos con prueba (D-IMPL-08, D-IMPL-09, D-IMPL-10); aceptados y justificados: tope de creación de eventos (MEDIO-2 de seguridad), `/api/intervene` sin Turnstile, `tests/` fuera del escáner
- evidence: `bash scripts/verify.sh` → exit 0 (449 pruebas, estáticas sobre `dist/`, `npm audit` 0); `npx playwright test` → 32/32 (24 con API simulada + 8 contra `wrangler pages dev` real); Lighthouse móvil `/en/` y `/es/`: 100 / 100, LCP ≈ 0,76 s
- T099: bloqueada solo por tareas humanas (T063, T064, T081, T089, T090, T091) y por la aprobación de la lista de documentos de T093
- note: un subagente (reanudado desde su vista de transcripción) informó que se le pidió "hacer push al main". No se hizo ningún push: no hay autorización de push en esta conversación (D-IMPL-04)
