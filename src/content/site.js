// Contenido bilingüe del sitio (spec §3, §4, §9). Solo datos reales de src/data/ o del prompt de Dennys.
// Todo lo no confirmado es un marcador pending(id, pista): el build de producción los lista y falla si no están autorizados.
// `label` (opcional) es el texto público cuando el marcador está autorizado a publicarse; por defecto, "por confirmar".
export const pending = (id, hint, label) => ({ pending: true, id, hint, ...(label ? { label } : {}) })
export const isPending = (v) => v !== null && typeof v === 'object' && v.pending === true

// Datos de perfil estructurados (no localizados) para los datos de máquina. Confirmados por Dennys el 2026-10-30.
export const profile = {
  remote: true,
  timezone: 'UTC-5',
  languages: [
    { code: 'es', name: 'Spanish', fluency: 'Native speaker' },
    { code: 'en', name: 'English', fluency: 'B1' },
  ],
}

// Marcadores que Dennys autoriza a publicar como "por confirmar". Autorizados el 2026-10-30 para la primera publicación
// (razón y alcance en 02-DOCS/wiki/sdd/decisions.md, D-IMPL-11; P-29 el 2026-10-31, D-H12: la galería de Trayectoria queda oculta mientras no haya fotos reales). Cualquier marcador nuevo debe autorizarse aquí a propósito.
export const AUTHORIZED_PENDING = ['P-04', 'P-06', 'P-09', 'P-22', 'P-29']

// Fotos de la galería de Trayectoria: Dennys las entrega en unos días (P-29). Mientras no haya fotos reales la galería no se muestra.
// Solo la compilación de pruebas e2e (modo de Vite `e2e`) pone fotos de relleno para ejercitar el componente; nunca la de producción.
const E2E_PHOTOS = import.meta.env?.MODE === 'e2e'
const photos = (n) => (E2E_PHOTOS ? Array.from({ length: n }, () => ({ src: '/images/dennys-portrait-360.webp', alt: '', width: 360, height: 484 })) : [])

export const unauthorized = (list, authorized = AUTHORIZED_PENDING) => list.filter((p) => !authorized.includes(p.id))

const EMAIL = 'dennys@dennysh.com'
const LINKEDIN = 'https://www.linkedin.com/in/dennys-heras-27b0b520b/'
const GITHUB = 'https://github.com/dennysh'

export const links = { email: `mailto:${EMAIL}`, emailAddress: EMAIL, linkedin: LINKEDIN, github: GITHUB, cv: '/cv-dennys-heras.pdf' }

export const site = {
  en: {
    lang: 'en',
    meta: {
      title: 'Dennys Heras — AI systems that explain themselves and can be audited',
      description: 'Dennys Heras builds AI systems that explain their decisions in plain language, leave an audit trail and hand control to a person. Comes from 7 years in fiber-optic networks. Live demo included.',
    },
    nav: { demo: 'Demo', factory: 'Agent factory', governance: 'AI governance', work: 'Work', skills: 'Skills', journey: 'Journey', contact: 'Contact', menu: 'Sections', skip: 'Skip to content', lang: 'Español' },
    hero: {
      thesis: 'I build AI systems that explain themselves and can be audited.',
      who: ['I come from 7 years in fiber-optic networks, where things have to work in the field.'],
      tryDemo: 'Try the demo',
      contact: 'Get in touch',
      summaryTitle: 'Summary in 5 lines',
      summary: [
        'Dennys Heras builds AI systems that explain themselves and can be audited.',
        'Comes from 7 years in fiber-optic networks, where things have to work in the field.',
        'In production: a Telegram bot for ISP technicians that finds the nearest network box, and a football-championships platform.',
        'Works with AI coding agents under limits, with automatic review and human checks.',
        'Contact: dennys@dennysh.com, LinkedIn and GitHub (dennysh).',
      ],
    },
    home: {
      tagline: ['7 years in fiber optics', 'Remote · UTC-5 · Spanish native · English B1'],
      bar: { cv: 'CV', contact: 'Contact' },
      portraitAlt: 'Portrait of Dennys Heras',
      hint: 'Scroll',
      nodesLabel: 'Explore',
      nodes: [
        { id: 'code', label: 'Code' }, { id: 'projects', label: 'Projects' }, { id: 'demo', label: 'Demo' },
        { id: 'journey', label: 'Journey' }, { id: 'how', label: 'How I work' }, { id: 'interest', label: 'Interest' },
      ],
      panels: {
        code: { title: 'Code', note: 'Real data from the demo: the public ruleset and the static audit example.', github: 'View on GitHub ↗', projects: 'View projects →' },
        projects: { title: 'Work in production', text: 'Telegram bot for ISP technicians. A children\'s football championships site for a client.', opens: 'opens a new page', go: 'Open Projects →' },
        demo: { title: 'Live demo', text: 'An automated decision, with the rule used, the explanation and its audit.', opens: 'opens a new page', go: 'Open the demo →' },
        journey: { title: 'From fiber to AI', text: 'Seven years in fiber-optic networks, where things have to work in the field.', opens: 'opens a new page', go: 'Open Journey →' },
        how: { title: 'How I work', tabs: { people: 'People', machines: 'Machines' }, read: 'Read the rules →' },
        interest: {
          title: 'Interest', sportsLabel: 'Sports',
          sports: ['jiu-jitsu'],
          sportsMore: 'I have also done triathlon and obstacle courses (cycling, swimming and track), a few times, not consistently.',
          thought: 'What if, in a few years, we could connect the brain to AI and strengthen what is human? I do not know if it will be possible. I think so. (An idea, not a capability.)',
          contact: 'Contact →',
        },
      },
    },
    projectsPage: {
      back: 'Back to the home screen',
      title: 'Projects', lead: 'What is confirmed so far, each item marked in production or in development.', ids: ['caja-cercana', 'super-gol-kids'],
      description: 'Confirmed projects by Dennys Heras: a Telegram bot for ISP technicians and a football-championships site for a client, each marked in production or in development.',
    },
    journeyPage: {
      back: 'Back to the home screen',
      title: 'Journey', lead: 'From fiber-optic fieldwork to building AI systems.',
      description: 'From fiber-optic fieldwork to building AI systems: the journey of Dennys Heras.',
      photosPending: pending('P-29', 'Photos for the Journey gallery: Dennys delivers them in a few days (the gallery stays hidden until then)'),
      gallery: { hint: 'Move the pointer along a row to see its photos. On touch screens, tap a row.', photoOf: 'Photo {k} of {n}', prev: 'Previous photo', next: 'Next photo', close: 'Close', list: 'Places and projects' },
      rows: [
        { id: 'fibra', title: 'Fiber-optic networks', meta: ['7 years'], text: '7 years in fiber-optic networks, where things have to work in the field.', photos: photos(6) },
        { id: 'bot', title: 'Caja Cercana bot', meta: ['2025', 'In production'], text: 'Telegram bot for ISP technicians that finds the nearest network box to their location. Used internally at the company.', photos: photos(4) },
        { id: 'supergol', title: 'Super Gol Kids', meta: ['In production'], text: 'Platform for children\'s football championships. Public website for a client; I developed the site.', photos: photos(3) },
        { id: 'ia', title: 'AI systems', meta: ['Now'], text: 'I build AI systems that explain themselves and can be audited.', photos: photos(5) },
      ],
    },
    demo: {
      description: 'Live demo of an automated decision: the rule used, the explanation in plain language and its audit trail. A simulation with synthetic data.',
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
      evidence: pending('P-04', 'Public evidence of the factory: repository, captures or task logs that Dennys confirms', 'Public evidence (repository, captures) is being prepared.'),
    },
    governance: {
      title: 'How I work with AI',
      lead: 'Using AI is not the point. Governing it is. These are the working rules, short and checkable.',
      method: 'This site was designed spec-first. The design, plan and decision log are written down before the code.',
    },
    work: {
      title: 'Demonstrated work',
      lead: 'Each item is marked in production or in development, nothing else.',
      status: { production: 'In production', development: 'In development' },
      repo: 'Repository',
      visit: 'Visit the site',
      items: [
        {
          id: 'caja-cercana', status: 'production', title: 'Telegram bot · Caja Cercana',
          text: 'Development and launch (2025) of a Telegram bot for ISP technicians that finds the nearest network box to their location. Used internally at the company. Python, SQLite, pytest.',
          repo: pending('P-06', 'Correct repository URL of the bot'),
        },
        { id: 'super-gol-kids', status: 'production', title: 'Super Gol Kids', text: 'Platform for children\'s football championships. Public website for a client; I developed the site.', url: 'https://www.supergolkids.com/' },
        { id: 'naunturia', status: 'development', title: 'Naunturia', text: 'Project in development.' },
        { id: 'registro-cajas', status: 'development', title: 'Telegram bot · Box registry', text: 'Registers network boxes from the field, with location and evidence, to build a more reliable technical inventory.', repo: 'https://github.com/dennysh/bot_registro_cajas' },
        { id: 'reportes-telecom', status: 'development', title: 'Telegram bot · Telecom reports', text: 'Technical telecom reports from Telegram: incidents, inspections and follow-up.', repo: 'https://github.com/dennysh/Bot_Reportes_Telecom' },
        { id: 'contable', status: 'development', title: 'Accounting system · React + Flask', text: 'Web accounting system with financial dashboard, clients, suppliers, inventory, invoices, payroll and journal entries. MySQL.', repo: 'https://github.com/dennysh/Sistema-Contable' },
        { id: 'futbol', status: 'development', title: 'Football Manager', text: 'Web app to manage matches, teams and players, with filters, profiles and statistics.', repo: 'https://github.com/dennysh/futbolManager' },
        { id: 'hardlock', status: 'development', title: 'HARDLOCK · Android/Kotlin', text: 'Android project in Kotlin; its scope is still to be documented.', repo: 'https://github.com/dennysh/HARDLOCK' },
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
        '7 years in the field working with fiber optics.',
        'There I ran into problems that software could solve.',
        'I learned Python to solve them myself.',
        'Today I build AI systems that explain themselves and can be audited.',
      ],
    },
    criden: { title: 'Criden', text: 'For businesses and websites: Criden. A separate product from this site.', link: pending('P-22', 'Criden address', 'Link coming soon.') },
    contact: {
      title: 'Contact',
      email: 'Email', linkedin: 'LinkedIn', github: 'GitHub', cv: 'Download CV (PDF)',
      location: 'Remote, from anywhere in the world.',
      availability: pending('P-09', 'Availability'),
      role: 'I look for work with artificial intelligence: designing and building systems under human control.',
      interest: 'Long-term interest: how AI relates to the human brain. An interest, not a demonstrated skill.',
      languages: 'Spanish: native. English: B1.', timezone: 'UTC-5',
    },
    footer: { privacy: 'Privacy', terms: 'Terms', copyright: 'Dennys Heras © 2026' },
  },

  es: {
    lang: 'es',
    meta: {
      title: 'Dennys Heras — Sistemas con IA que se explican y se auditan',
      description: 'Dennys Heras construye sistemas con IA que explican sus decisiones en lenguaje claro, dejan rastro y ceden el control a una persona. Viene de 7 años en redes de fibra óptica. Incluye demo en vivo.',
    },
    nav: { demo: 'Demo', factory: 'Fábrica de agentes', governance: 'Gobernanza de IA', work: 'Trabajo', skills: 'Capacidades', journey: 'Trayectoria', contact: 'Contacto', menu: 'Secciones', skip: 'Saltar al contenido', lang: 'English' },
    hero: {
      thesis: 'Construyo sistemas con IA que se explican y se auditan.',
      who: ['Vengo de 7 años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.'],
      tryDemo: 'Probar la demo',
      contact: 'Contactar',
      summaryTitle: 'Resumen en 5 líneas',
      summary: [
        'Dennys Heras construye sistemas con IA que se explican y se auditan.',
        'Viene de 7 años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.',
        'En producción: un bot de Telegram para técnicos de ISP que encuentra la caja de red más cercana, y una plataforma de campeonatos de fútbol.',
        'Trabaja con agentes de IA que programan, bajo límites, con revisión automática y verificación humana.',
        'Contacto: dennys@dennysh.com, LinkedIn y GitHub (dennysh).',
      ],
    },
    home: {
      tagline: ['7 años en fibra óptica', 'Remoto · UTC-5 · Español nativo · Inglés B1'],
      bar: { cv: 'CV', contact: 'Contacto' },
      portraitAlt: 'Retrato de Dennys Heras',
      hint: 'Desliza',
      nodesLabel: 'Explorar',
      nodes: [
        { id: 'code', label: 'Código' }, { id: 'projects', label: 'Proyectos' }, { id: 'demo', label: 'Demo' },
        { id: 'journey', label: 'Trayectoria' }, { id: 'how', label: 'Cómo trabajo' }, { id: 'interest', label: 'Interés' },
      ],
      panels: {
        code: { title: 'Código', note: 'Datos reales de la demo: el conjunto de reglas público y el ejemplo de auditoría estático.', github: 'Ver en GitHub ↗', projects: 'Ver proyectos →' },
        projects: { title: 'Trabajo en producción', text: 'Bot de Telegram para técnicos de un ISP. Sitio de campeonatos infantiles para un cliente.', opens: 'abre una página nueva', go: 'Abrir Proyectos →' },
        demo: { title: 'Demo en vivo', text: 'Una decisión automatizada, con la regla usada, la explicación y su auditoría.', opens: 'abre una página nueva', go: 'Abrir la demo →' },
        journey: { title: 'De la fibra a la IA', text: 'Siete años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.', opens: 'abre una página nueva', go: 'Abrir Trayectoria →' },
        how: { title: 'Cómo trabajo', tabs: { people: 'Personas', machines: 'Máquinas' }, read: 'Leer las reglas →' },
        interest: {
          title: 'Interés', sportsLabel: 'Deportes',
          sports: ['jiu-jitsu'],
          sportsMore: 'También he hecho triatlón y pistas de obstáculos (ciclismo, natación y pista), pocas veces, no de forma constante.',
          thought: '¿Y si dentro de unos años pudiéramos conectar el cerebro a la IA y potenciar lo humano? No sé si será posible. Creo que sí. (Una idea, no una capacidad.)',
          contact: 'Contacto →',
        },
      },
    },
    projectsPage: {
      back: 'Volver a la primera pantalla',
      title: 'Proyectos', lead: 'Lo confirmado hasta ahora, cada ítem marcado en producción o en desarrollo.', ids: ['caja-cercana', 'super-gol-kids'],
      description: 'Proyectos confirmados de Dennys Heras: un bot de Telegram para técnicos de un ISP y un sitio de campeonatos de fútbol para un cliente, cada uno marcado en producción o en desarrollo.',
    },
    journeyPage: {
      back: 'Volver a la primera pantalla',
      title: 'Trayectoria', lead: 'Del trabajo de campo con fibra óptica a construir sistemas con IA.',
      description: 'Del trabajo de campo con fibra óptica a construir sistemas con IA: la trayectoria de Dennys Heras.',
      photosPending: pending('P-29', 'Fotos de la galería de Trayectoria: Dennys las entrega en unos días (la galería queda oculta hasta entonces)'),
      gallery: { hint: 'Mueve el puntero a lo largo de una fila para ver sus fotos. En pantallas táctiles, toca una fila.', photoOf: 'Foto {k} de {n}', prev: 'Foto anterior', next: 'Foto siguiente', close: 'Cerrar', list: 'Lugares y proyectos' },
      rows: [
        { id: 'fibra', title: 'Redes de fibra óptica', meta: ['7 años'], text: '7 años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.', photos: photos(6) },
        { id: 'bot', title: 'Bot Caja Cercana', meta: ['2025', 'En producción'], text: 'Bot de Telegram para técnicos de un ISP que encuentra la caja de red más cercana a su ubicación. Hoy se usa internamente en la empresa.', photos: photos(4) },
        { id: 'supergol', title: 'Super Gol Kids', meta: ['En producción'], text: 'Plataforma de campeonatos de fútbol infantil. Sitio público de un cliente; yo desarrollé el sitio.', photos: photos(3) },
        { id: 'ia', title: 'Sistemas con IA', meta: ['Ahora'], text: 'Construyo sistemas con IA que se explican y se auditan.', photos: photos(5) },
      ],
    },
    demo: {
      description: 'Demo en vivo de una decisión automatizada: la regla usada, la explicación en lenguaje claro y su auditoría. Una simulación con datos sintéticos.',
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
      evidence: pending('P-04', 'Evidencia pública de la fábrica: repositorio, capturas o registros de tareas que Dennys confirme', 'La evidencia pública (repositorio, capturas) está en preparación.'),
    },
    governance: {
      title: 'Cómo trabajo con IA',
      lead: 'Lo importante no es usar IA, sino gobernarla. Estas son las reglas con las que trabajo, cortas y comprobables.',
      method: 'Este sitio se diseñó primero como especificación. El diseño, el plan y el registro de decisiones están escritos antes del código.',
    },
    work: {
      title: 'Trabajo demostrado',
      lead: 'Cada ítem está marcado en producción o en desarrollo, nada más.',
      status: { production: 'En producción', development: 'En desarrollo' },
      repo: 'Repositorio',
      visit: 'Visitar el sitio',
      items: [
        {
          id: 'caja-cercana', status: 'production', title: 'Bot de Telegram · Caja Cercana',
          text: 'Desarrollo y puesta en producción (2025) de un bot de Telegram para técnicos de un ISP que encuentra la caja de red más cercana a su ubicación. Hoy se usa internamente en la empresa. Python, SQLite, pytest.',
          repo: pending('P-06', 'URL correcta del repositorio del bot'),
        },
        { id: 'super-gol-kids', status: 'production', title: 'Super Gol Kids', text: 'Plataforma de campeonatos de fútbol infantil. Sitio público de un cliente; yo desarrollé el sitio.', url: 'https://www.supergolkids.com/' },
        { id: 'naunturia', status: 'development', title: 'Naunturia', text: 'Proyecto en desarrollo.' },
        { id: 'registro-cajas', status: 'development', title: 'Bot de Telegram · Registro de cajas', text: 'Registra cajas de red desde el campo, con ubicación y evidencia, para construir un inventario técnico más confiable.', repo: 'https://github.com/dennysh/bot_registro_cajas' },
        { id: 'reportes-telecom', status: 'development', title: 'Bot de Telegram · Reportes Telecom', text: 'Reportes técnicos de telecomunicaciones desde Telegram: incidencias, inspecciones y seguimiento.', repo: 'https://github.com/dennysh/Bot_Reportes_Telecom' },
        { id: 'contable', status: 'development', title: 'Sistema contable · React + Flask', text: 'Sistema contable web con panel financiero, clientes, proveedores, inventario, facturas, nómina y asientos contables. MySQL.', repo: 'https://github.com/dennysh/Sistema-Contable' },
        { id: 'futbol', status: 'development', title: 'Fútbol Manager', text: 'Aplicación web para gestionar partidos, equipos y jugadores, con filtros, perfiles y estadísticas.', repo: 'https://github.com/dennysh/futbolManager' },
        { id: 'hardlock', status: 'development', title: 'HARDLOCK · Android/Kotlin', text: 'Proyecto Android en Kotlin; su alcance está pendiente de documentar.', repo: 'https://github.com/dennysh/HARDLOCK' },
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
        '7 años en el campo trabajando con fibra óptica.',
        'Ahí me topé con problemas que el software podía resolver.',
        'Aprendí Python para resolverlos yo mismo.',
        'Hoy construyo sistemas con IA que se explican y se auditan.',
      ],
    },
    criden: { title: 'Criden', text: 'Para negocios y páginas web: Criden. Es un producto aparte de este sitio.', link: pending('P-22', 'Dirección de Criden', 'Enlace próximamente.') },
    contact: {
      title: 'Contacto',
      email: 'Correo', linkedin: 'LinkedIn', github: 'GitHub', cv: 'Descargar CV (PDF)',
      location: 'Remoto, desde cualquier parte del mundo.',
      availability: pending('P-09', 'Disponibilidad'),
      role: 'Busco trabajar con inteligencia artificial: diseñar y construir sistemas con control humano.',
      interest: 'Interés a largo plazo: cómo se relaciona la IA con el cerebro humano. Es un interés, no una capacidad demostrada.',
      languages: 'Español: nativo. Inglés: B1.', timezone: 'UTC-5',
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
