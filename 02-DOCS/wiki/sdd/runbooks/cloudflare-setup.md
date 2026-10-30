---
type: runbook
title: Runbook — Cloudflare (T063 y T089)
tags: [sdd, runbook, cloudflare]
timestamp: 2026-10-30T04:30:00Z
topic: sdd
---

# Runbook de Cloudflare (lo ejecutas tú)

Constitución, regla 19: la infraestructura la ejecutas tú; un agente no entra en tu cuenta. Marca cada paso con la fecha cuando lo termines. **Ningún valor secreto se pega en el chat, en un archivo del repo ni en git.**

**Datos reales de tu cuenta (no son secretos):** proyecto de Pages **`dennysh-com`** · base D1 **`dennysh-demo`**, id `f5c40cfb-1031-46cc-8dbb-0b7b535f6210` (ya está en `wrangler.jsonc`).

Nombres de contrato (código en `server/services.js`):

| Variable | Dónde | Tipo |
| --- | --- | --- |
| `TURNSTILE_SECRET` | Pages → Settings → Variables (cifrada) | secreto |
| `TELEGRAM_BOT_TOKEN` | idem | secreto |
| `TELEGRAM_CHAT_ID` | idem | secreto |
| `VISITOR_HMAC_KEY` | idem (≥ 32 caracteres aleatorios) | secreto |
| `EVENT_HMAC_KEY` | idem (≥ 32 caracteres aleatorios, distinta de la anterior) | secreto |
| `ALERTS_ENABLED` | solo en **Producción**, valor `true` (en Vista previa déjala vacía: modo prueba) | texto |
| `TURNSTILE_HOSTS` | opcional; por defecto `dennysh.com,www.dennysh.com` | texto |
| `VITE_TURNSTILE_SITEKEY` | variable de **build** (clave pública del widget) | pública |

Generar una clave aleatoria en tu máquina: `openssl rand -base64 36` (cópiala directo al panel; no la guardes en archivos).

## T063 — Configuración

- [ ] 1. Proyecto de Pages **`dennysh-com`** (rama de producción `main`). Comando de build: `npm run build`. Directorio de salida: `dist`. Sin push no hay despliegue por Git: la primera publicación puede hacerse con `npx wrangler pages deploy dist --project-name dennysh-com`. _Fecha:_ ____
- [x] 2. Base D1 `dennysh-demo` **ya creada por Dennys** (id arriba, ya puesto en `wrangler.jsonc`). _Fecha:_ 2026-10-30
- [x] 3. Esquema aplicado en remoto **por Dennys** (4 tablas e índices de `migrations/0001_init.sql`, 2026-10-30); no hace falta repetirlo. Para volver a comprobarlo: `npx wrangler d1 execute dennysh-demo --remote --command "SELECT name FROM sqlite_master WHERE type='table'"` debe listar `alert_slots`, `breaker`, `events`, `interventions`. _Fecha:_ 2026-10-30
- [ ] 4. En Pages → Settings → Functions → D1 bindings, enlazar la base con el nombre `DB` (Producción y Vista previa). _Fecha:_ ____
- [ ] 5. Crear el widget de Turnstile (Cloudflare → Turnstile → Add widget) para `dennysh.com` y `www.dennysh.com`. Guardar la **clave secreta** como `TURNSTILE_SECRET` y la **clave pública** como `VITE_TURNSTILE_SITEKEY` (variable de build). _Fecha:_ ____
- [ ] 6. Cargar las variables cifradas de la tabla de arriba (Producción y Vista previa). Con la CLI: `npx wrangler pages secret put VISITOR_HMAC_KEY --project-name dennysh-com` (te pide el valor en la terminal). _Fecha:_ ____
- [ ] 7. Regla de límite de tasa (Security → WAF → Rate limiting rules) sobre `/api/*`: por IP, p. ej. 10 peticiones por minuto, acción bloquear 10 minutos. Es la capa 1 del tope (S11); las capas de código son las otras. _Fecha:_ ____
- [ ] 8. SSL/TLS → Edge Certificates: activar **Always Use HTTPS** y fijar **TLS mínimo 1.2**. _Fecha:_ ____
- [ ] 9. Dominios personalizados del proyecto Pages: **`dennysh.com` (apex) y `www.dennysh.com`** los dos. (El 2026-10-02 el apex dejó de responder porque solo estaba `www`: hay que comprobarlo de nuevo.) _Fecha:_ ____
- [ ] 10. Comprobar que NO hay secretos en el build: `npm run build && npm run test:static` debe decir `secrets OK`. _Fecha:_ ____

## T089 — Apex y `www` (AC-18, S19)

Ejecuta las cuatro variantes y pega la salida abajo. Todas deben terminar sirviendo la **misma URL canónica** (`https://dennysh.com/…`).

```bash
curl -sI http://dennysh.com/       | head -5
curl -sI https://dennysh.com/      | head -8
curl -sI http://www.dennysh.com/   | head -5
curl -sI https://www.dennysh.com/  | head -8
```

Salida (fecha ____):

```
(pega aquí)
```

- [ ] Las cuatro responden 200 o redirigen (301/308) a `https://dennysh.com/` o a `/en/`.
- [ ] `https://dennysh.com/` trae `content-security-policy`, `strict-transport-security` y `x-content-type-options: nosniff`.
- [ ] `https://dennysh.com/api/event/x` responde 404 con las mismas cabeceras.
