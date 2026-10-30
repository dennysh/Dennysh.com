---
type: analysis
title: Análisis de consistencia — dennysh-demo-decision (segunda pasada)
description: Lectura cruzada de constitución, spec, plan y tareas tras corregir los hallazgos de la primera pasada.
tags: [sdd, analyze]
timestamp: 2026-10-29T22:00:00Z
topic: sdd
slug: dennysh-demo-decision
---

# Análisis de consistencia — dennysh-demo-decision (segunda pasada)

Artefactos leídos: [constitución](../constitution.md) (borrador), [spec](../../../../docs/superpowers/specs/2026-10-29-dennysh-demo-decision-design.md) (33 criterios de aceptación), [plan y tareas](../plans/dennysh-demo-decision.md) (87 tareas). Este informe sustituye al de la primera pasada (sobrescrito, según el método). No modifica ningún artefacto.

## Veredicto

**GATE: PASS** — 0 críticos · 0 altos · 0 medios · 2 bajos (actualizado tras ratificar la constitución v1.0.0 el 2026-10-29).

F01 se cerró: la constitución quedó ratificada (v1.0.0). Se hizo una comprobación de cumplimiento de plan y tareas contra sus 37 reglas (sección siguiente). No quedan bloqueos para `implement`, salvo las compuertas humanas ya previstas (T002 herramientas, P-13 commits).

## Comprobaciones mecánicas de esta pasada

| Comprobación | Resultado |
| --- | --- |
| IDs de tareas únicos | 87 filas, 87 IDs distintos |
| Referencias de dependencias a tareas inexistentes | ninguna |
| Ciclos en el grafo de dependencias | ninguno; orden topológico válido |
| Criterios de aceptación de la spec sin tarea | ninguno (33 de 33 aparecen en algún trazo o done-check) |
| Criterios de aceptación ausentes del plan | ninguno |
| Textos obsoletos (`_headers` para la API, "fecha UTC" en el hash, "~20 al día", "campo trampa", "~45 tareas", ids `R1`) | ninguno en plan ni spec |
| Dependencias que apuntan a filas posteriores de la tabla | 6 (T048→T057/T068, T049→T066, T073/T079→T081, T088→T093). Es válido porque manda *Depends-on*; el plan lo declara ahora en una nota |

## Estado de los hallazgos de la primera pasada

| # | Estado | Cómo quedó |
| --- | --- | --- |
| F01 | Cerrado | Constitución v1.0.0 ratificada 2026-10-29 (T003 hecha) |
| F02 | Cerrado | Spec S18 y plan §0 corregidos; tareas T065/T066 (middleware) y T054 (cabeceras de las respuestas reales). Verificado en la documentación de Cloudflare |
| F03 | Cerrado | T037/T038 firman `eventId` antes de los handlers; T049, T050, T051 y T052 dependen de T038 |
| F04 | Cerrado | T006 (3D, fuentes y `<meta>`), T007 (Supabase, supuesto P-08), T093 (código sin uso); T060, T061 y T088 dependen de ellas |
| F05 | Cerrado | Plan §3 define `AuditView`, `InputView`, `AlertView` y `Error` con campos exactos; bloques Interfaces en T048, T054 y T072 |
| F06 | Cerrado | Fila S11 de la spec corregida a ventana móvil de 24 h (C-16) |
| F07 | Cerrado con supuesto | Hash de visitante sin fecha y cupos retenidos 25 h (C-17, P-19) |
| F08 | Cerrado con supuesto | Campo trampa y tiempo mínimo descartados (C-18, P-20) |
| F09 | Cerrado | Interruptor de corte de 60 s: T067/T068 y contrato `getBreaker`/`tripBreaker` |
| F10 | Cerrado | `AlertView.fallback`, estado `Paused`, T048 prueba el respaldo |
| F11 | Cerrado | T048 depende de T057, T038 y T068 |
| F12 | Cerrado con supuesto | Sin analítica en v1; T094 condicional (P-17 cambió de valor por defecto) |
| F13 | Cerrado | T069 (AC-10 y rutas), T078 (AC-17), T072 (AC-19), T082 (Hero 360×640), T088 (LCP) |
| F14 | Cerrado | Chips de escenario y "Mostrar todo" en T072 y T074 |
| F15 | Cerrado con supuesto | `/` con canónico a `/en/`; AC-33 nuevo; T085 ajustada (C-19, P-21) |
| F16 | Cerrado | T018 incluye el script de compuerta de build |
| F17 | Cerrado | T079 (fuentes propias, tema) |
| F18 | Cerrado | Pronóstico corregido a 87 tareas; riesgos renombrados K1–K12 |

## Hallazgos de esta pasada

| # | Sev. | Tipo | Artefacto A (lugar) | Artefacto B (lugar) | Conflicto | Resolver en |
| --- | --- | --- | --- | --- | --- | --- |
| F19 | LOW (corregido durante el análisis) | Ambigüedad | T066 (done-check) | T065 (prueba de los tres endpoints) | El done-check de T066 dependía de endpoints que se crean después. Se cambió a manejadores de ejemplo en T065 y las cabeceras de las respuestas reales se comprueban en T054 | `tasks` (hecho) |
| F20 | LOW | Mismatch | Plan §6 y tabla de tareas | Orden físico de filas | Por insertarse tareas con IDs estables, el orden de lectura de la tabla no coincide con el de ejecución. Mitigado con una nota ("manda *Depends-on*"); no hay renumeración por regla del método | `tasks` (aceptado) |

## Cobertura (resumen)

| Grupo | Estado |
| --- | --- |
| AC-01 a AC-33 | Todos con plan y tarea; los que eran ambiguos tienen ahora done-check que los demuestra (AC-01, AC-10, AC-16, AC-17, AC-19) |
| Controles S1, S3, S4, S6, S8, S9, S11 (5 capas), S12, S13, S14, S15, S17, S18, S19, S20 | Cubiertos por T005–T007, T031–T034, T040–T047, T054, T060–T069, T063, T089 |
| Controles D-01 a D-07 | Cubiertos |
| Deriva (plan o tarea sin requisito) | Ninguna: T006, T007, T093 y T094 se trazan a S20, S4, AC-16 y P-17 |

## Cumplimiento contra la constitución v1.0.0

| Regla | Plan y tareas | Resultado |
| --- | --- | --- |
| 1–5 pila y dependencias | §0 y §2; T002 (aprobación) y T069 (sin IA) | cumple |
| 6–10 calidad | pares prueba/implementación, T001/T099, T092 | cumple |
| 11–15 convenciones | T080, T018/T090, T085, nota de orden de ejecución | cumple; la regla 14 (gitmoji) no tiene tarea propia porque la aplica el guard del arnés |
| 16–19 ramas y autoría | pie del plan alineado con regla 16; T063/T064 las ejecuta Dennys | cumple tras ajustar el pie (F21) |
| 20–29 seguridad | T061, T046–T047, T048, T031–T032, T060/T065–T066, T033/T056, T054, T063, T069 | cumple |
| 30–34 UX y rendimiento | T072, T075, T082, T088, T076 | cumple |
| 35–37 conocimiento | decisions.md, preguntas pendientes, T005b/T044 | cumple |

Hallazgo de esta comprobación:

| # | Sev. | Tipo | A | B | Conflicto | Resolver en |
| --- | --- | --- | --- | --- | --- | --- |
| F21 | LOW (corregido) | Contradicción | Constitución regla 16 (directo a `main`) | Pie del plan: "worktree no es opcional" | El plan imponía el aislamiento; el dueño eligió `main` directo. Pie del plan ajustado a "recomendado; si se declina, se anota" | `plan` (hecho) |

## Supuestos que siguen por confirmar

Las respuestas por defecto de P-01 a P-21 son supuestos, no decisiones de Dennys. Los que más cambian la construcción si se contradicen: P-08 (T007 pasaría a verificar RLS en vez de quitar Supabase), P-17 (T094 se activaría con excepción de CSP), P-19 (hash), P-21 (canónico), P-02 (texto de "Entregada").

## Enrutamiento

- Sin acciones pendientes de fase. Siguiente fase: `implement`, tras las compuertas humanas T002 (herramientas) y P-13 (commits).

