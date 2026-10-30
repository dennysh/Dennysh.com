// Pruebas estáticas: escáner de secretos sobre archivos versionados, .env* y dist/.
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { scanText } from './lib/scan-secrets.mjs'

const SKIP = /\.(png|jpe?g|gif|webp|ico|svg|woff2?|glb|lock)$|package-lock\.json$|(^|\/)tests\/|scan-secrets/

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
const files = [...new Set([...tracked, ...walk('dist')])].filter((f) => !SKIP.test(f) && existsSync(f))

const hits = files.flatMap((f) => scanText(f, readFileSync(f, 'utf8')))
if (hits.length) {
  for (const h of hits) console.error(`SECRETO? ${h.file}:${h.line} (${h.rule})`)
  process.exit(1)
}
console.log(`test:static OK — ${files.length} archivos sin secretos`)
