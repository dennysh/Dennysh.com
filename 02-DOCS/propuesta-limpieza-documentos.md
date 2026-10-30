---
type: proposal
title: Propuesta — documentos sueltos del layout anterior
tags: [sdd, cleanup]
timestamp: 2026-10-30T04:00:00Z
topic: sdd
---

# Propuesta: documentos sueltos que ya no describen el sitio

T093 pide proponer la lista **antes** de borrar. Nada de esto se ha tocado. Marca cada uno con *borrar*, *conservar* o *reescribir*.

| Archivo | Qué es | Por qué podría sobrar | Mi sugerencia |
| --- | --- | --- | --- |
| `README.md` | Descripción del sitio anterior | Habla del layout 3D anterior, de Supabase y de comandos que ya no existen | **Reescribir** (lo hago yo cuando digas) |
| `CHECKLIST.md` | Lista de tareas del sitio anterior | Sustituida por el plan SDD (`02-DOCS/wiki/sdd/plans/`) | Borrar |
| `INSTALLATION_GUIDE.md` | Guía de instalación del sitio anterior | Los comandos reales ahora son `npm test`, `npm run build`, `npm run test:e2e` | Borrar |
| `PROJECT_SUMMARY.txt` | Resumen del sitio anterior | Contiene cifras del layout anterior que no se pueden publicar sin confirmar (P-05) | Borrar |
| `logo-options.html` | Pruebas de logotipos | Material de exploración sin uso en el sitio nuevo | Borrar o mover fuera del repo |
| `symbol-options.html` | Pruebas de símbolos | Idem | Borrar o mover fuera del repo |
| `docs/superpowers/plans/` | Planes antiguos | Revisar si algún contenido sigue vigente | Revisar contigo |
| `src/data/content.js`, `src/data/projects.js` | Datos del sitio anterior | **Se conservan**: son la fuente de los datos reales (constitución, regla 11). Al confirmar tú el contenido nuevo (`src/content/site.js`), pueden borrarse junto con `public/images/tech/` | Conservar por ahora |

Ya borrados por T093 (huérfanos que ningún archivo importaba, recuperables con `git`): las secciones, componentes y estilos del layout anterior (`src/sections/`, `src/components/*` salvo `Txt.jsx`, `App.*`, `index.css`), imágenes sin referencia (`logo.svg`, `favicon-tight*.png` salvo 64 y 192, `logo-miniatura.png`, `bot-caja-cercana-redactada.*`) y `public/.keep`.
