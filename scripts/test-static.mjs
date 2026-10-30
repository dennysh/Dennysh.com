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
import { checkPrerender, checkMachine, checkLegal, checkStaticExample, checkSvg, checkFonts, checkBudget } from './static/site.mjs'
import { buildStaticExample } from './gen-static-example.mjs'
import { loadRuleset } from '../core/ruleset.js'
import { checkUnused } from './static/unused.mjs'

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
  // AC-22: el build no lleva nombres de variables secretas del servidor (ni token ni claves).
  const leaks = walk('dist').filter((f) => /\.(html|js|css|json|txt)$/.test(f)).filter((f) => /TELEGRAM_BOT_TOKEN|TURNSTILE_SECRET|HMAC_KEY/.test(readFileSync(f, 'utf8')))
  for (const f of leaks) console.error(`SECRETO? nombre de variable secreta en ${f}`)
  const ok = !hits.length && !vite.length && !hist.length && !leaks.length
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

// AC-23: en producción ninguna plantilla puede estar sin revisar, salvo autorización explícita y trazable (quién, cuándo y por qué)
// de Dennys para una publicación concreta. Autorizar publicar NO las vuelve "revisadas": la pantalla sigue diciendo "pendiente de revisión".
const hasAuthorization = (t) => {
  const a = t.publicarSinRevision
  return Boolean(a) && ['autorizadaPor', 'fecha', 'razon'].every((k) => typeof a[k] === 'string' && a[k].trim() !== '')
}
function explainReview() {
  const file = process.env.EXPLAIN_TEMPLATES || 'content/explanations/v1.json'
  const pending = JSON.parse(readFileSync(file, 'utf8')).templates.filter((t) => !isReviewed(t))
  if (!pending.length) {
    console.log('explain-review OK — todas las plantillas están revisadas')
    return true
  }
  const unauthorized = pending.filter((t) => !hasAuthorization(t))
  if (process.env.NODE_ENV === 'production') {
    if (unauthorized.length) {
      console.error(`explain-review FALLA — sin revisadaPor/revisadaEn ni autorización explícita: ${unauthorized.map((t) => t.id).join(', ')}`)
      return false
    }
    console.log(`explain-review OK (producción) — ${pending.length} plantillas publicadas como borrador por autorización explícita de ${pending[0].publicarSinRevision.autorizadaPor} (${pending[0].publicarSinRevision.fecha}); la pantalla las marca como pendientes de revisión humana`)
    return true
  }
  console.log(`explain-review aviso (desarrollo) — pendientes de revisión: ${pending.map((t) => t.id).join(', ')}`)
  return true
}

// Comprobaciones sobre dist/ (hay que construir antes: npm run build).
const distRead = (rel) => (existsSync(join('dist', rel)) ? readFileSync(join('dist', rel), 'utf8') : null)
const distBuf = (rel) => (existsSync(join('dist', rel)) ? readFileSync(join('dist', rel)) : null)
function onDist(name, fn) {
  return () => {
    if (!existsSync('dist/index.html')) { console.error(`${name}: no hay dist/; ejecuta npm run build`); return false }
    const problems = fn()
    for (const p of problems) console.error(`${name}: ${p}`)
    if (!problems.length) console.log(`${name} OK`)
    return problems.length === 0
  }
}
const prerender = onDist('prerender', () => checkPrerender(distRead))
const machine = onDist('machine', () => checkMachine(distRead))
const legal = onDist('legal', () => checkLegal(distRead))
const svg = onDist('svg', () => checkSvg(distRead))
const fonts = onDist('fonts', () => checkFonts(walk('dist').filter((f) => /\.(html|css|js)$/.test(f)).map((path) => ({ path, text: readFileSync(path, 'utf8') }))))
const budgets = onDist('budgets', () => checkBudget(distRead, distBuf))
const staticExample = async () => {
  const problems = onDistProblems(checkStaticExample(distRead))
  const fresh = JSON.stringify(await buildStaticExample(), null, 2) + '\n'
  if (readFileSync('src/demo/static-example.json', 'utf8') !== fresh) problems.push('src/demo/static-example.json no coincide con el núcleo (node scripts/gen-static-example.mjs)')
  for (const p of problems) console.error(`static-example: ${p}`)
  if (!problems.length) console.log('static-example OK — etiquetado como no real, sin entrega, en sincronía con el núcleo')
  return problems.length === 0
}
const onDistProblems = (p) => (existsSync('dist/index.html') ? p : ['no hay dist/; ejecuta npm run build'])
// AC-24: el ruleset público es el que firma la auditoría.
const rulesetPublic = async () => {
  const problems = onDistProblems([])
  if (!problems.length) {
    const pub = (await loadRuleset(JSON.parse(distRead('demo/ruleset.v1.json')))).ruleset
    const example = JSON.parse(readFileSync('src/demo/static-example.json', 'utf8'))
    if (pub.hash !== example.ruleset.hash) problems.push('el hash del ruleset público no coincide con el de la auditoría')
    if (distRead('demo/explanations.v1.json') !== readFileSync('content/explanations/v1.json', 'utf8')) problems.push('las plantillas públicas difieren de las del código')
  }
  for (const p of problems) console.error(`ruleset-public: ${p}`)
  if (!problems.length) console.log('ruleset-public OK — el hash público coincide con la auditoría')
  return problems.length === 0
}

// T093: sin archivos huérfanos. src/data/ se conserva: es la fuente de los datos reales (constitución, regla 11).
const unused = () => {
  const problems = checkUnused({ keep: ['src/data/'] })
  for (const p of problems) console.error(`unused: ${p}`)
  if (!problems.length) console.log('unused OK — sin archivos sin importar ni imágenes sin referencia')
  return problems.length === 0
}

// T080: lista los marcadores pending; en producción falla si alguno no está autorizado por Dennys.
async function content() {
  const { collectPending, unauthorized } = await import('../src/content/site.js')
  const all = collectPending()
  const ids = [...new Set(all.map((p) => p.id))]
  const bad = unauthorized(all)
  console.log(`content: ${all.length} marcadores pending (${ids.join(', ')}); ${all.length - bad.length} autorizados a publicarse`)
  if (process.env.NODE_ENV === 'production' && bad.length) {
    for (const p of bad) console.error(`pending sin autorizar ${p.id} en ${p.path}: ${p.hint}`)
    return false
  }
  if (process.env.NODE_ENV === 'production') console.log('content OK (producción) — todos los marcadores pending están autorizados')
  return true
}

const CHECKS = { secrets, unused, headers, content, prerender, machine, legal, svg, fonts, budgets, 'static-example': staticExample, 'ruleset-public': rulesetPublic, rules, 'no-ai-routes': noAiRoutes, 'explain-review': explainReview }
const wanted = process.argv.slice(2).filter((a) => a in CHECKS)
const results = []
for (const k of wanted.length ? wanted : Object.keys(CHECKS)) results.push(await CHECKS[k]())
const ok = results.every(Boolean)
process.exit(ok ? 0 : 1)
