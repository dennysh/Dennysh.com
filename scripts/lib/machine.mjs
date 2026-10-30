// Capa de máquinas (AC-15, AC-33): JSON-LD, llms.txt, dennys.json, robots.txt, sitemap.xml y <head> por página.
// Solo usa datos de src/content/site.js (reales o confirmados); nada inventado.
import { site, links, isPending, profile } from '../../src/content/site.js'

export const SITE_URL = 'https://dennysh.com'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const items = (lang) => site[lang].work.items
const repos = (lang) => items(lang).filter((i) => typeof i.repo === 'string')
const linkOf = (i) => i.url ?? (typeof i.repo === 'string' ? i.repo : undefined)
const shownSkills = (lang) => [...new Set(site[lang].skills.groups.flatMap((g) => g.shown))]

export function jsonLd(lang) {
  const c = site[lang]
  const person = {
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: 'Dennys Heras',
    url: `${SITE_URL}/${lang}/`,
    email: links.emailAddress,
    sameAs: [links.linkedin, links.github],
    description: c.hero.summary[0],
    knowsAbout: shownSkills(lang),
    knowsLanguage: profile.languages.map((l) => l.code),
  }
  const page = {
    '@type': 'ProfilePage',
    '@id': `${SITE_URL}/${lang}/#page`,
    url: `${SITE_URL}/${lang}/`,
    name: c.meta.title,
    description: c.meta.description,
    inLanguage: lang,
    mainEntity: { '@id': person['@id'] },
  }
  const code = repos(lang).map((r) => ({
    '@type': 'SoftwareSourceCode',
    name: r.title,
    description: r.text,
    codeRepository: r.repo,
    author: { '@id': person['@id'] },
  }))
  const sites = items(lang).filter((i) => i.url).map((i) => ({
    '@type': 'WebSite',
    name: i.title,
    description: i.text,
    url: i.url,
    creator: { '@id': person['@id'] },
  }))
  return { '@context': 'https://schema.org', '@graph': [person, page, ...code, ...sites] }
}

export function headHtml({ lang, path, title, description, canonical, indexable = true, withAlternates = false, ld = false }) {
  const url = `${SITE_URL}${canonical ?? path}`
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    indexable ? '' : '<meta name="robots" content="noindex" />',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="${lang === 'es' ? 'es_EC' : 'en_US'}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ]
  if (withAlternates) {
    lines.push(`<link rel="alternate" hreflang="en" href="${SITE_URL}/en/" />`, `<link rel="alternate" hreflang="es" href="${SITE_URL}/es/" />`, `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/" />`)
  }
  if (ld) lines.push(`<script type="application/ld+json">${JSON.stringify(jsonLd(lang)).replace(/</g, '\\u003c')}</script>`)
  return lines.filter(Boolean).join('\n  ')
}

export function llmsTxt() {
  const en = site.en
  const lines = [
    '# Dennys Heras',
    '',
    `> ${en.hero.summary[0]}`,
    '',
    '## Summary',
    `- ${en.hero.who[0]}`,
    ...en.hero.summary.map((s) => `- ${s}`),
    '',
    '## Profile',
    `- Works remotely, from anywhere in the world; time zone ${profile.timezone}.`,
    ...profile.languages.map((l) => `- ${l.name}: ${l.fluency}`),
    '',
    '## Best links',
    `- [Site (English)](${SITE_URL}/en/)`,
    `- [Sitio (Español)](${SITE_URL}/es/)`,
    `- [Live demo: automated decision, explained](${SITE_URL}/en/#demo)`,
    `- [Public ruleset (JSON, with hash)](${SITE_URL}/demo/ruleset.v1.json)`,
    `- [Explanation templates (JSON)](${SITE_URL}/demo/explanations.v1.json)`,
    `- [LinkedIn](${links.linkedin})`,
    `- [GitHub](${links.github})`,
    `- [CV (PDF)](${SITE_URL}${links.cv})`,
    '',
    '## Work and its status',
    ...items('en').map((r) => (linkOf(r) ? `- ${r.title} (${en.work.status[r.status]}): ${linkOf(r)}` : `- ${r.title} (${en.work.status[r.status]})`)),
    '',
    '## Notes for agents',
    '- The live demo cannot be run by agents (it requires a human check by design). A static example is in the page HTML and is labelled as not real.',
    '- Items marked "declared" in Skills have no public proof yet.',
    '',
  ]
  return lines.join('\n')
}

export function resumeJson() {
  const en = site.en
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: 'Dennys Heras',
      email: links.emailAddress,
      url: `${SITE_URL}/en/`,
      summary: [en.hero.summary[0], en.hero.who[0], ...en.hero.summary.slice(2, 4)].join(' '),
      profiles: [{ network: 'LinkedIn', url: links.linkedin }, { network: 'GitHub', url: links.github }],
    },
    languages: profile.languages.map((l) => ({ language: l.name, fluency: l.fluency })),
    projects: items('en').map((r) => ({ name: r.title, description: r.text, ...(linkOf(r) ? { url: linkOf(r) } : {}), status: r.status })),
    skills: en.skills.groups.map((g) => ({ name: g.title, keywords: [...g.shown, ...g.declared], shown: g.shown })),
  }
}

export const robotsTxt = () =>
  [
    'User-agent: *',
    'Allow: /',
    '',
    ...['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'CCBot', 'Applebot-Extended'].flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n')

export function sitemapXml() {
  const alt = (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}/" />`
  const entry = (l) => `  <url>\n    <loc>${SITE_URL}/${l}/</loc>\n${alt('en')}\n${alt('es')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/" />\n  </url>`
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entry('en')}\n${entry('es')}\n</urlset>\n`
}
export { isPending }
