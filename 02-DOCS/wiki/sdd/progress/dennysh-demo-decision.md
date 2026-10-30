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
