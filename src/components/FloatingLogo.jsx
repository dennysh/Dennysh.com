import React, { useState, useRef } from 'react'
import './FloatingLogo.css'

const TIPS = [
  "Los LLMs no comprenden — predicen el próximo token más probable. Prompts específicos dan resultados mucho mejores.",
  "Chain-of-thought prompting: pídele al modelo que razone paso a paso antes de responder. Mejora la precisión en problemas complejos.",
  "El mejor código es el que no necesitas escribir. Antes de implementar, pregúntate si ya existe una solución.",
  "Escribe código pensando en quien lo leerá en 6 meses. Ese alguien probablemente serás tú.",
  "Automatiza primero lo que haces más de 3 veces por semana. Ahí está el mayor retorno de inversión.",
  "Un webhook bien configurado puede reemplazar docenas de tareas manuales. Si tu app no los tiene, pídelos.",
  "La regla de los 2 minutos: si una tarea toma menos de 2 minutos, hazla ahora mismo. No la pongas en ninguna lista.",
  "Batching de tareas similares puede devolverte 2 horas al día. Revisa emails una vez al día, no cada 15 minutos.",
  "Conecta con alguien nuevo de tu área cada semana. Un mensaje directo genuino vale más que 10 solicitudes vacías.",
  "Aporta antes de pedir. Comparte conocimiento útil en tu red antes de necesitar algo de ella.",
  "Aprende amplio primero, luego profundiza en 1–2 áreas. Los generalistas son contratados, los especialistas son buscados.",
  "Documenta tus proyectos con métricas reales: '30% más rápido', '500 usuarios', '3 integraciones'. Los números venden.",
  "En aplicaciones en tiempo real, la latencia importa más que el ancho de banda. UDP sobre TCP cuando perder paquetes es aceptable.",
  "5G no es solo velocidad — la latencia ultrabaja (<1 ms) habilita IoT masivo, vehículos autónomos y cirugía remota.",
  "Escribe tests antes de refactorizar. Sin tests, no sabes si tu mejora rompió algo.",
  "Git commit temprano y frecuente. Un commit por funcionalidad, no un commit con 2000 líneas cambiadas.",
  "Fine-tuning no siempre es la respuesta. Un buen system prompt con ejemplos suele superar a un modelo ajustado.",
  "Los bots de Telegram son una herramienta de negocio subestimada. Interfaz conversacional simple = alto impacto real.",
  "Deep work requiere bloques de al menos 90 minutos sin interrupciones. Menos que eso y nunca alcanzas el estado de flujo.",
  "Aprende a leer la documentación oficial. La mayoría de bugs se resuelven antes con la doc que con Stack Overflow.",
  "Los embeddings capturan semántica en vectores. 'rey − hombre + mujer ≈ reina' no es magia, es álgebra vectorial.",
  "El inglés técnico multiplica tu alcance: el 90% de recursos, ofertas y comunidades globales están en inglés.",
  "Para flujos simples usa n8n, Make o Zapier. Para lógica de negocio compleja, el código propio siempre es más mantenible.",
  "YAGNI — You Aren't Gonna Need It. No implementes funcionalidades por si acaso. Construye solo lo que necesitas hoy.",
  "Dennys tiene un asistente virtual corriendo localmente con OpenClaw, lo que le permite automatizar tareas en su propio computador.",
  "Dennys está construyendo un bot de Telegram para técnicos de ISP que encuentra la caja de fibra más cercana usando coordenadas y mapas.",
  "Dennys combina telecomunicaciones con desarrollo de software, una mezcla muy poderosa para automatizar redes y operaciones.",
  "Dennys usa IA local + automatización para reducir trabajo repetitivo y acelerar tareas técnicas.",
  "Dennys está aprendiendo Python, Java y MySQL para ampliar su perfil de telecom hacia ingeniería de software.",
  "Dennys cree que la automatización es la habilidad más importante para los ingenieros modernos.",
  "Dennys está construyendo herramientas que ayuden a técnicos de campo a trabajar más rápido y con menos errores.",
  "Dennys usa Cursor + IA para acelerar desarrollo de proyectos personales.",
  "Dennys experimenta con bots, agentes y automatización para crear soluciones reales en telecom.",
  "Dennys documenta sus proyectos porque sabe que mostrar lo que construyes es más importante que solo decirlo.",
  "Dennys está explorando Claude, ChatGPT y automatización con terminal para aumentar su productividad.",
  "Dennys cree que los mejores ingenieros no solo programan, también diseñan sistemas.",
  "Dennys está creando un portfolio interactivo para mostrar proyectos reales y no solo un CV.",
  "Dennys usa IA para convertir ideas en prototipos rápidamente.",
  "Dennys está experimentando con skills, agentes y MCP servers para expandir las capacidades de los modelos de IA.",
  "Dennys está aprendiendo cómo usar Cloudflare, hosting y dominios para desplegar sus propios proyectos.",
  "Dennys cree que el futuro del trabajo técnico está en automatizar lo que antes se hacía manualmente.",
  "Dennys combina experiencia en campo (fibra óptica) con software para crear herramientas útiles para operadores de red.",
  "Dennys está construyendo sistemas donde Telegram, IA y bases de datos trabajan juntos.",
  "Dennys está transformando su experiencia en telecom en productos tecnológicos.",
  "Esta web fue construida por Dennys Heras, técnico en telecomunicaciones en transición a Automation Engineer.",
]

export default function FloatingLogo() {
  const [tip, setTip] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const lastIdxRef = useRef(-1)

  const handleClick = () => {
    if (timerRef.current) clearTimeout(timerRef.current)

    let idx
    do {
      idx = Math.floor(Math.random() * TIPS.length)
    } while (idx === lastIdxRef.current && TIPS.length > 1)
    lastIdxRef.current = idx

    setTip(TIPS[idx])
    setVisible(true)

    timerRef.current = setTimeout(() => setVisible(false), 7000)
  }

  const dismiss = (e) => {
    e.stopPropagation()
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  return (
    <div className="floating-logo-wrap">
      <div
        className={`tip-popup ${visible ? 'tip-popup--visible' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="tip-popup__header">
          <span className="tip-popup__label">💡 Tip</span>
          <button
            className="tip-popup__close"
            onClick={dismiss}
            aria-label="Cerrar tip"
            tabIndex={visible ? 0 : -1}
          >
            ✕
          </button>
        </div>
        <p className="tip-popup__text">{tip}</p>
      </div>

      <button
        className="floating-logo"
        onClick={handleClick}
        aria-label="Ver tip aleatorio"
        title="Clic para un tip"
      >
        <img src="/images/favicon-tight-192.png" alt="" aria-hidden="true" />
      </button>
    </div>
  )
}
