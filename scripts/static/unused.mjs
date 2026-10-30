// Archivos sin usar (S20, AC-16, T093): grafo de imports desde las entradas reales + referencias a public/.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative, basename } from 'node:path'

const EXTS = ['', '.js', '.jsx', '.mjs', '.json', '.css', '/index.js', '/index.jsx']
const IMPORT = /(?:import|export)\s+(?:[^'"]*?from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

export function walk(dir, root = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p, root) : [relative(root, p)]
  })
}

function resolveImport(from, spec, root) {
  if (!spec.startsWith('.')) return null
  const base = resolve(root, dirname(from), spec)
  for (const e of EXTS) {
    const f = base + e
    if (existsSync(f) && statSync(f).isFile()) return relative(root, f)
  }
  return null
}

export function reachable(entries, root = '.') {
  const seen = new Set()
  const stack = [...entries]
  while (stack.length) {
    const f = stack.pop()
    if (seen.has(f) || !existsSync(join(root, f))) continue
    seen.add(f)
    if (!/\.(m?jsx?)$/.test(f)) continue
    const text = readFileSync(join(root, f), 'utf8')
    for (const m of text.matchAll(IMPORT)) {
      const r = resolveImport(f, m[1] ?? m[2], root)
      if (r) stack.push(r)
    }
  }
  return seen
}

// `keep`: rutas (prefijo) que se conservan aunque nadie las importe (datos de origen, entradas de herramientas).
export function checkUnused({ root = '.', keep = [] } = {}) {
  const entries = ['src/main.jsx', 'src/entry-server.jsx', 'vite.config.js', 'playwright.config.js', ...['scripts', 'server', 'functions', 'core'].flatMap((d) => walk(join(root, d), root).map((f) => join(d, f)))]
  const used = reachable(entries, root)
  const problems = []
  for (const f of walk(join(root, 'src'), root)) {
    if (!used.has(f) && !keep.some((k) => f.startsWith(k))) problems.push(`${f}: no se importa desde ninguna entrada`)
  }
  // public/: cada archivo debe nombrarse en el código, en index.html o en los scripts.
  const corpus = ['src', 'scripts', 'server', 'core', 'content', 'functions'].flatMap((d) => walk(join(root, d), root))
    .concat(['index.html']).filter((f) => existsSync(join(root, f)) && /\.(m?jsx?|json|html|css|mjs)$/.test(f))
    .map((f) => readFileSync(join(root, f), 'utf8')).join('\n')
  for (const f of walk(join(root, 'public'), root)) {
    if (basename(f) === '_headers') continue
    if (!corpus.includes(basename(f))) problems.push(`${f}: no se referencia en el código`)
  }
  return problems
}
