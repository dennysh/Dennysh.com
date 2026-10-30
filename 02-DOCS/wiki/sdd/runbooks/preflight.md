---
type: runbook
title: Lista previa a publicar (T091)
tags: [sdd, runbook, preflight]
timestamp: 2026-10-30T04:30:00Z
topic: sdd
---

# Lista previa a publicar (la completas tú)

Hazla en orden. Todo lo que falle se arregla antes de apuntar el dominio.

- [ ] 1. `runbooks/cloudflare-setup.md` completa (T063) y `telegram-bot.md` completa (T064). _Fecha:_ ____
- [ ] 2. Plantillas de explicación revisadas (T090): `revisadaPor` y `revisadaEn` rellenos en `content/explanations/v1.json` para las 4 plantillas. `NODE_ENV=production npm run test:static -- explain-review` pasa. _Fecha:_ ____
- [ ] 3. Marcadores `pending` resueltos o autorizados: `NODE_ENV=production npm run test:static -- content` pasa (ver `02-DOCS/preguntas-pendientes-dennys.md`: P-04, P-06, P-09, P-22). _Fecha:_ ____
- [ ] 4. `bash scripts/verify.sh` termina en 0 y `npm run test:e2e` pasa. _Fecha:_ ____
- [ ] 5. **Rotar el token** del bot (ver `telegram-bot.md`). _Fecha:_ ____
- [ ] 6. **Alerta real desde producción:** abrir `https://dennysh.com/en/`, pulsar "Simulate anomalous access", y comprobar en el teléfono que llega un mensaje que empieza por `[SIMULACIÓN]` con un enlace. La pantalla debe decir "Delivered to Telegram" **solo** si llegó. _Fecha:_ ____
- [ ] 7. Pulsar "Escalate" en esa ejecución y comprobar que el mismo mensaje se actualiza (no llega otro). _Fecha:_ ____
- [ ] 8. Segunda pulsación dentro de 10 min: debe salir "Grouped with the HH:MM alert" y no llegar otro mensaje. _Fecha:_ ____
- [ ] 9. Escáner externo de cabeceras (p. ej. securityheaders.com y el de Mozilla Observatory) sobre `https://dennysh.com/` y sobre una respuesta de `/api/event/x`. Anotar la nota: ____
- [ ] 10. T089: `curl -I` de las cuatro variantes pegado en `cloudflare-setup.md`. _Fecha:_ ____
- [ ] 11. `Lighthouse` móvil sobre producción ≥ 90 / 100 (`npm run test:lighthouse` apunta al build local; en producción usa PageSpeed Insights). _Fecha:_ ____
- [ ] 12. Revisar `02-DOCS/propuesta-limpieza-documentos.md` y responder qué se borra (T093).
- [ ] 13. Autorizar el push (hoy NO está autorizado; solo hay commits locales).
