# Informe de la noche · 2026-11-02

Trabajo autónomo mientras Dennys dormía. Todo quedó en **15 commits locales** sobre `main` (de `0262bf1` a este informe), con autoría de Dennys Heras y **sin `Co-Authored-By`**. **No hay push.** No se tocó Cloudflare, el túnel, claves ni secretos, ni otras sesiones tmux ni otros proyectos. No se borraron ramas ni se reescribió historial. Solo `.rsc.json` sigue modificado en el árbol: no es de esta noche y no se incluyó en ningún commit.

## Lo pedido y su resultado

| # | Pedido | Resultado |
|---|---|---|
| 1 | Terminar `/impeccable critique` y `02-DOCS/critica-impeccable-1.md` | Hecho. Dos evaluaciones aisladas (diseño con capturas en 4 combinaciones de tema y tamaño; detector + medidas de navegador). Nielsen 2,75/4 (69 %). 26 hallazgos priorizados con corrección propuesta. |
| 2 | Aplicar críticos y altos; medios y bajos si son seguros y baratos | Hecho salvo lo aplazado (abajo). 5 bloques de diseño, un commit por tema. |
| 3 | Modo demostración local del formulario | Hecho. `npm run demo`. Guía en `02-DOCS/modo-demo.md`. |
| 4 | Pruebas, `verify.sh` y revisión adversarial tras cada bloque | Hecho (cadencia en A-04). 2 grupos de revisión con 3 refutadores. Hallazgos corregidos. |
| 5 | Commits locales por tema | Hecho (lista abajo). |

## Commits (para revertir cada cosa por separado: `git revert <hash>`)

| Hash | Tema |
|---|---|
| `0262bf1` | Base: correcciones 1 y 2 (que estaban sin commit) |
| `dce9d12` | Base: specs, informes y decisiones D-C1…D-C13 |
| `4570c45` | Modo demostración local |
| `7623bea` | Crítica Impeccable 1 y registro de decisiones autónomas |
| `4465c14` | C-01 Contacto apagado sin promesa de pasos, un botón de correo |
| `a9e52a1` | C-02, C-06 Tarjeta de Bots y jerarquía de encabezados |
| `a955939` | C-03 Pie "Abrir" fijo y un solo scroll en el panel |
| `949f30a` | C-05, C-07, C-08, C-09, C-24 Accesibilidad (más correcciones de la revisión del panel) |
| `a0d0080` | C-04 (parte), C-11, C-14, C-17, C-19, C-20, C-26 Identidad de interiores y arreglos baratos |
| `c2e1cf8`, `f5fd938` | Decisiones autónomas A-04…A-09 |
| `e37c2fb` | Corrección de la revisión: último enlace de la barra móvil bajo el difuminado |
| `a9258a5` | Pruebas de navegador para lo que solo se fijaba por texto de CSS |
| `8563ae3` | Estado de aplicación de la crítica |

## Evidencia (comandos y resultados)

- `bash scripts/verify.sh` → `verify OK` (pruebas, build de producción, comprobaciones estáticas, `npm audit --audit-level=high`). Quedan 5 avisos moderados en `lighthouse` (herramienta de desarrollo), como antes.
- `npx vitest run` → **998 pruebas, 58 archivos, todo verde** (antes 960 en 56).
- `npm run test:e2e` → **165 pruebas verdes** (antes 146): mocked + real con Wrangler, con axe en claro y oscuro.
- Medidas de navegador antes → después (mismo script en 9 páginas × 2 temas × 2 tamaños): contraste insuficiente 8 → 0; texto menor de 12 px 60 → 24 (todo lo que queda son las etiquetas de nodo móviles, a propósito); objetivos pequeños 148 → 0 (fuera de enlaces dentro de frases); saltos de encabezado 4 → 0; desbordes horizontales 0; errores de consola 0.
- Mutantes: los refutadores inventaron más de veinte; los vivos al principio (rejilla 3+2, diagrama móvil, bordes de `.pending` y `.rules`, relleno de la barra móvil) mueren ahora con pruebas de navegador (verificado a mano: 4 de 4).
- Seguridad (refutador): sin blockers. Recorrido de rutas del servidor demo (13 variantes), exposición (solo 127.0.0.1), sin lectura de entorno ni claves, sin `style=` ni scripts en línea (CSP), sin pistas internas en el JS público, sin clave de Turnstile en `dist-demo`.

## Modo demostración (lo que puedes usar ya)

```bash
cd ~/projects/dennysh && export PATH=$HOME/.local/opt/node/bin:$PATH
npm run demo        # http://127.0.0.1:4180/es/contacto/
```

Para verlo desde la otra computadora: `ssh -L 4180:127.0.0.1:4180 USUARIO@IP_LAPTOP` y abrir `http://127.0.0.1:4180/es/contacto/`. El formulario aparece activo; al enviar solo imprime el mensaje en la terminal. Correos de prueba: `limite@x.com` (demasiados intentos), `bot@x.com` (verificación fallida), `caido@x.com` (servicio caído). Detalle en `02-DOCS/modo-demo.md`.

## Decisiones autónomas

Ver `02-DOCS/decisiones-autonomas-2026-11-02.md` (A-01…A-09, cada una con alternativa descartada y cómo revertirla). Las que más conviene que revises:
- **A-01** Commits de la base (correcciones 1 y 2) antes de los de diseño.
- **A-05** "Bots para Telegram" sigue cerrado al cargar, con la pista "Ver los 4 bots".
- **A-06** La primera pantalla móvil no se rehizo.
- **A-07** Identidad de interiores: marca en mono y brillo, sin fuente nueva ni retrato en cabecera.
- **A-09** El aviso de disponibilidad (P-09) lleva la etiqueta "Cuándo puedo empezar".

Decisiones de contenido cerradas en los specs 1 y 2 (sin titular, frase única, líneas opción C, inicio limpio, textos, proyectos, capacidades, sin deportes): **no se tocaron**. Ningún texto aprobado cambió, salvo los añadidos nuevos: `leadOff` ("La forma más directa de contactarme es el correo."), `availabilityLabel`, `seeBots` ("Ver los N bots") y sus equivalentes en inglés.

## Lo que Dennys debe revisar

1. **Mirarlo con `npm run demo`**, sobre todo: Contacto apagado y activo, Proyectos, el panel de vista previa de Código y Cómo trabajo, y las páginas interiores en claro y oscuro. Las capturas de mis comprobaciones están en el scratchpad de la sesión (se pierden al cerrarla).
2. **Lo aplazado y sus preguntas** (en la crítica):
   - C-10 Rehacer la primera pantalla móvil (retrato grande, nodos en 3×2). Es lo más visible que queda.
   - C-04 ¿Miniatura del retrato junto a la marca en las interiores? ¿Fuente propia?
   - C-09 ¿Menú desplegable en móvil en lugar de la barra con difuminado?
   - C-15 ¿Resultado de ejemplo en Demo antes de pulsar?
   - C-12, C-13, C-16, C-22, C-23: Cómo trabajo es larga, Trayectoria repite "7 años", "INGLÉS B1" roza el hombro del retrato a 1440×900, "Volver" repetido, orden de Tab.
3. **Redacción con el formulario apagado:** se leen seguidas "La forma más directa de contactarme es el correo." y "El formulario no está disponible por ahora. Escríbeme por correo:" (A-08). Si prefieres una sola frase, cambia `contactForm.disabled`.
4. **Lo que sigue pendiente de antes** (no se tocó): proveedor de correo o Telegram para activar el formulario real, migración `0002` y `CONTACT_ENABLED`, texto de privacidad con el nombre del proveedor, fotos de la galería (P-29), P-04, P-06, P-09, P-22, P-39…P-43, y **el push** (15 commits locales nuevos; lo decides tú).
5. **Avisos del sistema de conocimiento:** siguen los conflictos de `02-DOCS/wiki` con `rsc/knowledge` (hay que juntarlos a mano) y el barrido del worklog hacia la wiki no se hizo esta noche.

## Limitaciones honestas

- Las comprobaciones de contraste sobre el brillo de fondo se calculan con los tokens en el peor punto del degradado; axe no puede medirlo. El detector de Impeccable necesitó Chromium con `--no-sandbox` en esta máquina.
- La revisión de diseño no abrió una por una las capturas de inglés ni todas las móviles de interiores; las medidas por script sí cubrieron las 36 combinaciones.
- No se probó en dispositivos reales (solo Chromium en Linux a 320, 360, 390, 1100, 1280 y 1440 px).
- `npm run test:wrangler3` no se volvió a correr: ningún archivo de `functions/` ni de `server/` cambió esta noche.
