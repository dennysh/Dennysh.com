// Reglas estáticas de código (S9, S13, S15, D-01).
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const RULES = [
  ['dangerouslySetInnerHTML prohibido (S15)', /dangerouslySetInnerHTML/],
  ['innerHTML/outerHTML/insertAdjacentHTML prohibido (S15)', /\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(/],
  ['SQL concatenado: usa parámetros (S13)', /\.prepare\(\s*(`[^`]*\$\{|(['"])[^'"]*\2\s*\+)/],
  ['Set-Cookie prohibido: la demo no usa cookies (S9)', /\.(set|append)\(\s*['"]set-cookie|['"]?set-cookie['"]?\s*:/i],
  ['document.cookie prohibido (S9)', /document\.cookie/],
  ['eval / new Function prohibidos (S15)', /\beval\s*\(|new Function\s*\(/],
  // El constructor de Cloudflare Pages usa wrangler 3 (esbuild antiguo): `import … with {…}` rompe las Functions.
  ['import attributes (with/assert) prohibidos: wrangler 3 no los entiende; importa el JSON sin atributos', /^\s*(?:import|export)\b[^;\n]*\b(?:with|assert)\s*\{/m],
]

export function checkSourceRules(file, text) {
  const code = stripComments(text)
  return RULES.filter(([, re]) => re.test(code)).map(([msg]) => `${file}: ${msg}`)
}
