// Aplica la preferencia de tema guardada antes de pintar (evita el parpadeo). Va como script externo porque la CSP no admite scripts en línea.
// El tema por defecto es OSCURO (tokens.css): sin preferencia guardada, sin JavaScript o con el almacenamiento bloqueado, se ve oscuro.
// Solo quien eligió claro con el interruptor recibe data-theme="light"; el sistema operativo ya no decide.
try {
  var t = localStorage.getItem('theme')
  if (t === 'dark' || t === 'light') {
    document.documentElement.dataset.theme = t
    var m = document.querySelector('meta[name="theme-color"]')
    if (m) m.setAttribute('content', t === 'light' ? '#f6f3ee' : '#15130f')
  }
} catch (e) { /* almacenamiento bloqueado: se queda el oscuro por defecto */ }
