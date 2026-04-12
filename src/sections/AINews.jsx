import React from 'react'
import './AINews.css'

const BADGE_COLORS = {
  IA: 'purple',
  Automatización: 'blue',
  Herramientas: 'green',
}

const DEFAULT_NEWS = [
  {
    id: 'featured',
    featured: true,
    category: 'Automatización',
    title: 'El futuro de la automatización empresarial con IA Generativa',
    description:
      'Cómo los LLMs están redefiniendo los flujos de trabajo empresariales y abriendo nuevas posibilidades para equipos de todas las industrias.',
    date: '28 Mar 2026',
    readTime: '5 min',
    href: '#',
  },
  {
    id: 'news-1',
    featured: false,
    category: 'IA',
    title: 'Claude 3.7 y sus capacidades de razonamiento extendido',
    description:
      'Análisis de las nuevas funciones de reasoning del modelo más reciente de Anthropic.',
    date: '27 Mar 2026',
    readTime: '3 min',
    href: '#',
  },
  {
    id: 'news-2',
    featured: false,
    category: 'Herramientas',
    title: 'n8n vs Make: ¿Cuál elegir en 2026?',
    description:
      'Comparativa actualizada de las dos plataformas de automatización más populares del mercado.',
    date: '26 Mar 2026',
    readTime: '4 min',
    href: '#',
  },
  {
    id: 'news-3',
    featured: false,
    category: 'Automatización',
    title: 'WhatsApp Business API: nuevas integraciones con IA',
    description:
      'Las últimas actualizaciones de la API oficial abren la puerta a flujos conversacionales mucho más inteligentes.',
    date: '25 Mar 2026',
    readTime: '3 min',
    href: '#',
  },
  {
    id: 'news-4',
    featured: false,
    category: 'Herramientas',
    title: 'Python + OpenAI: automatiza tu flujo de emails',
    description:
      'Tutorial paso a paso para construir un agente que clasifica, responde y archiva correos de forma autónoma.',
    date: '24 Mar 2026',
    readTime: '6 min',
    href: '#',
  },
]

function CategoryBadge({ category }) {
  const color = BADGE_COLORS[category] || 'purple'
  return (
    <span className={`ainews__badge ainews__badge--${color}`}>{category}</span>
  )
}

function NewsCard({ item }) {
  return (
    <article className={`ainews__card card reveal-child${item.featured ? ' ainews__card--featured' : ''}`}>
      {item.featured && (
        <div className="ainews__card-gradient" aria-hidden="true" />
      )}
      <div className="ainews__card-body">
        <div className="ainews__card-meta">
          <CategoryBadge category={item.category} />
          <span className="ainews__meta-sep" aria-hidden="true" />
          <span className="ainews__read-time">{item.readTime} lectura</span>
        </div>

        <h3 className={`ainews__card-title${item.featured ? ' ainews__card-title--featured' : ''}`}>
          {item.title}
        </h3>

        <p className="ainews__card-desc">{item.description}</p>

        <div className="ainews__card-footer">
          <span className="ainews__date">{item.date}</span>
          <a
            href={item.href}
            className="ainews__link"
            aria-label={`Leer más sobre ${item.title}`}
          >
            Leer más →
          </a>
        </div>
      </div>
    </article>
  )
}

export default function AINews({ newsItems }) {
  const items = newsItems && newsItems.length > 0 ? newsItems : DEFAULT_NEWS
  const featured = items.find((n) => n.featured) || items[0]
  const rest = items.filter((n) => n !== featured).slice(0, 4)

  return (
    <section id="noticias-ia" className="ainews reveal">
      <div className="container">
        <span className="section-label">ACTUALIDAD</span>
        <h2 className="ainews__title section-title">Noticias de IA</h2>
        <p className="ainews__subtitle">
          Lo más reciente en inteligencia artificial y automatización
        </p>

        <div className="ainews__layout">
          <NewsCard item={featured} />

          <div className="ainews__grid">
            {rest.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
