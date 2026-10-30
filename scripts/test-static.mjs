// Pruebas estáticas. Sin argumentos: todas. Con argumento: solo esa (p. ej. `explain-review`).
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { scanText } from './lib/scan-secrets.mjs'
import { isReviewed } from '../core/explain.js'

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
  if (!hits.length) console.log(`secrets OK — ${files.length} archivos sin secretos`)
  return hits.length === 0
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

const CHECKS = { secrets, 'explain-review': explainReview }
const wanted = process.argv.slice(2).filter((a) => a in CHECKS)
const ok = (wanted.length ? wanted : Object.keys(CHECKS)).map((k) => CHECKS[k]()).every(Boolean)
process.exit(ok ? 0 : 1)
