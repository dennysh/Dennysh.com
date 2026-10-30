---
type: constitution
title: dennysh — Constitution
description: Reglas no negociables de dennysh.com (sitio de presentación y demo de decisión automatizada); versión ratificada.
tags: [sdd, constitution]
timestamp: 2026-10-29T23:00:00Z
topic: sdd
version: 1.1.0
ratified: 2026-10-29
last_amended: 2026-10-30
---

# dennysh — Constitution v1.1.0

> Ratificada el 2026-10-29 por instrucción directa del dueño ("ractificalo directamente"), sin recorrido regla por regla. Las reglas salen del diseño aprobado ([spec](../../../docs/superpowers/specs/2026-10-29-dennysh-demo-decision-design.md)) y del [plan](plans/dennysh-demo-decision.md); no se inventó nada nuevo. Si algo no refleja lo que Dennys quiere, se enmienda con el registro del final.

**Contexto.** Sitio público de presentación de Dennys Heras para que una empresa de vanguardia lo contrate, más una demo de decisión automatizada explicada. Proyecto de software en crecimiento, trabajado directamente sobre `main`.

## 1. Stack canon

1. **Base del sitio:** React 18 + Vite 7 (enmendada en v1.1.0; antes Vite 5, que tiene alerta alta en `npm audit`), página estática prerenderizada, desplegada en Cloudflare Pages. Cambiar de framework exige enmendar esta constitución.
2. **Servidor de la demo:** solo Cloudflare Pages Functions, con D1 para datos y Turnstile para anti-bot. Ningún servicio propio en la laptop forma parte de la ruta de la demo.
3. **Lógica de decisión:** vive en un núcleo puro sin red, reloj ni azar propios (plan D-PLAN-01).
4. **Dependencias nuevas** (de ejecución o de desarrollo) solo con aprobación escrita de Dennys en `02-DOCS/wiki/sdd/decisions.md` (plan T002). Versiones fijadas con *lockfile*; sin paquetes sin uso.
5. **Sin modelos de IA por clic:** ningún flujo iniciado por un visitante llama a un modelo. Verificado por prueba estática (AC-10, plan T069).

## 2. Quality bar

6. **TDD:** toda lógica nace con una prueba que falla por la razón correcta antes de la implementación (plan, par prueba/implementación).
7. **Puerta de verificación:** `bash scripts/verify.sh` termina con código 0 antes de dar nada por terminado; ejecuta pruebas, análisis estático y `npm audit --audit-level=high`.
8. **Honestidad de estado:** una tarea no se marca hecha sin evidencia observada (salida de comando, prueba en verde, captura). "Entregada" solo con confirmación real del proveedor (AC-06, AC-21).
9. **Equidad:** la decisión no depende de nombre, país, idioma, dispositivo ni género; una prueba de propiedad lo demuestra (AC-14).
10. **Revisión adversarial** de seguridad, pruebas y corrección antes de publicar (plan T092).

## 3. Conventions

11. **Contenido:** solo datos reales de `src/data/` o entregados por Dennys. Todo lo demás es marcador `pending`, y el build de producción lista cada marcador (spec §9, plan T080). Nunca cifras, clientes ni logros inventados.
12. **Idiomas:** `/en/` inglés y `/es/` español, un solo archivo de contenido bilingüe; `/` sirve inglés con `canonical` a `/en/` (AC-33).
13. **Explicaciones de la demo:** una plantilla solo dice "revisada por humano" si lleva `revisadaPor` y `revisadaEn`; sin eso el build de producción falla (AC-23).
14. **Commits:** formato gitmoji (el guard del arnés está instalado).
15. **Orden de las tareas:** manda *Depends-on* de la lista de tareas, no el número del ID (los IDs son estables).

## 4. Branching & shipping

16. **Los cambios entran directo a `main`** (elegido en la instalación del arnés). Antes de `implement`, el plan recomienda aislar en una rama o worktree propio; esa recomendación se anota si se declina.
17. **Autoría de git es humana:** commits y PR a nombre de Dennys Heras (identidad ya configurada). Sin `Co-Authored-By` de una IA ni pie "generated with". Se aplica en `ship`. *Nota:* las instrucciones del sistema de esta sesión piden un pie de coautoría; esta regla es la del dueño y prevalece sobre ese pie.
18. **Commit y push los autoriza Dennys.** Ningún agente hace commit ni push sin esa autorización (P-13).
19. **Los cambios de infraestructura** (Cloudflare, secretos, bot de Telegram) los ejecuta Dennys con los runbooks; un agente no toca su cuenta.

## 5. Security & privacy floor

20. **Secretos solo en variables cifradas del servidor.** Nunca en frontend, git, registros ni mensajes de error. Variable pública permitida con prefijo `VITE_`: solo la clave pública de Turnstile. Prueba de búsqueda en `dist/`, repo e historial (AC-11).
21. **Cero texto libre del visitante** llega a Telegram, correo, SQL o HTML. Entradas con esquema estricto, listas cerradas y rechazo de campos extra (S8, S14, AC-12).
22. **Orden barato-primero** en el endpoint que dispara alertas: método y tamaño, esquema, Turnstile, cupo atómico, interruptor, decisión, envío (D-03). Un cupo agotado jamás invoca a Telegram.
23. **Topes de alerta:** 1 cada 10 min por visitante y 20 en ventana móvil de 24 h en total (AC-07, AC-08, AC-32).
24. **Cabeceras de seguridad** (CSP sin `unsafe-inline`/`unsafe-eval`, HSTS, `nosniff`, `frame-ancestors 'none'`) en todas las respuestas: estáticas por `_headers`, `/api/*` por middleware (AC-13).
25. **Privacidad:** el visitante no entrega datos; sin cookies; la IP nunca se guarda en claro; retención de 24 h (cupos 25 h) (AC-17, D-05).
26. **Respuestas mínimas:** solo los campos definidos en el plan §3; errores con códigos propios, sin trazas, sin ID de chat completo (S17, AC-11).
27. **Costo cero:** nada de pago por uso. Si se agota una capa gratuita, la demo degrada a "sin alerta real" o "no disponible" y lo dice (D-06).
28. **HTTPS** en apex y `www`, con una URL canónica (AC-18, S19).
29. **La demo no es herramienta de ataque:** sin destinos configurables, datos sintéticos, rotulada como simulación (D-01, D-07).

## 6. UX / accessibility floor

30. **WCAG 2.2 AA**, navegable por teclado, `aria-live` solo para cuatro cambios, respeta `prefers-reduced-motion` (AC-30).
31. **Funciona sin JavaScript** en lo esencial: tesis, resumen, JSON-LD y un ejemplo estático etiquetado como no real (AC-02, AC-29).
32. **Móvil primero:** el Hero muestra tesis, resumen y botón de la demo en 360×640 sin desplazarse (AC-01).

## 7. Performance budgets

33. **JS inicial ≤ 150 KB gzip**, **LCP ≤ 2,0 s** en 4G de laboratorio, **Lighthouse móvil ≥ 90 de rendimiento y 100 de accesibilidad** (AC-16).
34. **Latencia de `/api/simulate`:** p95 ≤ 2,5 s y máximo 5 s, con espera de Telegram limitada a 4 s (AC-03).

## 8. Knowledge & decisions

35. **Decisiones registradas** con fecha, alternativas y motivo en `02-DOCS/wiki/sdd/decisions.md`.
36. **Preguntas abiertas de Dennys** viven en `02-DOCS/preguntas-pendientes-dennys.md`; un supuesto por defecto se marca "por confirmar" hasta que él responda.
37. **Hechos externos** (límites de planes gratuitos, comportamiento de Cloudflare o Telegram) se verifican en fuente primaria y se anotan con fecha antes de depender de ellos.

## Definition of Done (lo que `verify` mide)

- [ ] Prueba escrita primero, vista fallar y luego en verde (regla 6).
- [ ] `bash scripts/verify.sh` en 0, incluida la auditoría de dependencias (regla 7).
- [ ] Todos los criterios de aceptación de la tarea trazados y demostrados (regla 8).
- [ ] Búsqueda de secretos limpia en `dist/`, repo e historial (regla 20).
- [ ] Cabeceras presentes en estáticos y en `/api/*` (regla 24).
- [ ] Respuestas de la API solo con campos permitidos (regla 26).
- [ ] Presupuestos de rendimiento y accesibilidad cumplidos (reglas 30, 33).
- [ ] Sin marcadores `pending` no autorizados ni plantillas sin revisar en el build de producción (reglas 11, 13).
- [ ] Decisión registrada si la tarea tomó una (regla 35).
- [ ] Sin commit ni push sin autorización de Dennys (regla 18).

## Amendment log

| Versión | Fecha | Cambio | Por qué |
| --- | --- | --- | --- |
| 1.0.0 | 2026-10-29 | Ratificación inicial: 37 reglas derivadas del diseño aprobado, el plan y los datos de la instalación del arnés | Cerrar el hallazgo F01 de `analyze` y habilitar `implement` |
| 1.1.0 | 2026-10-30 | Regla 1: Vite 5 → Vite 7 (con `@vitejs/plugin-react` 4.7 y Vitest 5) | Vite 5 incumple la regla 7 (`npm audit --audit-level=high` en 0); decisión de Dennys en la sesión de `implement` (D-IMPL-03) |
