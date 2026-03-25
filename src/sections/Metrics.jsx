import React, { useRef, useEffect, useState } from 'react'
import './Metrics.css'

function AnimatedCounter({ target, suffix = '', format }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const duration = 1500
    const start = performance.now()
    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target])

  const display = format ? format(count) : count.toString()

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  )
}

function formatThousands(n) {
  if (n >= 1000) {
    return Math.floor(n / 1000) + ',' + String(n % 1000).padStart(3, '0')
  }
  return n.toString()
}

export default function Metrics() {
  const metrics = [
    {
      value: 1719,
      suffix: '',
      format: formatThousands,
      label: 'Cajas de fibra indexadas en SQLite',
      description: 'Ecuador'
    },
    {
      value: 1,
      suffix: '',
      format: null,
      label: 'Bot en producción',
      description: 'En uso por técnicos ISP'
    },
    {
      value: 4,
      suffix: '',
      format: null,
      label: 'Empresas ISP de experiencia',
      description: 'Acumulada en infraestructura'
    },
    {
      value: 7,
      suffix: '+',
      format: null,
      label: 'Años en telecomunicaciones',
      description: 'Infraestructura crítica de campo'
    }
  ]

  return (
    <section id="resultados" className="metrics reveal">
      <div className="container">
        <span className="section-label">Resultados Medibles</span>
        <h2 className="section-title">Lo que llevo construido hasta hoy.</h2>

        <div className="metrics-grid">
          {metrics.map((metric, idx) => (
            <div key={idx} className="metric-card card reveal-child">
              <div className="metric-number">
                <AnimatedCounter
                  target={metric.value}
                  suffix={metric.suffix}
                  format={metric.format}
                />
              </div>
              <div className="metric-label">{metric.label}</div>
              <div className="metric-description">{metric.description}</div>
            </div>
          ))}
        </div>

        <div className="metrics-note">
          * Datos verificables. Sin métricas fabricadas.
        </div>
      </div>
    </section>
  )
}
