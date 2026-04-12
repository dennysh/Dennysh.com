import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Reviews.css'

const AVATAR_COLORS = [
  'var(--accent-purple)',
  'var(--accent-blue)',
  '#059669',
  '#d97706',
  '#dc2626',
]

function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function StarRating({ count }) {
  return (
    <div className="reviews__stars" aria-label={`${count} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`reviews__star${i < count ? ' reviews__star--filled' : ''}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const sectionRef = React.useRef(null)

  useEffect(() => {
    async function fetchReviews() {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, name, role, company, quote, stars')
        .eq('approved', true)
        .order('created_at', { ascending: false })

      if (!error && data) setReviews(data)
      setLoading(false)
    }
    fetchReviews()
  }, [])

  // Observer propio porque la sección se monta después del observer global de App
  useEffect(() => {
    if (loading || reviews.length === 0 || !sectionRef.current) return
    const el = sectionRef.current
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('reveal--visible'); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, reviews])

  if (loading) return null
  if (reviews.length === 0) return null

  return (
    <section id="resenas" className="reviews reveal" ref={sectionRef}>
      <div className="container">
        <span className="section-label">RESEÑAS</span>
        <h2 className="reviews__title section-title">
          Lo que dicen mis clientes
        </h2>

        <div className="reviews__grid">
          {reviews.map((t, i) => (
            <article key={t.id} className="reviews__card card reveal-child">
              <div className="reviews__quote-icon" aria-hidden="true">"</div>

              <p className="reviews__text">{t.quote}</p>

              <StarRating count={t.stars} />

              <div className="reviews__author">
                <div
                  className="reviews__avatar"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  aria-hidden="true"
                >
                  {getInitials(t.name)}
                </div>
                <div className="reviews__author-info">
                  <span className="reviews__author-name">{t.name}</span>
                  {(t.role || t.company) && (
                    <span className="reviews__author-role">
                      {[t.role, t.company].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
