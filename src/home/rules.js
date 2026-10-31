import rules from '../../content/working-rules.json'
import { publicRules, machineRulesText } from './rules-core.js'

export const workingRules = rules
export const peopleRules = (lang) => publicRules(rules, lang)
export const machineRules = (lang) => machineRulesText(rules, lang)
