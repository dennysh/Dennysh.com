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
