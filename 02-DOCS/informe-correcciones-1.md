# Informe: correcciones 1 (2026-11-01)

Spec: `docs/superpowers/specs/2026-10-31-correcciones-1.md`. Estado: F1–F4 y C1–C10 implementados en el árbol de trabajo. **Sin commit, sin push, sin tocar Cloudflare ni secretos.** HEAD sigue en `4360858`.

## Evidencia
- `bash scripts/verify.sh`: OK (826 pruebas unitarias, build, compuertas estáticas). `npm audit` pasa en nivel alto; hay 5 avisos *moderados* nuevos en `lighthouse` (herramienta de desarrollo: glob/minimatch). No se tocó nada.
- `NODE_ENV=production npm run build`: OK. `npm run test:wrangler3`: compila.
- Playwright: 130/130 (89 de portada, secciones y tema; 36 de galería y demo; 5 con `wrangler pages dev`).
- Revisión adversarial (seguridad, pruebas, corrección): ningún crítico. Corregido con pruebas: resaltado del nodo activo en móvil (selector `aria-pressed` muerto); hoja móvil que se quedaba abierta con ratón; compuerta de nodos anclada al enlace del nodo; `:focus-visible` sin soporte; clic sin `pointerType`; marcador de Criden fuera del HTML; huecos de pruebas (contraste de `--code-bg`/`--accent-soft`/`--line`, blur, pointerleave táctil, retardo de intención, clic del interruptor, deportes en `llms.txt`/`dennys.json`). Mutantes verificados: matan.
- Hallazgo de mis propias pruebas e2e: el panel de Código tapaba el nodo Interés → techo del panel al 43 % del lienzo; y al cambiar de pestaña el panel se encogía bajo el puntero → pestañas en la misma celda.

## Hecho
- F1/F2: la barra ya no recibe el puntero fuera de sus enlaces y los nodos van por encima; 15 puntos por nodo en 1280×800, 1440×900, 1920×1080 y 1024×768 dan el propio nodo; círculo y etiqueta centrados (prueba).
- F3/C5: el inicio no tiene "Contacto", "Contactar" ni pie; el panel de Código no enlaza a Contacto; las demás páginas llevan pie con correo, LinkedIn, GitHub y CV, más página `/contacto/`.
- F4/C1 opción C: arco elíptico sobre los nodos; al señalar, anillo concéntrico con la cabeza y línea desde el borde del círculo; ningún trazo entra en la cabeza; simetría y concentricidad (±2 %) medidas en unitarias y e2e. Sin animación con movimiento reducido.
- C2: siete páginas (`código`, `proyectos`, `demo`, `trayectoria`, `cómo trabajo`, `interés`, `contacto`) en es y en, enlaces reales sin JS, sitemap/hreflang/canonical, llms.txt.
- C3: vista previa al pasar el mouse (120 ms), con foco de teclado, táctil (primer toque abre con botón "Abrir …", segundo navega), `Esc` cierra, sin aria-live, sin salto de layout. Sin JS: CSS `:hover/:focus-within`.
- C4: el inicio es solo la primera pantalla; el contenido de cada sección pasó a su página sin borrarse.
- C6: único `<h1>`: "Un poco de lo que hago, en pocos minutos." / "A little of what I do, in a few minutes."; sin deportes en ninguna salida (web, llms.txt, dennys.json); Interés solo con cerebro–IA.
- C7: panel y página "Trabajo en producción"; quitados solo contable, Football Manager y HARDLOCK (con pruebas reescritas); Criden añadido sin estado ni dirección.
- C8: brillo igual al boceto, centrado en la cabeza. C9: modo oscuro por tokens, interruptor en todas las barras, `localStorage` con try/catch, `/theme-init.js` externo, AA verificado por pares de tokens y axe en los dos temas.
- C10: capacidades con LLM, Chatbots con LLM y Agentes de IA acotado (prototipo, sin producción); sin bots autónomos, sin aprendizaje profundo, sin potencias ópticas.

## Valores por defecto usados (DECIDE DENNYS) → preguntas P-30…P-38
Criden sin insignia y con "enlace" oculto (P-30); no se añadieron Bot de reportes ni Bot Registry a Proyectos (P-31); Naunturia sigue en `llms.txt`/`dennys.json` (P-32); texto del asistente ISP tal como lo dicta el spec (P-33); `<title>`/descripción conservados (P-34); `/en/how-i-work/` (P-35); sin pie, Privacidad y Términos solo se alcanzan desde páginas interiores (P-36); espacio libre en móvil alto (P-37); "aprender de forma continua" no se pone (P-38).

## Pendiente / avisos
- **Contacto**: el spec C5 habla de "formulario y protecciones incluidas", pero el sitio no tenía formulario (la sección eran enlaces). La página `/contacto/` lleva esa sección tal cual; no se inventó un formulario.
- Sin contacto visible en el inicio: un reclutador llega por las páginas interiores o por CV (aviso del spec). El correo sigue en el JSON-LD del `<head>` (invisible).
- Limitaciones conocidas: sin `:has()` (Firefox < 121) la vista previa sin JS solo muestra Demo; la caja de la cabeza (`HEAD_BOX`) está medida sobre el retrato, no se deriva del píxel.
- Humanas, sin cambio: P-04, P-06, P-09 disponibilidad, P-22, fotos de la galería (P-29), push de los 7 commits ya hecho por Dennys (`main` en sincronía al empezar).
- Decisiones: `02-DOCS/wiki/sdd/decisions.md` (D-C1…D-C8). Preguntas: `02-DOCS/preguntas-pendientes-dennys.md`.
