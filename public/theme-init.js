// Aplica la preferencia de tema guardada antes de pintar (evita el parpadeo). Va como script externo porque la CSP no admite scripts en línea.
// Sin preferencia guardada, o sin JavaScript, manda prefers-color-scheme desde tokens.css.
try {
  var t = localStorage.getItem('theme')
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t
} catch (e) { /* almacenamiento bloqueado: se sigue al sistema */ }
