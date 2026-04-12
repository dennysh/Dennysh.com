import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './ReviewForm.css'

const COOLDOWN_MS = 30 * 60 * 1000 // 30 minutos
const LS_KEY = 'review_last_sent'

const LIMITS = {
  name: { min: 2, max: 60 },
  role: { min: 0, max: 60 },
  company: { min: 0, max: 60 },
  quote: { min: 20, max: 500 },
}

function getRemainingCooldown() {
  const last = localStorage.getItem(LS_KEY)
  if (!last) return 0
  const elapsed = Date.now() - parseInt(last, 10)
  return Math.max(0, COOLDOWN_MS - elapsed)
}

function formatMinutes(ms) {
  const total = Math.ceil(ms / 60000)
  return `${total} min`
}

export default function ReviewForm() {
  const [form, setForm] = useState({ name: '', role: '', company: '', quote: '', stars: 5 })
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [cooldown, setCooldown] = useState(getRemainingCooldown)

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      const remaining = getRemainingCooldown()
      setCooldown(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 10000)
    return () => clearInterval(interval)
  }, [cooldown])

  function validate() {
    const errs = {}
    if (form.name.trim().length < LIMITS.name.min)
      errs.name = `Mínimo ${LIMITS.name.min} caracteres`
    if (form.name.trim().length > LIMITS.name.max)
      errs.name = `Máximo ${LIMITS.name.max} caracteres`
    if (form.quote.trim().length < LIMITS.quote.min)
      errs.quote = `Mínimo ${LIMITS.quote.min} caracteres`
    if (form.quote.trim().length > LIMITS.quote.max)
      errs.quote = `Máximo ${LIMITS.quote.max} caracteres`
    if (form.role.length > LIMITS.role.max)
      errs.role = `Máximo ${LIMITS.role.max} caracteres`
    if (form.company.length > LIMITS.company.max)
      errs.company = `Máximo ${LIMITS.company.max} caracteres`
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Honeypot check — bots llenan este campo, humanos no
    if (honeypot) return

    // Cooldown check
    if (getRemainingCooldown() > 0) return

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    setStatus('sending')

    const { error } = await supabase.from('reviews').insert({
      name: form.name.trim(),
      role: form.role.trim() || null,
      company: form.company.trim() || null,
      quote: form.quote.trim(),
      stars: form.stars,
      approved: false,
    })

    if (error) {
      setStatus('error')
      return
    }

    // Guardar timestamp del envío
    localStorage.setItem(LS_KEY, Date.now().toString())
    setCooldown(COOLDOWN_MS)
    setStatus('success')
    setForm({ name: '', role: '', company: '', quote: '', stars: 5 })
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const isBlocked = cooldown > 0

  return (
    <section id="dejar-resena" className="review-form reveal">
      <div className="container">
        <span className="section-label">COMPARTE TU EXPERIENCIA</span>
        <h2 className="review-form__title section-title">Deja tu reseña</h2>
        <p className="review-form__subtitle">
          ¿Trabajaste conmigo? Tu opinión ayuda a otros a conocer mi trabajo.
        </p>

        {status === 'success' ? (
          <div className="review-form__success">
            <span className="review-form__success-icon">✓</span>
            <h3>¡Gracias por tu reseña!</h3>
            <p>La revisaré y la publicaré pronto. Puedes enviar otra en {formatMinutes(COOLDOWN_MS)}.</p>
          </div>
        ) : (
          <form className="review-form__form" onSubmit={handleSubmit} noValidate>
            {/* Honeypot — invisible para humanos, bots lo llenan */}
            <div className="review-form__honeypot" aria-hidden="true">
              <label htmlFor="website">No llenar</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Estrellas */}
            <div className="review-form__field">
              <label className="review-form__label">Calificación</label>
              <div className="review-form__stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`review-form__star${form.stars >= n ? ' review-form__star--active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, stars: n }))}
                    aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div className="review-form__field">
              <label className="review-form__label" htmlFor="rf-name">
                Nombre <span className="review-form__required">*</span>
              </label>
              <input
                id="rf-name"
                name="name"
                type="text"
                className={`review-form__input${errors.name ? ' review-form__input--error' : ''}`}
                placeholder="Tu nombre"
                value={form.name}
                onChange={handleChange}
                maxLength={LIMITS.name.max}
                required
              />
              {errors.name && <span className="review-form__error">{errors.name}</span>}
            </div>

            {/* Rol y empresa en fila */}
            <div className="review-form__row">
              <div className="review-form__field">
                <label className="review-form__label" htmlFor="rf-role">Rol / Cargo</label>
                <input
                  id="rf-role"
                  name="role"
                  type="text"
                  className={`review-form__input${errors.role ? ' review-form__input--error' : ''}`}
                  placeholder="ej: CEO, Gerente..."
                  value={form.role}
                  onChange={handleChange}
                  maxLength={LIMITS.role.max}
                />
                {errors.role && <span className="review-form__error">{errors.role}</span>}
              </div>

              <div className="review-form__field">
                <label className="review-form__label" htmlFor="rf-company">Empresa</label>
                <input
                  id="rf-company"
                  name="company"
                  type="text"
                  className={`review-form__input${errors.company ? ' review-form__input--error' : ''}`}
                  placeholder="Nombre de tu empresa"
                  value={form.company}
                  onChange={handleChange}
                  maxLength={LIMITS.company.max}
                />
                {errors.company && <span className="review-form__error">{errors.company}</span>}
              </div>
            </div>

            {/* Reseña */}
            <div className="review-form__field">
              <label className="review-form__label" htmlFor="rf-quote">
                Tu reseña <span className="review-form__required">*</span>
              </label>
              <textarea
                id="rf-quote"
                name="quote"
                className={`review-form__textarea${errors.quote ? ' review-form__input--error' : ''}`}
                placeholder="Describe tu experiencia trabajando conmigo..."
                value={form.quote}
                onChange={handleChange}
                maxLength={LIMITS.quote.max}
                rows={4}
                required
              />
              <span className="review-form__char-count">
                {form.quote.length}/{LIMITS.quote.max}
              </span>
              {errors.quote && <span className="review-form__error">{errors.quote}</span>}
            </div>

            {status === 'error' && (
              <p className="review-form__error-msg">
                Hubo un error al enviar. Intenta de nuevo.
              </p>
            )}

            <button
              type="submit"
              className="hbtn hbtn--primary review-form__submit"
              disabled={status === 'sending' || isBlocked}
            >
              {status === 'sending'
                ? 'Enviando...'
                : isBlocked
                ? `Espera ${formatMinutes(cooldown)}`
                : 'Enviar reseña'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
