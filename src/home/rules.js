// Solo las reglas públicas (scripts/gen-public-rules.mjs): las `public: false` no deben viajar en el JS del cliente.
import rules from './rules.public.json'
import { publicRules, machineRulesText } from './rules-core.js'

export const workingRules = rules
export const peopleRules = (lang) => publicRules(rules, lang)
export const machineRules = (lang) => machineRulesText(rules, lang)
