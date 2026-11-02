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

## A-04 · Cadencia de la revisión adversarial
- **Decisión:** pruebas enfocadas y comprobación en navegador después de cada bloque; `bash scripts/verify.sh` y una revisión adversarial con subagentes por grupo de bloques (grupo 1: contacto, proyectos y panel; grupo 2: accesibilidad e identidad), no una por commit.
- **Descartada:** una revisión de tres refutadores tras cada uno de los seis commits (coste alto y los bloques comparten archivos CSS).
- **Revertir:** n/a. Cada commit se puede revertir por separado con `git revert <hash>`.

## A-05 · "Bots para Telegram" sigue cerrado al cargar
- **Decisión (C-02):** no abrir el `<details>` por defecto; se añade la pista visible "Ver los 4 bots" y títulos de tarjeta en h2.
- **Descartada:** abrirlo por defecto (el spec de correcciones 2, D2, pide que se despliegue al pulsar y hay una prueba que exige que cargue cerrado).
- **Revertir:** quitar el `<span className="bots-hint">` de `src/components/TelegramBots.jsx` y las reglas `.bots-hint`.

## A-06 · Primera pantalla móvil: no se rehace
- **Decisión (C-10):** solo se aplican las partes baratas (tagline y barra a 12 px, objetivos de 44 px sin crecer la barra, nodos sin flotar). Las etiquetas de nodo siguen en 10 px (lo único bajo 12 px que queda) porque seis columnas de 59 px no admiten más; la prueba `a11y-css.test.js` lo declara como excepción.
- **Descartada:** retrato grande y nodos en 3×2: rehace el prototipo móvil medido y la geometría de las líneas.
- **Revertir:** n/a (queda aplazado en la crítica, C-10).

## A-07 · Identidad de interiores sin fuente nueva ni retrato en cabecera
- **Decisión (C-04):** misma voz de marca que el inicio (mono, mayúsculas, espaciada) y brillo cálido atenuado al 40 % detrás del encabezado; texto de la marca sin cambios.
- **Descartada:** fuente autoalojada (no se puede validar la licencia ni el archivo sin internet) y miniatura del retrato (cambia la identidad visual: decide Dennys).
- **Revertir:** quitar `.page::before` y volver `.brand` a `font-weight: 700` en `src/styles/site.css`.

## A-08 · Copy aprobado intacto
- **Decisión:** la revisión notó que "La forma más directa de contactarme es el correo." y "El formulario no está disponible por ahora. Escríbeme por correo:" se leen seguidos con el formulario apagado. Se deja así: ambos textos vienen de la tanda de correcciones 2 y no se cambia redacción sin que Dennys lo decida. Con el servidor apagado o sin respuesta se ven las dos frases y el botón; sin JavaScript se ve la primera y "Escríbeme por correo:".
- **Revertir/ajustar:** si Dennys prefiere una sola frase, cambiar `contactForm.disabled` en `src/content/site.js`.

## A-09 · Etiqueta "Cuándo puedo empezar"
- **Decisión (C-01):** el aviso "por confirmar" de disponibilidad (P-09) lleva la etiqueta "Cuándo puedo empezar" / "When I can start". No se usó la palabra "Disponibilidad" porque es la pista interna del marcador y la compuerta `pending-hints` impide que viaje en el JS público.
- **Revertir:** quitar `availabilityLabel` de `src/content/site.js` y de `src/pages/Pages.jsx`.
