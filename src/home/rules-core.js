// Reglas de trabajo (content/working-rules.json): una sola fuente, solo las `public: true` salen (spec primera pantalla §4.2).
export const publicRules = (rules, lang) => rules.filter((r) => r.public).map((r) => r[lang])

// Formato llms.txt de la pestaña Máquinas: solo hechos, sin instrucciones para un revisor.
export const machineRulesText = (rules, lang) => ['# Working rules (llms.txt format)', ...publicRules(rules, lang).map((t) => `- ${t}`)].join('\n')
