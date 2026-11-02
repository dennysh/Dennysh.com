// Modo demostración local (npm run demo). Sirve dist-demo/ y responde /api/contact con una API de mentira:
// valida con el mismo esquema que el servidor real, no envía correos, no guarda nada y no lee configuración ni claves.
// Solo escucha en 127.0.0.1 (para verlo desde otra máquina: túnel SSH, ver 02-DOCS/modo-demo.md).
import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { validateContact, renderContact } from '../core/contact.js'

const MAX_BODY = 12288
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
}
// Correos de prueba que fuerzan cada respuesta, para ver todos los avisos del formulario.
const FORCED = { limite: [429, 'E_RATE'], bot: [403, 'E_TURNSTILE'], caido: [503, 'E_UNAVAILABLE'] }

const BANNER = '<div role="note" style="position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:2147483647;'
  + 'padding:4px 12px;border-radius:999px;background:#111;color:#fff;font:12px/1.4 system-ui,sans-serif;opacity:.88;pointer-events:none">'
  + 'MODO DEMOSTRACIÓN · el formulario no envía nada</div>'

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
  res.end(body)
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj))

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const c of req) {
    size += c.length
    if (size > MAX_BODY) return null
    chunks.push(c)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function contact(req, res) {
  if (req.method === 'GET') return json(res, 200, { enabled: true })
  if (req.method !== 'POST') return json(res, 405, { ok: false })
  if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) return json(res, 415, { ok: false })
  const raw = await readBody(req)
  if (raw === null) return json(res, 413, { ok: false })
  let data
  try { data = JSON.parse(raw) } catch { return json(res, 400, { ok: false }) }
  const checked = validateContact(data)
  if (!checked.ok) return json(res, 400, { ok: false, code: 'E_INPUT' })
  const forced = FORCED[String(checked.value.email ?? '').split('@')[0].toLowerCase()]
  if (forced) return json(res, forced[0], { ok: false, code: forced[1] })
  const mail = renderContact(checked.value)
  console.log(`\n[demo] mensaje recibido (NO se envía ni se guarda):\n${mail.text}`)
  return json(res, 200, { ok: true })
}

async function file(ROOT, urlPath) {
  let p = normalize(decodeURIComponent(urlPath.split('?')[0]))
  if (p.endsWith(sep) || p === '.') p = join(p, 'index.html')
  const full = join(ROOT, p)
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null
  try {
    const path = (await stat(full)).isDirectory() ? join(full, 'index.html') : full
    return { buf: await readFile(path), path }
  } catch {
    return null
  }
}

export function createDemoServer(root = resolve('dist-demo')) {
  return http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1')
    if (url.pathname === '/api/contact') return await contact(req, res)
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed', 'text/plain')
    let hit = await file(root, url.pathname)
    let status = 200
    if (!hit) { hit = await file(root, '/404.html'); status = 404 }
    if (!hit) return send(res, 404, 'Not Found', 'text/plain')
    const type = TYPES[extname(hit.path)] ?? 'application/octet-stream'
    if (type.startsWith('text/html')) {
      const html = hit.buf.toString('utf8').replace('</body>', `${BANNER}</body>`)
      res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
      return res.end(html)
    }
    res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
    return res.end(hit.buf)
  } catch {
    return send(res, 500, 'Error', 'text/plain')
  }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.DEMO_PORT ?? 4180)
  createDemoServer(resolve(process.env.DEMO_DIR ?? 'dist-demo')).listen(port, '127.0.0.1', () => {
    console.log(`Demostración en http://127.0.0.1:${port}/es/contacto/  (Ctrl+C para parar)`)
    console.log('Correos de prueba: limite@x.com → "demasiados intentos", bot@x.com → "verificación fallida", caido@x.com → "servicio caído".')
  })
}
