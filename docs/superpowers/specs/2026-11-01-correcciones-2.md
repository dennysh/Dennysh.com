# Correcciones 2 — respuestas a P-30…P-38 y formulario de contacto

Estado: decisiones de Dennys (2026-11-01). Reglas que siguen vigentes: NO push, NO tocar Cloudflare ni secretos. Commits: solo si Dennys los autoriza en el chat. Entregar en el árbol de trabajo, con pruebas y `bash scripts/verify.sh` en verde, revisión adversarial e informe en `02-DOCS/informe-correcciones-2.md`. Lo que diga **[DEFECTO]** usa el valor indicado y se anota en el informe, sin detenerse a preguntar.

## D1. Criden (responde P-30)
Criden está **en producción** y todavía **no tiene enlace**. En "Trabajo en producción" y en la página Proyectos: insignia "En producción" y sin enlace (no inventar dirección). Cuando Dennys dé la dirección se añade por el marcador `pending` existente (P-22). No mostrar "Enlace próximamente" si ya se ve raro: basta la insignia.

## D2. Bots de Telegram agrupados (responde P-31)
En lugar de listar los bots sueltos, un solo elemento **"Bots para Telegram"** que los encapsula:
- En la página Proyectos y en el panel "Trabajo en producción": un elemento "Bots para Telegram" que al pulsarlo (o con Enter) se despliega y muestra, en este orden: **Bot de registro de cajas · Bot de caja más cercana · Bot de reportes · Bot de planificación**.
- Debe funcionar sin JS (elemento `<details>`/`<summary>` o equivalente accesible), con teclado y con lector de pantalla; el despliegue no mueve el resto del layout bruscamente.
- Una línea por bot, solo con datos ya publicados en el sitio (Caja Cercana ya existe: reutilizar su texto y estado). Para registro de cajas, reportes y planificación: nombre y la línea "en producción" **[DEFECTO]** solo si Dennys dijo que están en producción; si el estado no consta en el repositorio o en `02-DOCS`, no mostrar estado y anotar la pregunta. Sin tecnologías, fechas ni cifras. Sin nombres de empresa ni datos de clientes.
- "Bot Registry" (P-31): no se añade como elemento aparte; si es el mismo que "registro de cajas", anotar la duda en el informe.
- Actualizar `llms.txt`, `dennys.json` y pruebas para que reflejen la misma lista (una sola fuente de datos en `site.js`).

## D3. Naunturia (responde P-32)
Se queda como está hoy (en desarrollo, sin enlace, "Proyecto en desarrollo") en la web, `llms.txt` y `dennys.json`, coherente con "quitar solo tres proyectos". Dennys podrá quitarlo después. Anotar en el informe que C6 y C7 se contradecían y qué se hizo.

## D4. Formulario de contacto adaptativo (responde la nota sobre C5)
Dennys: el formulario no existe y lo quiere, **con preguntas que se arman según la opción elegida**, enfocadas en lo que las personas que contratan suelen responder (presupuesto, plazo, alcance).

### Dónde
Solo en la página `/es/contacto/` · `/en/contact/` (el inicio sigue limpio). Los enlaces actuales (correo, LinkedIn, GitHub, CV) se quedan debajo del formulario.

### Flujo (pasos cortos, una pregunta a la vez, con barra de progreso y botón Atrás)
Paso 1, "¿Qué quieres hacer?" (una opción):
1. **Hacer una página web**
2. **Automatizar con bots o IA**
3. **Hablar conmigo** (oferta de trabajo, colaboración o consulta)
4. **Otra cosa**

Pasos según la opción:
- **Página web:** tipo de sitio (informativo, tienda, portafolio, otro) · presupuesto (rangos + "Aún no lo sé") · plazo (urgente/1 mes/2–3 meses/flexible) · ¿tienes dominio y contenido? (sí/no/en parte).
- **Bots o IA:** qué quieres automatizar (texto corto) · dónde se usaría (Telegram, web, otro) · presupuesto (rangos + "Aún no lo sé") · plazo.
- **Hablar conmigo:** motivo (oferta de trabajo, colaboración, consulta, otro) · empresa o proyecto (opcional) · cómo prefieres que responda (correo, videollamada).
- **Otra cosa:** mensaje libre.
Último paso común: nombre, correo, mensaje opcional, casilla de consentimiento (texto breve de uso de datos, con enlace a Privacidad). Resumen de lo elegido antes de enviar.

Rangos de presupuesto: **[DEFECTO]** neutros y en USD (por ejemplo "menos de 300", "300–1 000", "1 000–3 000", "más de 3 000", "Aún no lo sé"); NO publicar precios ni tarifas de Dennys. Todo texto del formulario en es y en.

### Reglas de seguridad (obligatorias)
- Validación en el servidor con esquema (tipo, longitud, enum para cada opción cerrada); rechazar lo inesperado. La del cliente es solo comodidad. (S14)
- Turnstile validado en el servidor y límite de tasa por IP y por correo, con respuesta 429. (S12, S11) Reutilizar lo que ya exista en `functions/` y la configuración de Turnstile; no pedir ni escribir secretos: si falta una clave, dejar el formulario desactivado y anotarlo.
- Texto de usuario siempre escapado, nunca como HTML; el envío por correo/almacén sin inyección de cabeceras (saltos de línea). (S13, S15)
- Sin secretos en el cliente ni en el repositorio; CSP sin `unsafe-inline`; sin dependencias nuevas salvo necesidad justificada (`npm audit`). (S1, S18, S20)
- Datos personales: guardar o enviar solo lo necesario; no devolver al cliente más que el estado. Aviso de privacidad actualizado (`privacidad.html`) con qué se recoge, para qué y quién lo recibe. (S5, S17)
- Entrega del mensaje: usar el mecanismo de envío que ya exista en el proyecto hacia dennys@dennysh.com **[DEFECTO]**. Si no hay ninguno configurado, NO publicar un formulario que no funcione: dejar el formulario construido y probado con un doble de prueba, desactivado en producción, y anotar en el informe exactamente qué falta (proveedor, clave, ruta). No inventar proveedores ni cuentas.
- Sin JS: mostrar el enlace de correo en lugar del formulario (degradación correcta).
- Accesibilidad: etiquetas, foco gestionado al cambiar de paso, errores con `aria-live` solo en el paso actual, teclado completo, contraste AA en los dos temas.

### Pruebas
Unitarias del esquema del servidor (válidos, inválidos, campos extra, enums, longitudes, inyección de saltos de línea); de la lógica de pasos (cada ruta llega al final y las preguntas dependen de la opción); e2e del flujo completo con teclado, Atrás, error de validación y desactivado por falta de configuración.

## D5. Informe
`02-DOCS/informe-correcciones-2.md`: qué se hizo, evidencia (comandos y salidas), valores por defecto usados, lo que falta de parte de Dennys. Controles de seguridad en Verificado / Pendiente / No aplica según el estándar del proyecto.
