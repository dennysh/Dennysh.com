// Fotos de la línea de tiempo de Trayectoria. Dennys las entrega después (P-29); mientras este objeto esté vacío la página se ve completa, sin huecos.
// Guía corta: 02-DOCS/guia-fotos-trayectoria.md. Una clave por entrada (el `id` de la línea de tiempo en src/content/site.js):
//   fibratelecom, msnet, afiatic, telydata, ismac, bot-caja-cercana, super-gol-kids
// Cada foto: { src, thumb?, width, height, alt: { es, en } }
//   src     ruta pública del WebP de la ampliación (p. ej. '/images/trayectoria/fibratelecom-1.webp'), ≤ 1600 px de ancho y ≤ 90 KB, sin EXIF.
//   thumb   miniatura WebP opcional (≈ 160 px de ancho); si falta, se usa `src`.
//   width, height   tamaño real en píxeles del archivo `src` (evita saltos de maquetación).
//   alt     texto alternativo en español e inglés: obligatorio, describe lo que se ve (una prueba lo exige).
// La primera foto de cada entrada es la miniatura; todas se ven en la ampliación (con ‹ › y las flechas del teclado).
// Ejemplo:
//   fibratelecom: [
//     { src: '/images/trayectoria/fibratelecom-1.webp', thumb: '/images/trayectoria/fibratelecom-1-thumb.webp', width: 1600, height: 1067,
//       alt: { es: 'Técnico revisando una manga de fibra en un poste', en: 'Technician checking a fiber splice closure on a pole' } },
//   ],
export const journeyPhotos = {}
