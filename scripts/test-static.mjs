// Pruebas estáticas. Sin argumentos: todas. Con argumento: solo esa (p. ej. `explain-review`).
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { scanText } from './lib/scan-secrets.mjs'
import { isReviewed } from '../core/explain.js'
import { renderHeadersFile, checkHeadersFile } from './static/headers.mjs'
import { checkViteEnv, scanPatchAdditions } from './static/secrets.mjs'
import { checkSourceRules } from './static/rules.mjs'
import { checkSurface } from './static/no-ai-routes.mjs'

const SKIP = /\.(png|jpe?g|gif|webp|ico|svg|woff2?|glb|lock)$|package-lock\.json$|(^|\/)tests\/|scan-secrets/

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

function secrets() {
  const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  const files = [...new Set([...tracked, ...walk('dist')])].filter((f) => !SKIP.test(f) && existsSync(f))
  const hits = files.flatMap((f) => scanText(f, readFileSync(f, 'utf8')))
  for (const h of hits) console.error(`SECRETO? ${h.file}:${h.line} (${h.rule})`)
  const envFiles = files.filter((f) => /^(src|dist|index\.html|\.env)/.test(f) || f === 'index.html')
  const vite = envFiles.flatMap((f) => checkViteEnv(f, readFileSync(f, 'utf8')))
  for (const v of vite) console.error(v)
  // Historial: solo líneas añadidas por cualquier commit (git log -p).
  const patch = execFileSync('git', ['log', '-p', '--all', '--no-color'], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
  const hist = scanPatchAdditions(patch)
  for (const h of hist) console.error(`SECRETO? en el historial: ${h.file} (${h.rule})`)
  const ok = !hits.length && !vite.length && !hist.length
  if (ok) console.log(`secrets OK — ${files.length} archivos, variables VITE_* y historial sin secretos`)
  return ok
}

function sourceFiles() {
  const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { encoding: 'utf8' }).split('\n').filter(Boolean)
  return tracked.filter((f) => /^(src|server|functions|core)\/.*\.(m?js|jsx)$/.test(f) && existsSync(f))
}

function headers() {
  let ok = true
  const expected = renderHeadersFile()
  for (const f of ['public/_headers', 'dist/_headers']) {
    if (!existsSync(f)) {
      if (f.startsWith('public')) { console.error(`falta ${f}`); ok = false }
      continue
    }
    const text = readFileSync(f, 'utf8')
    const problems = checkHeadersFile(text)
    if (text !== expected) problems.push('difiere de la fuente única (ejecuta node scripts/gen-headers.mjs)')
    for (const p of problems) console.error(`${f}: ${p}`)
    if (problems.length) ok = false
  }
  if (ok) console.log('headers OK — _headers coincide con la política y cumple S18')
  return ok
}

function rules() {
  const problems = sourceFiles().flatMap((f) => checkSourceRules(f, readFileSync(f, 'utf8')))
  for (const p of problems) console.error(p)
  if (!problems.length) console.log('rules OK — sin innerHTML, SQL concatenado, cookies ni eval')
  return problems.length === 0
}

function noAiRoutes() {
  const files = sourceFiles().map((path) => ({ path, text: readFileSync(path, 'utf8') }))
  const problems = checkSurface({ files })
  for (const p of problems) console.error(p)
  if (!problems.length) console.log('no-ai-routes OK — sin proveedores de modelos, fetch cerrado y tres rutas')
  return problems.length === 0
}

// AC-23: en producción ninguna plantilla de explicación puede estar sin revisar.
function explainReview() {
  const file = process.env.EXPLAIN_TEMPLATES || 'content/explanations/v1.json'
  const pending = JSON.parse(readFileSync(file, 'utf8')).templates.filter((t) => !isReviewed(t))
  if (!pending.length) {
    console.log('explain-review OK — todas las plantillas están revisadas')
    return true
  }
  const ids = pending.map((t) => t.id).join(', ')
  if (process.env.NODE_ENV === 'production') {
    console.error(`explain-review FALLA — plantillas sin revisadaPor/revisadaEn: ${ids}`)
    return false
  }
  console.log(`explain-review aviso (desarrollo) — pendientes de revisión: ${ids}`)
  return true
}

// T080: lista los marcadores pending; en producción falla si alguno no está autorizado por Dennys.
async function content() {
  const { collectPending, AUTHORIZED_PENDING } = await import('../src/content/site.js')
  const all = collectPending()
  const ids = [...new Set(all.map((p) => p.id))]
  const bad = all.filter((p) => !AUTHORIZED_PENDING.includes(p.id))
  console.log(`content: ${all.length} marcadores pending (${ids.join(', ')})`)
  if (process.env.NODE_ENV === 'production' && bad.length) {
    for (const p of bad) console.error(`pending sin autorizar ${p.id} en ${p.path}: ${p.hint}`)
    return false
  }
  return true
}

const CHECKS = { secrets, headers, content, rules, 'no-ai-routes': noAiRoutes, 'explain-review': explainReview }
const wanted = process.argv.slice(2).filter((a) => a in CHECKS)
const results = []
for (const k of wanted.length ? wanted : Object.keys(CHECKS)) results.push(await CHECKS[k]())
const ok = results.every(Boolean)
process.exit(ok ? 0 : 1)
