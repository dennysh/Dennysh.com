// Contenido bilingüe del sitio (spec §3, §4, §9). Solo datos reales de src/data/ o del prompt de Dennys.
// Todo lo no confirmado es un marcador pending(id, pista): el build de producción los lista y falla si no están autorizados.
export const pending = (id, hint) => ({ pending: true, id, hint })
export const isPending = (v) => v !== null && typeof v === 'object' && v.pending === true

// Marcadores que Dennys autoriza a publicar como "por definir" (vacío hasta que él responda).
export const AUTHORIZED_PENDING = []

const EMAIL = 'dennys14_hq@hotmail.com'
const LINKEDIN = 'https://www.linkedin.com/in/dennys-heras-27b0b520b/'
const GITHUB = 'https://github.com/dennysh'

export const links = { email: `mailto:${EMAIL}`, emailAddress: EMAIL, linkedin: LINKEDIN, github: GITHUB, cv: '/cv-dennys-heras.pdf' }

export const site = {
  en: {
    lang: 'en',
    meta: {
      title: 'Dennys Heras — Automation that decides, explains and stays under human control',
      description: 'Dennys Heras builds automated systems that make decisions, explain them in plain language, leave an audit trail and hand control to a person. Live demo included.',
    },
    nav: { demo: 'Demo', factory: 'Agent factory', governance: 'AI governance', work: 'Work', skills: 'Skills', journey: 'Journey', contact: 'Contact', menu: 'Sections', skip: 'Skip to content', lang: 'Español' },
    hero: {
      thesis: 'Automation that decides, explains itself and stays under human control.',
      who: ['Dennys Heras', pending('P-09', 'Role sought, location or time zone and availability'), 'Seven years in the field before writing software'],
      tryDemo: 'Try the demo',
      contact: 'Get in touch',
      summaryTitle: 'Summary in 5 lines',
      summary: [
        'Dennys Heras builds automated systems that decide, explain the decision in plain language and keep an audit trail a person can check.',
        'Seven years in the field with fiber optics; learned Python to solve problems he had himself.',
        'In production: a Telegram bot for ISP technicians that finds the nearest network boxes and sends map routes.',
        'Works with AI coding agents under limits: delegated tasks, automatic review and human verification of what the agents report.',
        'Contact: dennys14_hq@hotmail.com · LinkedIn dennys-heras-27b0b520b · GitHub dennysh.',
      ],
    },
    demo: {
      title: 'Live demo: an automated decision, explained',
      lead: 'One click simulates a suspicious access. The system decides, explains why, shows the rule it used, keeps a full audit trail and lets you take control.',
      notice: 'Simulated test environment. Nothing real is attacked or blocked.',
    },
    factory: {
      title: 'The software factory with agents',
      lead: 'The way I build: an orchestrator splits the work into delegated tasks with limits, each result passes an automatic review, and a person verifies what the agents report.',
      diagramTitle: 'Diagram of the software factory with agents',
      diagramDesc: 'Five steps in a row: orchestrator, delegated tasks with limits, automatic review, tunnel and access with Cloudflare, human verification.',
      steps: [
        { id: 'orchestrator', label: 'Orchestrator', text: 'Claude Code orchestrator running on an Ubuntu laptop.' },
        { id: 'tasks', label: 'Delegated tasks', text: 'Each task has explicit limits: what it may touch and what it may not.' },
        { id: 'review', label: 'Automatic review', text: 'Every result is reviewed automatically before it is accepted.' },
        { id: 'access', label: 'Tunnel and access', text: 'Remote access goes through a Cloudflare tunnel with access control.' },
        { id: 'human', label: 'Human verification', text: 'A person verifies what the agents report. Reports are not taken as proof.' },
      ],
      evidence: pending('P-04', 'Public evidence of the factory: repository, captures or task logs that Dennys confirms'),
    },
    governance: {
      title: 'How I work with AI',
      lead: 'Using AI is not the point. Governing it is. These are the working rules, short and checkable.',
      rules: [
        { title: 'Limits per task', text: 'Every delegated task states what it may change. Anything outside is not done.' },
        { title: 'Review before accepting', text: 'No result is accepted before an automatic review has read it.' },
        { title: 'A person verifies', text: 'What an agent reports is checked by a person; the report alone is not evidence.' },
        { title: 'Traceability', text: 'Decisions and changes leave a record: what, why, when and under which rule.' },
        { title: 'Controlled cost', text: 'Nothing runs a paid model per visitor click; limits are set before launch.' },
      ],
      method: 'This site was designed spec-first. The design, plan and decision log are written down before the code.',
    },
    work: {
      title: 'Demonstrated work',
      lead: 'Each item states its status. Nothing here is presented as finished when it is not.',
      status: { production: 'In production', development: 'In development', exploration: 'Exploration' },
      repo: 'Repository',
      items: [
        {
          id: 'caja-cercana', status: 'production', title: 'Telegram bot · Caja Cercana',
          text: 'Tool for ISP field technicians: receives the technician location, computes the nearest fiber boxes with the Haversine distance and returns map routes. SQLite, pytest, access restricted by group.',
          repo: pending('P-06', 'Correct repository URL of the bot'),
        },
        { id: 'registro-cajas', status: 'development', title: 'Telegram bot · Box registry', text: 'Registers network boxes from the field, with location and evidence, to build a more reliable technical inventory.', repo: 'https://github.com/dennysh/bot_registro_cajas' },
        { id: 'reportes-telecom', status: 'development', title: 'Telegram bot · Telecom reports', text: 'Technical telecom reports from Telegram: incidents, inspections and follow-up.', repo: 'https://github.com/dennysh/Bot_Reportes_Telecom' },
        { id: 'contable', status: 'development', title: 'Accounting system · React + Flask', text: 'Web accounting system with financial dashboard, clients, suppliers, inventory, invoices, payroll and journal entries. MySQL.', repo: 'https://github.com/dennysh/Sistema-Contable' },
        { id: 'futbol', status: 'development', title: 'Football Manager', text: 'Web app to manage matches, teams and players, with filters, profiles and statistics.', repo: 'https://github.com/dennysh/futbolManager' },
        { id: 'hardlock', status: 'exploration', title: 'HARDLOCK · Android/Kotlin', text: 'Android project in Kotlin. Exploration; its scope is still to be documented.', repo: 'https://github.com/dennysh/HARDLOCK' },
      ],
    },
    skills: {
      title: 'Skills',
      lead: 'Grouped by what I can do. "Shown" means there is proof above; "declared" means I use it but have no public proof yet.',
      shown: 'Shown', declared: 'Declared',
      groups: [
        { title: 'Bots and automation', shown: ['Python', 'Telegram bots', 'SQLite', 'pytest'], declared: ['Webhooks', 'REST APIs'] },
        { title: 'AI systems', shown: [], declared: ['LLM APIs', 'Claude', 'OpenAI', 'Gemini', 'Whisper', 'AI agents'] },
        { title: 'Data and back end', shown: ['SQLite'], declared: ['PostgreSQL', 'MongoDB', 'Go', 'Node.js'] },
        { title: 'Operations', shown: [], declared: ['Docker', 'Cloudflare', 'Linux', 'SSH', 'Git and GitHub'] },
      ],
    },
    journey: {
      title: 'Journey',
      lines: [
        'Seven years in the field working with fiber optics.',
        'There I met problems nobody had solved with software.',
        'I learned Python to solve them myself.',
        'Today I build systems with AI that stay reliable, explainable and under control.',
      ],
    },
    criden: { title: 'Criden', text: 'For businesses and websites: Criden. A separate product from this site.', link: pending('P-22', 'Criden address') },
    contact: {
      title: 'Contact',
      email: 'Email', linkedin: 'LinkedIn', github: 'GitHub', cv: 'Download CV (PDF)',
      languages: pending('P-09', 'Languages'), timezone: pending('P-09', 'Time zone'), role: pending('P-09', 'Role sought'),
    },
    footer: { privacy: 'Privacy', terms: 'Terms', copyright: 'Dennys Heras © 2026' },
  },

  es: {
    lang: 'es',
    meta: {
      title: 'Dennys Heras — Automatización que decide, explica y se deja gobernar',
      description: 'Dennys Heras construye sistemas automatizados que toman decisiones, las explican en lenguaje claro, dejan rastro y ceden el control a una persona. Incluye demo en vivo.',
    },
    nav: { demo: 'Demo', factory: 'Fábrica de agentes', governance: 'Gobernanza de IA', work: 'Trabajo', skills: 'Capacidades', journey: 'Trayectoria', contact: 'Contacto', menu: 'Secciones', skip: 'Saltar al contenido', lang: 'English' },
    hero: {
      thesis: 'Automatización que decide, se explica y se deja gobernar.',
      who: ['Dennys Heras', pending('P-09', 'Rol buscado, ubicación o zona horaria y disponibilidad'), 'Siete años en el campo antes de escribir software'],
      tryDemo: 'Probar la demo',
      contact: 'Contactar',
      summaryTitle: 'Resumen en 5 líneas',
      summary: [
        'Dennys Heras construye sistemas automatizados que deciden, explican la decisión en lenguaje claro y dejan un rastro de auditoría que una persona puede comprobar.',
        'Siete años en campo con fibra óptica; aprendió Python para resolver problemas que tenía él mismo.',
        'En producción: un bot de Telegram para técnicos de ISP que encuentra las cajas de red más cercanas y envía rutas en el mapa.',
        'Trabaja con agentes de IA que programan, bajo límites: tareas delegadas, revisión automática y verificación humana de lo que reportan los agentes.',
        'Contacto: dennys14_hq@hotmail.com · LinkedIn dennys-heras-27b0b520b · GitHub dennysh.',
      ],
    },
    demo: {
      title: 'Demo en vivo: una decisión automatizada, explicada',
      lead: 'Un clic simula un acceso sospechoso. El sistema decide, explica por qué, muestra la regla que usó, guarda una pista de auditoría completa y te deja tomar el control.',
      notice: 'Entorno de prueba simulado. Nada real se ataca ni se bloquea.',
    },
    factory: {
      title: 'La fábrica de software con agentes',
      lead: 'Así construyo: un orquestador reparte el trabajo en tareas delegadas con límites, cada resultado pasa por una revisión automática y una persona verifica lo que reportan los agentes.',
      diagramTitle: 'Diagrama de la fábrica de software con agentes',
      diagramDesc: 'Cinco pasos en fila: orquestador, tareas delegadas con límites, revisión automática, túnel y acceso con Cloudflare, verificación humana.',
      steps: [
        { id: 'orchestrator', label: 'Orquestador', text: 'Orquestador de Claude Code en una laptop con Ubuntu.' },
        { id: 'tasks', label: 'Tareas delegadas', text: 'Cada tarea tiene límites explícitos: qué puede tocar y qué no.' },
        { id: 'review', label: 'Revisión automática', text: 'Cada resultado se revisa de forma automática antes de aceptarse.' },
        { id: 'access', label: 'Túnel y acceso', text: 'El acceso remoto pasa por un túnel de Cloudflare con control de acceso.' },
        { id: 'human', label: 'Verificación humana', text: 'Una persona verifica lo que reportan los agentes. Un informe no se toma como prueba.' },
      ],
      evidence: pending('P-04', 'Evidencia pública de la fábrica: repositorio, capturas o registros de tareas que Dennys confirme'),
    },
    governance: {
      title: 'Cómo trabajo con IA',
      lead: 'Lo importante no es usar IA, sino gobernarla. Estas son las reglas con las que trabajo, cortas y comprobables.',
      rules: [
        { title: 'Límites por tarea', text: 'Cada tarea delegada dice qué puede cambiar. Lo que queda fuera no se hace.' },
        { title: 'Revisión antes de aceptar', text: 'Ningún resultado se acepta antes de que una revisión automática lo haya leído.' },
        { title: 'Una persona verifica', text: 'Lo que un agente reporta lo comprueba una persona; el informe solo no es evidencia.' },
        { title: 'Trazabilidad', text: 'Las decisiones y los cambios dejan registro: qué, por qué, cuándo y bajo qué regla.' },
        { title: 'Costo controlado', text: 'Nada llama a un modelo de pago por cada clic de un visitante; los límites se fijan antes de publicar.' },
      ],
      method: 'Este sitio se diseñó primero como especificación. El diseño, el plan y el registro de decisiones están escritos antes del código.',
    },
    work: {
      title: 'Trabajo demostrado',
      lead: 'Cada ítem indica su estado. Nada se presenta como terminado si no lo está.',
      status: { production: 'En producción', development: 'En desarrollo', exploration: 'Exploración' },
      repo: 'Repositorio',
      items: [
        {
          id: 'caja-cercana', status: 'production', title: 'Bot de Telegram · Caja Cercana',
          text: 'Herramienta para técnicos de campo de ISP: recibe la ubicación del técnico, calcula las cajas de fibra más cercanas con distancia Haversine y devuelve rutas en el mapa. SQLite, pytest, acceso restringido por grupo.',
          repo: pending('P-06', 'URL correcta del repositorio del bot'),
        },
        { id: 'registro-cajas', status: 'development', title: 'Bot de Telegram · Registro de cajas', text: 'Registra cajas de red desde el campo, con ubicación y evidencia, para construir un inventario técnico más confiable.', repo: 'https://github.com/dennysh/bot_registro_cajas' },
        { id: 'reportes-telecom', status: 'development', title: 'Bot de Telegram · Reportes Telecom', text: 'Reportes técnicos de telecomunicaciones desde Telegram: incidencias, inspecciones y seguimiento.', repo: 'https://github.com/dennysh/Bot_Reportes_Telecom' },
        { id: 'contable', status: 'development', title: 'Sistema contable · React + Flask', text: 'Sistema contable web con panel financiero, clientes, proveedores, inventario, facturas, nómina y asientos contables. MySQL.', repo: 'https://github.com/dennysh/Sistema-Contable' },
        { id: 'futbol', status: 'development', title: 'Fútbol Manager', text: 'Aplicación web para gestionar partidos, equipos y jugadores, con filtros, perfiles y estadísticas.', repo: 'https://github.com/dennysh/futbolManager' },
        { id: 'hardlock', status: 'exploration', title: 'HARDLOCK · Android/Kotlin', text: 'Proyecto Android en Kotlin. Exploración; su alcance está pendiente de documentar.', repo: 'https://github.com/dennysh/HARDLOCK' },
      ],
    },
    skills: {
      title: 'Capacidades',
      lead: 'Agrupadas por lo que sé hacer. "Demostrado" significa que hay prueba arriba; "declarado" significa que lo uso pero aún no hay prueba pública.',
      shown: 'Demostrado', declared: 'Declarado',
      groups: [
        { title: 'Bots y automatización', shown: ['Python', 'Bots de Telegram', 'SQLite', 'pytest'], declared: ['Webhooks', 'APIs REST'] },
        { title: 'Sistemas con IA', shown: [], declared: ['APIs de LLM', 'Claude', 'OpenAI', 'Gemini', 'Whisper', 'Agentes de IA'] },
        { title: 'Datos y back end', shown: ['SQLite'], declared: ['PostgreSQL', 'MongoDB', 'Go', 'Node.js'] },
        { title: 'Operaciones', shown: [], declared: ['Docker', 'Cloudflare', 'Linux', 'SSH', 'Git y GitHub'] },
      ],
    },
    journey: {
      title: 'Trayectoria',
      lines: [
        'Siete años en el campo trabajando con fibra óptica.',
        'Ahí conocí problemas que nadie había resuelto con software.',
        'Aprendí Python para resolverlos yo mismo.',
        'Hoy construyo sistemas con IA que siguen siendo fiables, explicables y controlados.',
      ],
    },
    criden: { title: 'Criden', text: 'Para negocios y páginas web: Criden. Es un producto aparte de este sitio.', link: pending('P-22', 'Dirección de Criden') },
    contact: {
      title: 'Contacto',
      email: 'Correo', linkedin: 'LinkedIn', github: 'GitHub', cv: 'Descargar CV (PDF)',
      languages: pending('P-09', 'Idiomas'), timezone: pending('P-09', 'Zona horaria'), role: pending('P-09', 'Rol buscado'),
    },
    footer: { privacy: 'Privacidad', terms: 'Términos', copyright: 'Dennys Heras © 2026' },
  },
}

// Recorre el contenido y devuelve todos los marcadores pending (con su ruta).
export function collectPending(node = site, path = '') {
  if (isPending(node)) return [{ ...node, path }]
  if (Array.isArray(node)) return node.flatMap((v, i) => collectPending(v, `${path}[${i}]`))
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => collectPending(v, path ? `${path}.${k}` : k))
  return []
}
