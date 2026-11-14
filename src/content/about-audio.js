// Audio de «Sobre mí»: Dennys lo entrega después. Lista vacía = el reproductor no se pinta (ni hueco ni control roto).
// Cada archivo va en public/audio/ y se declara aquí; se sirve desde /audio/ (la CSP lo permite: sin `media-src`, manda `default-src 'self'`).
// { src: '/audio/sobre-mi-es.mp3', type: 'audio/mpeg', lang: 'es', title: { es: 'Presentación', en: 'Introduction' } }
// `lang` ('es' | 'en') filtra por idioma de la página; sin `lang`, el archivo sirve para los dos. Sin reproducción automática, nunca.
export const aboutAudio = []
