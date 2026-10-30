// Sin IA por clic y superficie de rutas cerrada (AC-10, S6, D-01).
const ROUTES = ['functions/api/simulate.js', 'functions/api/intervene.js', 'functions/api/event/[id].js', 'functions/api/_middleware.js']
const AI_PACKAGES = ['openai', 'ai', 'anthropic', 'langchain', 'cohere-ai', 'groq-sdk', 'replicate']
const AI_SCOPES = ['@anthropic-ai/', '@google/generative-ai', '@google/genai', '@mistralai/', '@huggingface/', '@langchain/', '@openai/']
const AI_HOSTS = /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|api\.cohere\.(ai|com)|api\.mistral\.ai|api\.groq\.com|api-inference\.huggingface\.co|openrouter\.ai/
const FETCH_ALLOWED = ['/api/', 'https://api.telegram.org/', 'https://challenges.cloudflare.com/']

export function checkSurface({ files }) {
  const problems = []
  for (const { path, text } of files) {
    if (path.startsWith('functions/api/') && !ROUTES.includes(path)) problems.push(`${path}: ruta fuera de las tres previstas`)
    for (const m of text.matchAll(/(?:from\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g)) {
      const spec = m[1]
      if (AI_PACKAGES.includes(spec) || AI_SCOPES.some((s) => spec.startsWith(s))) problems.push(`${path}: importa un proveedor de modelos (${spec})`)
    }
    if (AI_HOSTS.test(text)) problems.push(`${path}: apunta a un proveedor de modelos`)
    for (const m of text.matchAll(/\bfetch\(\s*([`'"]?)([^`'"\n)]*)/g)) {
      const [, quote, dest] = m
      if (!quote || !FETCH_ALLOWED.some((a) => dest.startsWith(a))) problems.push(`${path}: fetch a destino no permitido o dinámico (${quote ? dest : 'variable'})`)
    }
  }
  return problems
}
