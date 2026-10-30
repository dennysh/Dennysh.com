import { describe, it, expect } from 'vitest'
import { COMMON_HEADERS } from '../../server/security-headers.js'
import { renderHeadersFile, checkHeadersFile } from '../../scripts/static/headers.mjs'
import { checkViteEnv, scanPatchAdditions } from '../../scripts/static/secrets.mjs'
import { checkSourceRules } from '../../scripts/static/rules.mjs'
import { checkSurface } from '../../scripts/static/no-ai-routes.mjs'

describe('headers (T060, AC-13, S18)', () => {
  it('renderHeadersFile genera un _headers que pasa la comprobación', () => {
    expect(checkHeadersFile(renderHeadersFile())).toEqual([])
  })
  it('lleva todas las cabeceras comunes en /*', () => {
    const txt = renderHeadersFile()
    for (const [k, v] of Object.entries(COMMON_HEADERS)) expect(txt).toContain(`  ${k}: ${v}`)
  })
  it.each([
    ['sin CSP', (t) => t.replace(/ {2}Content-Security-Policy:.*\n/, '')],
    ['con unsafe-inline', (t) => t.replace("default-src 'self'", "default-src 'self' 'unsafe-inline'")],
    ['con unsafe-eval', (t) => t.replace("default-src 'self'", "default-src 'self' 'unsafe-eval'")],
    ['sin frame-ancestors', (t) => t.replace("frame-ancestors 'none'", "frame-ancestors *")],
    ['sin nosniff', (t) => t.replace(/ {2}X-Content-Type-Options:.*\n/, '')],
    ['sin HSTS', (t) => t.replace(/ {2}Strict-Transport-Security:.*\n/, '')],
    ['sin COOP', (t) => t.replace(/ {2}Cross-Origin-Opener-Policy:.*\n/, '')],
    ['vacío', () => ''],
  ])('falla %s', (_n, mutate) => {
    expect(checkHeadersFile(mutate(renderHeadersFile())).length).toBeGreaterThan(0)
  })
  describe('cabeceras debilitadas (revisión T092)', () => {
    const swap = (from, to) => (t) => t.replace(from, to)
    const csp = (value) => (t) => t.replace(/ {2}Content-Security-Policy:.*\n/, `  Content-Security-Policy: ${value}\n`)
    it.each([
      ['default-src comodín', csp("default-src *; frame-ancestors 'none'; object-src 'none'; font-src 'self'")],
      ['script-src https: genérico', csp("default-src 'self'; script-src https: data:; frame-ancestors 'none'; object-src 'none'; font-src 'self'")],
      ['script-src con data:', csp("default-src 'self'; script-src 'self' data:; frame-ancestors 'none'; object-src 'none'; font-src 'self'")],
      ['HSTS max-age=0', swap('max-age=31536000', 'max-age=0')],
      ['HSTS de un día', swap('max-age=31536000', 'max-age=86400')],
      ['Referrer-Policy unsafe-url', swap('strict-origin-when-cross-origin', 'unsafe-url')],
      ['Permissions-Policy con comodín', swap('camera=()', 'camera=*')],
      ['COOP distinto de same-origin', swap('Cross-Origin-Opener-Policy: same-origin', 'Cross-Origin-Opener-Policy: unsafe-none')],
      ['un bloque /demo/* que redefine la CSP', (t) => `${t}/demo/*\n  Content-Security-Policy: default-src * 'unsafe-inline'\n`],
      ['el bloque /api/* redefine la CSP', (t) => t.replace('/api/*\n', "/api/*\n  Content-Security-Policy: default-src *\n")],
    ])('falla: %s', (_n, mutate) => {
      expect(checkHeadersFile(mutate(renderHeadersFile())).length).toBeGreaterThan(0)
    })
  })

  it('la CSP no depende de dominios de fuentes externos', () => {
    expect(renderHeadersFile()).not.toMatch(/fonts\.(googleapis|gstatic)/)
  })
})

describe('variables VITE_* y secretos (T061, AC-11, S1, S3)', () => {
  it('solo VITE_TURNSTILE_SITEKEY es válida', () => {
    expect(checkViteEnv('a.js', 'const k = import.meta.env.VITE_TURNSTILE_SITEKEY')).toEqual([])
    expect(checkViteEnv('.env.example', 'VITE_TURNSTILE_SITEKEY=\n')).toEqual([])
  })
  it('cualquier otra VITE_* falla', () => {
    expect(checkViteEnv('a.js', 'import.meta.env.VITE_SUPABASE_URL').length).toBe(1)
    expect(checkViteEnv('.env', 'VITE_TELEGRAM_BOT_TOKEN=abc').length).toBe(1)
  })
  it('un parche con un token falso añadido se detecta; uno que solo lo quita, no', () => {
    const added = '+++ b/x.js\n+const t = "123456789:AAH-abcdefghijklmnopqrstuvwxyz0123456"\n'
    expect(scanPatchAdditions(added).length).toBe(1)
    const removed = '--- a/x.js\n-const t = "123456789:AAH-abcdefghijklmnopqrstuvwxyz0123456"\n'
    expect(scanPatchAdditions(removed)).toEqual([])
  })
})

describe('reglas de código (T062, S9, S13, S15, D-01)', () => {
  const bad = {
    'dangerouslySetInnerHTML': 'return <div dangerouslySetInnerHTML={{__html: x}} />',
    'innerHTML': 'el.innerHTML = value',
    'SQL concatenado con +': "db.prepare('SELECT * FROM events WHERE id = ' + id)",
    'SQL con plantilla': 'db.prepare(`SELECT * FROM events WHERE id = ${id}`)',
    'Set-Cookie': "headers.set('Set-Cookie', 'a=1')",
    'document.cookie': 'document.cookie = "a=1"',
    'eval': 'eval(code)',
    'new Function': 'new Function("return 1")',
  }
  for (const [name, code] of Object.entries(bad)) {
    it(`detecta ${name}`, () => expect(checkSourceRules('src/x.jsx', code).length).toBeGreaterThan(0))
  }
  it('el código correcto pasa', () => {
    const good = "db.prepare('SELECT * FROM events WHERE id = ?').bind(id)\nconst x = <p>{text}</p>\nheaders.delete('Set-Cookie')"
    expect(checkSourceRules('server/x.js', good)).toEqual([])
  })
  it('un comentario que menciona la regla no cuenta', () => {
    expect(checkSourceRules('server/x.js', "// sin Set-Cookie ni innerHTML\n")).toEqual([])
  })
})

describe('sin IA por clic y superficie de rutas (T069, AC-10, S6, D-01)', () => {
  const routes = ['functions/api/simulate.js', 'functions/api/intervene.js', 'functions/api/event/[id].js', 'functions/api/_middleware.js']
  it('el conjunto previsto pasa', () => {
    expect(checkSurface({ files: routes.map((f) => ({ path: f, text: '' })) })).toEqual([])
  })
  it('una ruta extra en functions/api falla', () => {
    expect(checkSurface({ files: [...routes, 'functions/api/admin.js'].map((f) => ({ path: f, text: '' })) }).length).toBe(1)
  })
  it.each([
    ["import OpenAI from 'openai'"],
    ["import Anthropic from '@anthropic-ai/sdk'"],
    ["await fetch('https://api.anthropic.com/v1/messages')"],
    ["const u = 'https://api.openai.com/v1/chat'"],
    ["import { generateText } from 'ai'"],
  ])('proveedor de modelos: %s', (code) => {
    expect(checkSurface({ files: [{ path: 'server/x.js', text: code }] }).length).toBeGreaterThan(0)
  })
  it('fetch fuera de la lista cerrada falla; los destinos previstos y /api/ pasan', () => {
    expect(checkSurface({ files: [{ path: 'src/a.js', text: "fetch('https://evil.example/x')" }] }).length).toBe(1)
    expect(checkSurface({ files: [{ path: 'src/a.js', text: "fetch('/api/simulate', {})" }] })).toEqual([])
    expect(checkSurface({ files: [{ path: 'server/n.js', text: 'fetch(`https://api.telegram.org/bot${t}/x`)' }] })).toEqual([])
    expect(checkSurface({ files: [{ path: 'server/v.js', text: "fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify')" }] })).toEqual([])
  })
  it('un fetch con destino dinámico (variable) también falla', () => {
    expect(checkSurface({ files: [{ path: 'src/a.js', text: 'fetch(url)' }] }).length).toBe(1)
  })
})
