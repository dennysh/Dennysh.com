# Decisiones autónomas · noche del 2026-11-02

Tomadas por Claude sin preguntar, por mandato de Dennys ("elige el valor por defecto recomendado y anótalo"). Cada una: decisión, alternativa descartada, cómo revertirla.

## A-01 · Commits de la base antes de tocar el diseño
- **Decisión:** antes de aplicar cambios de diseño, confirmar en commits locales lo que ya estaba en el árbol de trabajo (correcciones 1 y 2, informes, specs), para que cada cambio de diseño de la noche se pueda revertir por separado.
- **Descartada:** dejar todo mezclado en el árbol y hacer un solo commit al final (no permitiría revertir un cambio de diseño aislado).
- **Revertir:** `git reset --soft HEAD~N` en local (no hay push) o `git revert <hash>`.

## A-02 · Modo demostración: servidor propio en vez de `wrangler pages dev`
- **Decisión:** `scripts/demo-server.mjs` (Node, solo 127.0.0.1) sirve `dist-demo/` y responde `/api/contact` con la validación real y sin entrega.
- **Descartada:** `wrangler pages dev` con D1 local (exige configuración de Cloudflare y simula más de lo que hace falta; riesgo de tocar configuración real).
- **Revertir:** borrar `scripts/demo-server.mjs`, `tests/unit/demo-server.test.js`, los scripts `build:demo`/`demo` y la línea `dist-demo` de `.gitignore`.

## A-03 · Compilación demo sin clave de Turnstile
- **Decisión:** `VITE_TURNSTILE_SITEKEY=` vacío en `build:demo`, para que el cliente use el token de desarrollo y no cargue el script externo.
- **Descartada:** usar la clave de prueba pública de Cloudflare (requiere internet y el script externo).
- **Revertir:** quitar el prefijo de variable en `package.json`.
