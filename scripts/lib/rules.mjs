// Mismas reglas que usa la página, leídas del archivo para el build (Node no importa JSON sin atributos; wrangler 3 tampoco).
import { readFileSync } from 'node:fs'
import { publicRules } from '../../src/home/rules-core.js'

export const workingRules = JSON.parse(readFileSync(new URL('../../content/working-rules.json', import.meta.url), 'utf8'))
export const publicRulesFor = (lang) => publicRules(workingRules, lang)
