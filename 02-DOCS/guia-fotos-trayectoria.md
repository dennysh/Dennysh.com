# Guía corta: añadir fotos a Trayectoria

La línea de tiempo de `/es/trayectoria/` y `/en/journey/` se ve completa sin fotos. Cada foto que se declare aparece sola como miniatura en su entrada (la primera foto) y se amplía al hacer clic o tocar; todas las de la entrada se ven en la ampliación, con ‹ ›, las flechas del teclado, Esc y «Cerrar».

## Pasos

1. **Prepara el archivo.** WebP, sin metadatos (EXIF), ancho máximo 1600 px y **≤ 90 KB** (lo comprueba `bash scripts/verify.sh`). Opcional: una miniatura WebP de ≈ 160 px de ancho (`thumb`); si no la hay se usa la misma foto.
2. **Cópialo** a `public/images/trayectoria/` con un nombre claro: `fibratelecom-1.webp`, `fibratelecom-1-thumb.webp`…
3. **Decláralo** en `src/content/journey-photos.js`, bajo el id de la entrada:

   | Entrada | id |
   | --- | --- |
   | Fibratelecom | `fibratelecom` |
   | MS@Net | `msnet` |
   | Afiatic | `afiatic` |
   | Telydata | `telydata` |
   | ISMAC (formación) | `ismac` |
   | Bot Caja Cercana | `bot-caja-cercana` |
   | Super Gol Kids | `super-gol-kids` |

   ```js
   export const journeyPhotos = {
     fibratelecom: [
       { src: '/images/trayectoria/fibratelecom-1.webp', thumb: '/images/trayectoria/fibratelecom-1-thumb.webp', width: 1600, height: 1067,
         alt: { es: 'Técnico revisando una manga de fibra en un poste', en: 'Technician checking a fiber splice closure on a pole' } },
     ],
   }
   ```

   - `width` y `height` son el tamaño real en píxeles del archivo `src` (evitan saltos de maquetación).
   - `alt` en español **y** en inglés es obligatorio: describe lo que se ve, no «foto de…».
4. **Comprueba:** `npx vitest run tests/unit/journey-page.test.js` (valida que el archivo exista, que sea WebP en `/images/trayectoria/`, el tamaño y el texto alternativo es/en) y `bash scripts/verify.sh`.

Una entrada sin fotos no deja hueco ni marco. Si declaras una foto cuyo archivo no existe, la prueba falla. Cuando todas las fotos pendientes estén, P-29 puede cerrarse (quitar `photosPending` de `journeyPage` y su id de `AUTHORIZED_PENDING`).
