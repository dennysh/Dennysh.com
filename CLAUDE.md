# dennysh.com

Sitio de presentación de Dennys Heras. Se trabaja con el arnés RSC (SDD).

La demo de decisión automatizada se quitó del sitio el 2026-11-09 (nodo, tarjeta, página y rutas); el backend (funciones, D1, Telegram) sigue en el repositorio, sin usar. La primera pantalla tiene cinco nodos y ninguna tarjeta en reposo. Detalle: `docs/superpowers/specs/2026-11-09-quitar-demo.md`.

La primera pantalla lleva una red de fondo (canvas, solo escritorio con puntero fino; `src/home/network.js`, `NetworkBackground.jsx`). Nunca se dibuja sobre la cara ni el cuerpo: su zona protegida sale de `src/home/geometry.js`. Detalle: `docs/superpowers/specs/2026-11-09-red-de-fondo.md`.

Trayectoria es una línea de tiempo con fotos opcionales (`src/components/Timeline.jsx`; las fotos se declaran en `src/content/journey-photos.js`, guía en `02-DOCS/guia-fotos-trayectoria.md`). Detalle: `docs/superpowers/specs/2026-11-09-trayectoria-linea-de-tiempo.md`.

El tema por defecto es oscuro para todo visitante nuevo, sin mirar el sistema; el claro solo con la preferencia guardada (`data-theme="light"`). Detalle y cómo revertir: `docs/superpowers/specs/2026-11-14-tema-oscuro-por-defecto.md`.

En móvil (≤ 760 px) la primera pantalla es una landing vertical: Dennys con una red propia (`network-mobile.js`, `MobileNetwork.jsx`) y, debajo, «Explorar» con cinco tarjetas sobre una línea de fibra (`Explore.jsx`). La lógica común de las dos redes está en `src/home/net-core.js`. Detalle: `docs/superpowers/specs/2026-11-14-movil-landing-vertical.md`.

## Knowledge map

| Qué | Dónde |
| --- | --- |
| Project constitution (SDD non-negotiables) | `02-DOCS/wiki/sdd/constitution.md` |
| Mapa completo del conocimiento | `02-DOCS/wiki/index.md` |
| Preguntas abiertas de Dennys | `02-DOCS/preguntas-pendientes-dennys.md` |
