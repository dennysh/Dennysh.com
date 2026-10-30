---
type: runbook
title: Runbook — Bot de Telegram (T064)
tags: [sdd, runbook, telegram]
timestamp: 2026-10-30T04:30:00Z
topic: sdd
---

# Runbook del bot de Telegram (lo ejecutas tú)

El token es un secreto: **solo** vive en las variables cifradas de Cloudflare. Yo nunca lo veo. Si el token apareciera en un chat, un archivo o git, se considera comprometido y se rota (más abajo).

## Crear el bot

- [ ] 1. En Telegram, abrir **@BotFather** → `/newbot` → elegir nombre y usuario. Copiar el token que entrega **directo** al panel de Cloudflare (`TELEGRAM_BOT_TOKEN`). _Fecha:_ ____
- [ ] 2. Abrir tu bot y enviarle un mensaje (`hola`). Sin esto el bot no puede escribirte.
- [ ] 3. Obtener tu `chat_id` sin dejar el token en el historial de la terminal: en el panel de Cloudflare ya está el token; para leer el id usa un navegador privado en `https://api.telegram.org/bot<TOKEN>/getUpdates` pegando el token solo en la barra de direcciones, busca `"chat":{"id":NÚMERO}` y guarda ese número como `TELEGRAM_CHAT_ID`. Cierra la ventana. _Fecha:_ ____
- [ ] 4. Confirmar que el chat es **privado contigo** (un id positivo). No uses un grupo.
- [ ] 5. En BotFather: `/setprivacy`, `/setjoingroups` → **Disable** (que nadie meta el bot en grupos).

## Rotación (ensayarla antes de publicar)

Cuándo: sospecha de fuga, o antes de publicar por primera vez (T091).

- [ ] 1. BotFather → `/revoke` → elegir el bot. Entrega un token nuevo y el viejo deja de funcionar al instante.
- [ ] 2. `npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name dennysh` (pegar el nuevo).
- [ ] 3. Reintentar el despliegue de Producción (Pages → Deployments → Retry) para que lea la variable.
- [ ] 4. Probar con la lista de `preflight.md` (alerta real).
- [ ] 5. Anotar la fecha del ensayo: ____

## Qué hace y qué no hace la demo con Telegram

- Envía solo texto fijo que empieza por `[SIMULACIÓN]`, sin `parse_mode`, sin nada que escriba el visitante.
- "Entregada a Telegram" solo cuando la API responde `ok:true` con `message_id`. Si falla o tarda más de 4 s, la pantalla lo dice.
- Tope: 1 alerta cada 10 min por visitante y 20 en ventana móvil de 24 h en total. Tras un 429, 5xx o tiempo agotado el envío se pausa 60 s.
