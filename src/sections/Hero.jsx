import React, { useState, useEffect, useRef, useCallback } from 'react'
import './Hero.css'

/* ─── Boot sequence lines ───────────────────────────────────────────────── */
const BOOT_LINES = [
  { text: '> Initializing DennysHeras.dev...', type: 'default' },
  { text: '> Stack loaded: Telecom · Python · Automation', type: 'default' },
  { text: '> Field ops: FTTH / GPON networks — active', type: 'default' },
  { text: '> Bot Telegram Caja Cercana — production ✓', type: 'success' },
  { text: '> All systems online.', type: 'highlight' },
]

const TYPING_SPEED = 26   // ms per character (base)
const JITTER       = 14   // ± randomness for human feel
const LINE_PAUSE   = 260  // ms between lines
const FINAL_PAUSE  = 900  // ms after last line before hero

const sleep = ms => new Promise(r => setTimeout(r, ms))
const rand  = () => Math.random() * JITTER * 2 - JITTER // -14..+14 ms

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Hero() {
  const [phase, setPhase]               = useState('intro') // 'intro' | 'transition' | 'hero'
  const [completedLines, setCompleted]  = useState([])
  const [currentText, setCurrentText]   = useState('')
  const [cursorOn, setCursorOn]         = useState(true)
  const [heroVisible, setHeroVisible]   = useState(false)
  const cancelRef = useRef(false)

  /* cursor blink */
  useEffect(() => {
    const id = setInterval(() => setCursorOn(v => !v), 530)
    return () => clearInterval(id)
  }, [])

  const goToHero = useCallback(() => {
    cancelRef.current = true
    setPhase('transition')
    setTimeout(() => {
      setPhase('hero')
      setTimeout(() => setHeroVisible(true), 60)
    }, 500)
  }, [])

  /* typing engine — runs once on mount */
  useEffect(() => {
    const run = async () => {
      await sleep(500) // brief pause before first line

      for (let i = 0; i < BOOT_LINES.length; i++) {
        if (cancelRef.current) return
        const line = BOOT_LINES[i]

        for (let c = 0; c <= line.text.length; c++) {
          if (cancelRef.current) return
          setCurrentText(line.text.slice(0, c))
          await sleep(Math.max(10, TYPING_SPEED + rand()))
        }

        await sleep(LINE_PAUSE)
        if (cancelRef.current) return

        setCompleted(prev => [...prev, line])
        setCurrentText('')
      }

      await sleep(FINAL_PAUSE)
      if (!cancelRef.current) goToHero()
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── INTRO / TRANSITION ─────────────────────────────────────────────── */
  if (phase === 'intro' || phase === 'transition') {
    return (
      <div className={`boot ${phase === 'transition' ? 'boot--exit' : ''}`}>
        <button
          className="boot__skip"
          onClick={goToHero}
          aria-label="Saltar introducción"
        >
          Skip intro ↓
        </button>

        <div className="boot__terminal" role="region" aria-label="Terminal de arranque">
          {/* macOS-style title bar */}
          <div className="boot__bar">
            <span className="tdot tdot--red"   aria-hidden="true" />
            <span className="tdot tdot--yellow" aria-hidden="true" />
            <span className="tdot tdot--green"  aria-hidden="true" />
            <span className="boot__bar-title">dennys@heras: ~</span>
          </div>

          {/* Terminal body */}
          <div className="boot__body" aria-live="polite" aria-atomic="false">
            {completedLines.map((line, i) => (
              <div key={i} className={`boot__line boot__line--${line.type}`}>
                {line.text}
              </div>
            ))}

            {/* Line being typed */}
            <div className="boot__line boot__line--typing">
              {currentText}
              <span
                className="boot__cursor"
                style={{ opacity: cursorOn ? 1 : 0 }}
                aria-hidden="true"
              >█</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── HERO ────────────────────────────────────────────────────────────── */
  return (
    <section
      id="inicio"
      className={`hero ${heroVisible ? 'hero--visible' : ''}`}
      aria-label="Sección principal"
    >
      {/* Background decorations */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg__grid" />
        <div className="hero-bg__glow hero-bg__glow--purple" />
        <div className="hero-bg__glow hero-bg__glow--blue" />
      </div>

      <div className="hero-wrap">
        {/* ── LEFT: text ── */}
        <div className="hero-left">
          <div className="hero-badge" aria-label="Rol actual">
            <span className="hero-badge__dot" aria-hidden="true" />
            Técnico ISP → Desarrollador Python
          </div>

          <h1 className="hero-h1">
            Automatizo operaciones técnicas
            <span className="hero-h1__accent"> con software real.</span>
          </h1>

          <p className="hero-sub">
            Técnico en fibra óptica (FTTH/GPON) que construye herramientas
            que ya están en producción — no solo demos.
          </p>

          <div className="hero-actions">
            <a href="#proyecto" className="hbtn hbtn--primary">
              Ver proyecto ↓
            </a>
            <a href="#contacto" className="hbtn hbtn--ghost">
              Contactar
            </a>
          </div>

          <div className="hero-stats" aria-label="Métricas">
            <div className="hero-stat">
              <span className="hero-stat__n">1,719</span>
              <span className="hero-stat__l">cajas ISP</span>
            </div>
            <div className="hero-stat__sep" aria-hidden="true" />
            <div className="hero-stat">
              <span className="hero-stat__n">1</span>
              <span className="hero-stat__l">bot en prod.</span>
            </div>
            <div className="hero-stat__sep" aria-hidden="true" />
            <div className="hero-stat">
              <span className="hero-stat__n">Python</span>
              <span className="hero-stat__l">stack core</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: bot preview ── */}
        <div className="hero-right" aria-label="Vista previa del proyecto">
          <div className="preview">
            {/* Card header */}
            <div className="preview__bar">
              <span className="tdot tdot--red"   aria-hidden="true" />
              <span className="tdot tdot--yellow" aria-hidden="true" />
              <span className="tdot tdot--green"  aria-hidden="true" />
              <span className="preview__title">Bot Telegram · Caja Cercana</span>
              <span className="preview__live" aria-label="Estado: en producción">● LIVE</span>
            </div>

            {/* Chat mockup */}
            <div className="preview__body">
              <div className="chat">
                <div className="chat__msg chat__msg--user">
                  <span className="chat__av" aria-hidden="true">👷</span>
                  <div className="chat__bubble chat__bubble--user">
                    📍 <em>Ubicación compartida</em>
                  </div>
                </div>

                <div className="chat__msg chat__msg--bot">
                  <span className="chat__av" aria-hidden="true">🤖</span>
                  <div className="chat__bubble chat__bubble--bot">
                    🔍 Calculando cajas cercanas...
                  </div>
                </div>

                <div className="chat__msg chat__msg--bot">
                  <span className="chat__av" aria-hidden="true">🤖</span>
                  <div className="chat__bubble chat__bubble--bot">
                    <strong>📦 3 cajas encontradas:</strong>
                    <ul className="chat__results" aria-label="Resultados">
                      <li className="chat__result">
                        <code>CB-001</code>
                        <span className="chat__dist">120 m</span>
                        <span className="chat__link" aria-hidden="true">🗺️ Ruta</span>
                      </li>
                      <li className="chat__result">
                        <code>CB-047</code>
                        <span className="chat__dist">340 m</span>
                        <span className="chat__link" aria-hidden="true">🗺️ Ruta</span>
                      </li>
                      <li className="chat__result">
                        <code>CB-013</code>
                        <span className="chat__dist">510 m</span>
                        <span className="chat__link" aria-hidden="true">🗺️ Ruta</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tech tags */}
              <div className="preview__tags" aria-label="Tecnologías">
                {['Python', 'SQLite', 'Haversine', 'Telegram API'].map(t => (
                  <span key={t} className="preview__tag">{t}</span>
                ))}
              </div>
            </div>

            {/* Card footer CTA */}
            <a
              href="https://github.com/dennysh/Bot_Telegram_Caja_Cercana"
              target="_blank"
              rel="noopener noreferrer"
              className="preview__cta"
              aria-label="Ver repositorio en GitHub (abre en nueva pestaña)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              Ver repositorio en GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll" aria-hidden="true">
        <span>scroll</span>
        <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
          <rect x="1" y="1" width="12" height="20" rx="6" stroke="currentColor" strokeWidth="1.5"/>
          <circle className="hero-scroll__dot" cx="7" cy="7" r="2" fill="currentColor"/>
        </svg>
      </div>
    </section>
  )
}
