# Modo demostración del sitio y del formulario

Sirve el sitio compilado en local con una API de mentira. **No envía correos, no guarda nada, no lee `.env` ni claves, no toca Cloudflare.**

## Uso

En la computadora donde está el código:

```bash
export PATH=$HOME/.local/opt/node/bin:$PATH   # solo si node no está en el PATH
npm run demo                                   # compila en dist-demo/ y arranca en http://127.0.0.1:4180
```

Abre `http://127.0.0.1:4180/es/contacto/` (o `/en/contact/`). Abajo se ve la etiqueta "MODO DEMOSTRACIÓN".

Para verlo desde otra computadora (túnel SSH, nada queda expuesto):

```bash
ssh -L 4180:127.0.0.1:4180 USUARIO@IP_DE_LA_LAPTOP
# y en el navegador de esa computadora: http://127.0.0.1:4180/es/contacto/
```

## Qué hace

- El formulario aparece **activo** y valida con el mismo esquema que el servidor real (`core/contact.js`): campos extra, consentimiento, longitudes y enums se rechazan igual.
- Al enviar, el mensaje solo se imprime en la terminal donde corre `npm run demo` (para que veas qué se recibiría) y se descarta.
- Sin widget de Turnstile (la compilación demo no lleva clave) y sin internet.
- Correos de prueba para ver cada aviso: `limite@x.com` → demasiados intentos, `bot@x.com` → verificación fallida, `caido@x.com` → servicio no disponible. Cualquier otro correo → enviado.
- Solo escucha en 127.0.0.1. Puerto: `DEMO_PORT=4181 npm run demo`.

## Qué no es

No prueba el envío real (eso falta: proveedor de correo, migración `0002` y `CONTACT_ENABLED`). Es solo para ver y criticar el flujo.

Archivos: `scripts/demo-server.mjs`, `tests/unit/demo-server.test.js`, scripts `build:demo` y `demo` en `package.json`, carpeta `dist-demo/` ignorada por git.
