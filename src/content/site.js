// Contenido bilingüe del sitio (spec §3, §4, §9). Solo datos reales de src/data/ o del prompt de Dennys.
// Todo lo no confirmado es un marcador pending(id, pista): el build de producción los lista y falla si no están autorizados.
// `label` (opcional) es el texto público cuando el marcador está autorizado a publicarse; por defecto, "por confirmar".
import { journeyPhotos } from './journey-photos.js'

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

// Fotos de la línea de tiempo de Trayectoria (P-29): Dennys las entrega después. Se declaran en src/content/journey-photos.json, por id de entrada:
// { "fibratelecom": [{ "src": "/images/trayectoria/fibratelecom-1.webp", "thumb": "/images/trayectoria/fibratelecom-1-thumb.webp", "width": 1600, "height": 1067, "alt": { "es": "…", "en": "…" } }] }
// (`thumb` es opcional; guía corta en 02-DOCS/guia-fotos-trayectoria.md). Sin fotos declaradas la página se ve completa, sin huecos.
// Solo la compilación de pruebas e2e (modo de Vite `e2e`) pone fotos de relleno para ejercitar el componente; nunca la de producción.
const E2E_PHOTOS = import.meta.env?.MODE === 'e2e'
const E2E_SAMPLE = { fibratelecom: 2, msnet: 1 }
const declared = E2E_PHOTOS
  ? Object.fromEntries(Object.entries(E2E_SAMPLE).map(([id, n]) => [id, Array.from({ length: n }, (_, i) => ({ src: '/images/dennys-portrait-360.webp', width: 360, height: 484, alt: { es: `Foto de prueba ${i + 1}`, en: `Test photo ${i + 1}` } }))]))
  : journeyPhotos
const photosFor = (lang, id) => (declared[id] ?? []).map((p) => ({ src: p.src, thumb: p.thumb, width: p.width, height: p.height, alt: p.alt?.[lang] ?? '' }))

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
      description: 'Dennys Heras builds AI systems that explain their decisions in plain language, leave an audit trail and hand control to a person. Comes from 7 years in fiber-optic networks.',
    },
    nav: { code: 'Code', projects: 'Projects', journey: 'Journey', how: 'How I work', interest: 'Interest', contact: 'Contact', menu: 'Sections', skip: 'Skip to content', lang: 'Español', theme: 'Dark mode', home: 'Home' },
    hero: {
      thesis: 'I build AI systems that explain themselves and can be audited.',
      who: ['I come from 7 years in fiber-optic networks, where things have to work in the field.'],
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
      phrase: 'A little of what I do, in a few minutes.',
      tagline: ['7 years in fiber optics', 'Remote · Spanish native · English B1'],
      bar: { cv: 'CV' },
      portraitAlt: 'Portrait of Dennys Heras',
      hint: 'Swipe',
      nodesLabel: 'Explore',
      nodes: [
        { id: 'code', label: 'Code' }, { id: 'projects', label: 'Projects' },
        { id: 'journey', label: 'Journey' }, { id: 'how', label: 'How I work' }, { id: 'interest', label: 'Interest' },
      ],
      panels: {
        code: { title: 'Code', note: 'Real data: the public ruleset and the static audit example.', github: 'View on GitHub ↗', opens: 'opens a new page', go: 'Open Code →' },
        projects: { title: 'Work in production', text: 'Telegram bot for ISP technicians. A children\'s football championships site for a client. Criden, for businesses and websites.', opens: 'opens a new page', go: 'Open Projects →' },
        journey: { title: 'From fiber to AI', text: 'Seven years in fiber-optic networks, where things have to work in the field.', opens: 'opens a new page', go: 'Open Journey →' },
        how: { title: 'How I work', tabs: { people: 'People', machines: 'Machines' }, opens: 'opens a new page', go: 'Open How I work →' },
        interest: {
          title: 'Interest',
          thought: 'What if, in a few years, we could connect the brain to AI and strengthen what is human? I do not know if it will be possible. I think so. (An idea, not a capability.)',
          opens: 'opens a new page', go: 'Open Interest →',
        },
      },
    },
    codePage: { back: 'Back to the home screen', title: 'Code', lead: 'Real data and what I can do, grouped by capability.', description: 'Code by Dennys Heras: the public ruleset and static audit example, and his capabilities, each marked as shown or declared.' },
    howPage: { back: 'Back to the home screen', title: 'How I work', lead: 'The rules I work with, for people and for machines, and the way I build with agents.', description: 'How Dennys Heras works with AI: short, checkable working rules for people and machines, and a software factory with agents under human control.', people: 'People', machines: 'Machines', machinesLead: 'The same rules as plain text, as published in llms.txt:' },
    interestPage: { back: 'Back to the home screen', title: 'Interest', lead: 'Where I would like to go in the long run.', description: 'A long-term interest of Dennys Heras: how artificial intelligence could relate to the human brain. An idea, not a capability.' },
    contactPage: { back: 'Back to the home screen', title: 'Contact', description: 'Contact Dennys Heras: email, LinkedIn, GitHub and CV.' },
    projectsPage: {
      back: 'Back to the home screen',
      title: 'Work in production', lead: 'What is confirmed so far.', ids: ['telegram-bots', 'super-gol-kids', 'criden'],
      description: 'Work in production by Dennys Heras: Telegram bots, a football-championships site for a client and Criden, for businesses and websites.',
    },
    journeyPage: {
      back: 'Back to the home screen',
      title: 'Journey', lead: 'From fiber-optic fieldwork to building AI systems.',
      description: 'From fiber-optic fieldwork to building AI systems: the journey of Dennys Heras.',
      photosPending: pending('P-29', 'Photos for the Journey timeline: Dennys delivers them later (the timeline shows without photos until then; they are declared in src/content/journey-photos.js)'),
      ui: { list: 'Experience, projects and education, most recent first', present: 'Present', kinds: { project: 'Project', study: 'Education' }, enlarge: 'Enlarge photo', photoOf: 'Photo {k} of {n}', prev: 'Previous photo', next: 'Next photo', close: 'Close', dialog: 'Photos: {title}' },
      timeline: [
        { id: 'bot-caja-cercana', kind: 'project', when: '2025', from: '2025-01', title: 'Caja Cercana bot', status: 'In production', bullets: ['Telegram bot for ISP technicians that finds the nearest network box to their location.', 'Used internally at the company.'], tags: ['Python', 'Telegram Bot API'], photos: photosFor('en', 'bot-caja-cercana') },
        { id: 'super-gol-kids', kind: 'project', when: 'In production', title: 'Super Gol Kids', bullets: ['Platform for children\'s football championships.', 'Public website for a client; I developed the site.'], tags: ['Website', 'Client'], photos: photosFor('en', 'super-gol-kids') },
        { id: 'ismac', kind: 'study', when: 'Sep 2023 – Present', from: '2023-09', current: true, title: 'Software Development', org: 'ISMAC Institute of Technology', bullets: ['Software development studies, in progress.'], tags: [], photos: photosFor('en', 'ismac') },
        { id: 'fibratelecom', kind: 'job', when: 'Mar 2023 – Present', from: '2023-03', current: true, title: 'Field Technician / Asset Management', org: 'Fibratelecom', bullets: ['Weekly inventory of technology equipment, with traceability and asset control.', 'Document management of customer contracts after installation.', 'Deployment and maintenance of GPON network (NAP, splice closures).', 'Automations that cut repetitive tasks.'], tags: ['GPON', 'Inventory', 'Contracts', 'Automation'], photos: photosFor('en', 'fibratelecom') },
        { id: 'msnet', kind: 'job', when: 'Jun 2021 – Oct 2022', from: '2021-06', to: '2022-10', title: 'ISP Manager', org: 'MS@Net', bullets: ['Full ISP operation: active equipment configuration, technical support and commercial management.', 'Quoted and compared equipment from several suppliers.', 'GPON networks for residential and corporate customers.'], tags: ['ISP', 'GPON', 'Quotes', 'Support'], photos: photosFor('en', 'msnet') },
        { id: 'afiatic', kind: 'job', when: 'Feb 2018 – May 2021', from: '2018-02', to: '2021-05', title: 'Network Technician (CNT contractor)', org: 'Afiatic', bullets: ['24/7 support for fiber-optic backbone networks.', 'Fault location, on-site repair and technical close-out under defined SLAs.', 'Coverage in Azuay, Cañar, Morona Santiago, Zamora Chinchipe and Pastaza.'], tags: ['Fiber optics', 'Backbone', 'SLA', '24/7'], photos: photosFor('en', 'afiatic') },
        { id: 'telydata', kind: 'job', when: 'Mar 2017 – Feb 2018', from: '2017-03', to: '2018-02', title: 'Technical Assistant', org: 'Telydata', bullets: ['Installation and preventive and corrective maintenance of fiber-optic networks.', 'Field support.'], tags: ['Fiber optics', 'Maintenance', 'Field support'], photos: photosFor('en', 'telydata') },
      ],
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
      seeBots: 'See the {n} bots',
      items: [
        {
          id: 'telegram-bots', title: 'Telegram bots',
          bots: [
            { id: 'registro-cajas', title: 'Box registry bot', text: 'Registers network boxes from the field, with location and evidence, to build a more reliable technical inventory.', repo: 'https://github.com/dennysh/bot_registro_cajas' },
            {
              id: 'caja-cercana', status: 'production', title: 'Nearest box bot',
              text: 'Development and launch (2025) of a Telegram bot for ISP technicians that finds the nearest network box to their location. Used internally at the company. Python, SQLite, pytest.',
              repo: pending('P-06', 'Correct repository URL of the bot'),
            },
            { id: 'reportes-telecom', title: 'Reports bot', text: 'Technical telecom reports from Telegram: incidents, inspections and follow-up.', repo: 'https://github.com/dennysh/Bot_Reportes_Telecom' },
            { id: 'planificacion', title: 'Planning bot' },
          ],
        },
        { id: 'super-gol-kids', status: 'production', title: 'Super Gol Kids', text: 'Platform for children\'s football championships. Public website for a client; I developed the site.', url: 'https://www.supergolkids.com/' },
        { id: 'criden', status: 'production', title: 'Criden', text: 'For businesses and websites: Criden. A separate product from this site.', link: pending('P-22', 'Criden address', 'Link coming soon.') },
        { id: 'naunturia', status: 'development', title: 'Naunturia', text: 'Project in development.' },
      ],
    },
    skills: {
      title: 'Skills',
      lead: 'Grouped by what I can do. "Shown" means there is proof above; "declared" means I use it but have no public proof yet.',
      shown: 'Shown', declared: 'Declared',
      groups: [
        { title: 'Bots and automation', shown: ['Python', 'Telegram bots', 'SQLite', 'pytest'], declared: ['Webhooks', 'REST APIs'] },
        { title: 'AI systems', shown: [], declared: ['LLM', 'LLM APIs', 'Claude', 'OpenAI', 'Gemini', 'Whisper', 'LLM chatbots', 'AI agents'], note: 'AI agents: conversational assistant with read-only access to customer data (prototype, never in production).' },
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
    contact: {
      title: 'Contact',
      email: 'Email', linkedin: 'LinkedIn', github: 'GitHub', cv: 'Download CV (PDF)', otherWays: 'Other ways to reach me',
      location: 'Remote, from anywhere in the world.',
      availabilityLabel: 'When I can start',
      availability: pending('P-09', 'Availability'),
      role: 'I look for work with artificial intelligence: designing and building systems under human control.',
      interest: 'Long-term interest: how AI relates to the human brain. An interest, not a demonstrated skill.',
      languages: 'Spanish: native. English: B1.', timezone: 'UTC-5',
    },
    contactForm: {
      "lead": "Tell me what you need in a few short steps. The questions change with what you choose.",
      "leadOff": "The most direct way to reach me is email.",
      "fallback": "Write to me by email:",
      "disabled": "The form is not available right now. Write to me by email:",
      "loading": "Checking whether the form is available…",
      "progress": "Step {k} of {n}",
      "next": "Next",
      "back": "Back",
      "send": "Send",
      "sending": "Sending…",
      "optional": "(optional)",
      "intent": {
        "q": "What do you want to do?",
        "options": {
          "web": "Build a website",
          "bots": "Automate with bots or AI",
          "talk": "Talk to me (job offer, collaboration or question)",
          "other": "Something else"
        }
      },
      "questions": {
        "siteType": {
          "q": "What kind of site do you need?",
          "label": "Site type",
          "options": {
            "info": "Informational",
            "shop": "Online shop",
            "portfolio": "Portfolio",
            "other": "Other"
          }
        },
        "budget": {
          "q": "What budget do you have in mind? (in USD)",
          "label": "Budget",
          "options": {
            "lt300": "Under 300",
            "300-1000": "300–1,000",
            "1000-3000": "1,000–3,000",
            "gt3000": "Over 3,000",
            "unknown": "I do not know yet"
          }
        },
        "deadline": {
          "q": "When do you need it?",
          "label": "Timeline",
          "options": {
            "urgent": "Urgent",
            "1m": "1 month",
            "2-3m": "2–3 months",
            "flexible": "Flexible"
          }
        },
        "assets": {
          "q": "Do you already have a domain and content?",
          "label": "Domain and content",
          "options": {
            "yes": "Yes",
            "no": "No",
            "partial": "Partly"
          }
        },
        "automate": {
          "q": "What do you want to automate?",
          "label": "What to automate",
          "hint": "One short sentence is enough."
        },
        "where": {
          "q": "Where would it be used?",
          "label": "Where it would be used",
          "options": {
            "telegram": "Telegram",
            "web": "Web",
            "other": "Other"
          }
        },
        "reason": {
          "q": "What is the reason?",
          "label": "Reason",
          "options": {
            "job": "Job offer",
            "collab": "Collaboration",
            "consult": "Question",
            "other": "Other"
          }
        },
        "company": {
          "q": "Which company or project are you writing from?",
          "label": "Company or project",
          "hint": "You can leave it blank."
        },
        "reply": {
          "q": "How would you like me to reply?",
          "label": "Preferred reply",
          "options": {
            "email": "By email",
            "video": "By video call"
          }
        },
        "message": {
          "q": "Tell me what you need",
          "label": "Message"
        }
      },
      "contact": {
        "q": "How can I reach you?",
        "name": "Name",
        "email": "Email",
        "message": "Message"
      },
      "review": {
        "q": "Review and send",
        "summary": "What you chose",
        "consent": "I agree that my information is used only to reply to me.",
        "privacy": "See the privacy policy",
        "human": "A Cloudflare Turnstile check confirms you are a person."
      },
      "errors": {
        "choose": "Choose an option.",
        "required": "Fill in this field.",
        "text": "Check this field: it is too long or has characters that are not allowed.",
        "email": "Enter a valid email address.",
        "consent": "Tick the box to send."
      },
      "status": {
        "sent": "Message sent. I will reply as soon as I can.",
        "rate": "Too many messages were sent. Try again later.",
        "bot": "I could not check that you are a person. Try again.",
        "input": "Check the data and try again.",
        "unavailable": "I could not send the message. Write to me by email:"
      }
    },
    footer: { privacy: 'Privacy', terms: 'Terms', copyright: 'Dennys Heras © 2026', contact: 'Contact', contactPage: 'Contact page' },
  },

  es: {
    lang: 'es',
    meta: {
      title: 'Dennys Heras — Sistemas con IA que se explican y se auditan',
      description: 'Dennys Heras construye sistemas con IA que explican sus decisiones en lenguaje claro, dejan rastro y ceden el control a una persona. Viene de 7 años en redes de fibra óptica.',
    },
    nav: { code: 'Código', projects: 'Proyectos', journey: 'Trayectoria', how: 'Cómo trabajo', interest: 'Interés', contact: 'Contacto', menu: 'Secciones', skip: 'Saltar al contenido', lang: 'English', theme: 'Modo oscuro', home: 'Inicio' },
    hero: {
      thesis: 'Construyo sistemas con IA que se explican y se auditan.',
      who: ['Vengo de 7 años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.'],
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
      phrase: 'Un poco sobre mí.',
      tagline: ['7 años en fibra óptica', 'Remoto · Español nativo · Inglés B1'],
      bar: { cv: 'CV' },
      portraitAlt: 'Retrato de Dennys Heras',
      hint: 'Desliza',
      nodesLabel: 'Explorar',
      nodes: [
        { id: 'code', label: 'Código' }, { id: 'projects', label: 'Proyectos' },
        { id: 'journey', label: 'Trayectoria' }, { id: 'how', label: 'Cómo trabajo' }, { id: 'interest', label: 'Interés' },
      ],
      panels: {
        code: { title: 'Código', note: 'Datos reales: el conjunto de reglas público y el ejemplo de auditoría estático.', github: 'Ver en GitHub ↗', opens: 'abre una página nueva', go: 'Abrir Código →' },
        projects: { title: 'Trabajo en producción', text: 'Bot de Telegram para técnicos de un ISP. Sitio de campeonatos infantiles para un cliente. Criden, para negocios y páginas web.', opens: 'abre una página nueva', go: 'Abrir Proyectos →' },
        journey: { title: 'De la fibra a la IA', text: 'Siete años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.', opens: 'abre una página nueva', go: 'Abrir Trayectoria →' },
        how: { title: 'Cómo trabajo', tabs: { people: 'Personas', machines: 'Máquinas' }, opens: 'abre una página nueva', go: 'Abrir Cómo trabajo →' },
        interest: {
          title: 'Interés',
          thought: '¿Y si dentro de unos años pudiéramos conectar el cerebro a la IA y potenciar lo humano? No sé si será posible. Creo que sí. (Una idea, no una capacidad.)',
          opens: 'abre una página nueva', go: 'Abrir Interés →',
        },
      },
    },
    codePage: { back: 'Volver a la primera pantalla', title: 'Código', lead: 'Datos reales y lo que sé hacer, agrupado por capacidad.', description: 'Código de Dennys Heras: el conjunto de reglas público y el ejemplo de auditoría estático, y sus capacidades, cada una marcada como demostrada o declarada.' },
    howPage: { back: 'Volver a la primera pantalla', title: 'Cómo trabajo', lead: 'Las reglas con las que trabajo, para personas y para máquinas, y la forma en que construyo con agentes.', description: 'Cómo trabaja Dennys Heras con IA: reglas de trabajo cortas y comprobables para personas y máquinas, y una fábrica de software con agentes bajo control humano.', people: 'Personas', machines: 'Máquinas', machinesLead: 'Las mismas reglas en texto plano, como se publican en llms.txt:' },
    interestPage: { back: 'Volver a la primera pantalla', title: 'Interés', lead: 'Hacia dónde me gustaría ir a largo plazo.', description: 'Un interés a largo plazo de Dennys Heras: cómo podría relacionarse la inteligencia artificial con el cerebro humano. Una idea, no una capacidad.' },
    contactPage: { back: 'Volver a la primera pantalla', title: 'Contacto', description: 'Contacta a Dennys Heras: correo, LinkedIn, GitHub y CV.' },
    projectsPage: {
      back: 'Volver a la primera pantalla',
      title: 'Trabajo en producción', lead: 'Lo confirmado hasta ahora.', ids: ['telegram-bots', 'super-gol-kids', 'criden'],
      description: 'Trabajo en producción de Dennys Heras: bots para Telegram, un sitio de campeonatos de fútbol para un cliente y Criden, para negocios y páginas web.',
    },
    journeyPage: {
      back: 'Volver a la primera pantalla',
      title: 'Trayectoria', lead: 'Del trabajo de campo con fibra óptica a construir sistemas con IA.',
      description: 'Del trabajo de campo con fibra óptica a construir sistemas con IA: la trayectoria de Dennys Heras.',
      photosPending: pending('P-29', 'Fotos de la línea de tiempo de Trayectoria: Dennys las entrega después (la línea se ve sin fotos hasta entonces; se declaran en src/content/journey-photos.js)'),
      ui: { list: 'Experiencia, proyectos y formación, de lo más reciente a lo más antiguo', present: 'Presente', kinds: { project: 'Proyecto', study: 'Formación' }, enlarge: 'Ampliar foto', photoOf: 'Foto {k} de {n}', prev: 'Foto anterior', next: 'Foto siguiente', close: 'Cerrar', dialog: 'Fotos: {title}' },
      timeline: [
        { id: 'bot-caja-cercana', kind: 'project', when: '2025', from: '2025-01', title: 'Bot Caja Cercana', status: 'En producción', bullets: ['Bot de Telegram para técnicos de un ISP que encuentra la caja de red más cercana a su ubicación.', 'Hoy se usa internamente en la empresa.'], tags: ['Python', 'Telegram Bot API'], photos: photosFor('es', 'bot-caja-cercana') },
        { id: 'super-gol-kids', kind: 'project', when: 'En producción', title: 'Super Gol Kids', bullets: ['Plataforma de campeonatos de fútbol infantil.', 'Sitio público de un cliente; yo desarrollé el sitio.'], tags: ['Sitio web', 'Cliente'], photos: photosFor('es', 'super-gol-kids') },
        { id: 'ismac', kind: 'study', when: 'Sep 2023 – Presente', from: '2023-09', current: true, title: 'Desarrollo de Software', org: 'Instituto Tecnológico ISMAC', bullets: ['Estudios de desarrollo de software, en curso.'], tags: [], photos: photosFor('es', 'ismac') },
        { id: 'fibratelecom', kind: 'job', when: 'Mar 2023 – Presente', from: '2023-03', current: true, title: 'Técnico de Campo / Gestión de Activos', org: 'Fibratelecom', bullets: ['Inventario semanal de equipos tecnológicos, con trazabilidad y control de activos.', 'Gestión documental de contratos con clientes después de la instalación.', 'Despliegue y mantenimiento de la red GPON (NAP, mangas).', 'Automatizaciones que reducen tareas repetitivas.'], tags: ['GPON', 'Inventario', 'Contratos', 'Automatización'], photos: photosFor('es', 'fibratelecom') },
        { id: 'msnet', kind: 'job', when: 'Jun 2021 – Oct 2022', from: '2021-06', to: '2022-10', title: 'ISP Manager', org: 'MS@Net', bullets: ['Operación integral del ISP: configuración de equipos activos, soporte técnico y gestión comercial.', 'Cotización y comparación de equipos con varios proveedores.', 'Redes GPON para clientes residenciales y corporativos.'], tags: ['ISP', 'GPON', 'Cotización', 'Soporte'], photos: photosFor('es', 'msnet') },
        { id: 'afiatic', kind: 'job', when: 'Feb 2018 – May 2021', from: '2018-02', to: '2021-05', title: 'Técnico de Redes (contratista CNT)', org: 'Afiatic', bullets: ['Soporte 24/7 de redes troncales de fibra óptica.', 'Localización de fallas, corrección en sitio y cierre técnico bajo SLA definidos.', 'Cobertura en Azuay, Cañar, Morona Santiago, Zamora Chinchipe y Pastaza.'], tags: ['Fibra óptica', 'Redes troncales', 'SLA', '24/7'], photos: photosFor('es', 'afiatic') },
        { id: 'telydata', kind: 'job', when: 'Mar 2017 – Feb 2018', from: '2017-03', to: '2018-02', title: 'Auxiliar Técnico', org: 'Telydata', bullets: ['Instalación y mantenimiento preventivo y correctivo de redes de fibra óptica.', 'Soporte en campo.'], tags: ['Fibra óptica', 'Mantenimiento', 'Soporte en campo'], photos: photosFor('es', 'telydata') },
      ],
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
      seeBots: 'Ver los {n} bots',
      items: [
        {
          id: 'telegram-bots', title: 'Bots para Telegram',
          bots: [
            { id: 'registro-cajas', title: 'Bot de registro de cajas', text: 'Registra cajas de red desde el campo, con ubicación y evidencia, para construir un inventario técnico más confiable.', repo: 'https://github.com/dennysh/bot_registro_cajas' },
            {
              id: 'caja-cercana', status: 'production', title: 'Bot de caja más cercana',
              text: 'Desarrollo y puesta en producción (2025) de un bot de Telegram para técnicos de un ISP que encuentra la caja de red más cercana a su ubicación. Hoy se usa internamente en la empresa. Python, SQLite, pytest.',
              repo: pending('P-06', 'URL correcta del repositorio del bot'),
            },
            { id: 'reportes-telecom', title: 'Bot de reportes', text: 'Reportes técnicos de telecomunicaciones desde Telegram: incidencias, inspecciones y seguimiento.', repo: 'https://github.com/dennysh/Bot_Reportes_Telecom' },
            { id: 'planificacion', title: 'Bot de planificación' },
          ],
        },
        { id: 'super-gol-kids', status: 'production', title: 'Super Gol Kids', text: 'Plataforma de campeonatos de fútbol infantil. Sitio público de un cliente; yo desarrollé el sitio.', url: 'https://www.supergolkids.com/' },
        { id: 'criden', status: 'production', title: 'Criden', text: 'Para negocios y páginas web: Criden. Es un producto aparte de este sitio.', link: pending('P-22', 'Dirección de Criden', 'Enlace próximamente.') },
        { id: 'naunturia', status: 'development', title: 'Naunturia', text: 'Proyecto en desarrollo.' },
      ],
    },
    skills: {
      title: 'Capacidades',
      lead: 'Agrupadas por lo que sé hacer. "Demostrado" significa que hay prueba arriba; "declarado" significa que lo uso pero aún no hay prueba pública.',
      shown: 'Demostrado', declared: 'Declarado',
      groups: [
        { title: 'Bots y automatización', shown: ['Python', 'Bots de Telegram', 'SQLite', 'pytest'], declared: ['Webhooks', 'APIs REST'] },
        { title: 'Sistemas con IA', shown: [], declared: ['LLM', 'APIs de LLM', 'Claude', 'OpenAI', 'Gemini', 'Whisper', 'Chatbots con LLM', 'Agentes de IA'], note: 'Agentes de IA: asistente conversacional con acceso de solo lectura a datos de clientes (prototipo, sin producción).' },
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
    contact: {
      title: 'Contacto',
      email: 'Correo', linkedin: 'LinkedIn', github: 'GitHub', cv: 'Descargar CV (PDF)', otherWays: 'Otras formas de contactarme',
      location: 'Remoto, desde cualquier parte del mundo.',
      availabilityLabel: 'Cuándo puedo empezar',
      availability: pending('P-09', 'Disponibilidad'),
      role: 'Busco trabajar con inteligencia artificial: diseñar y construir sistemas con control humano.',
      interest: 'Interés a largo plazo: cómo se relaciona la IA con el cerebro humano. Es un interés, no una capacidad demostrada.',
      languages: 'Español: nativo. Inglés: B1.', timezone: 'UTC-5',
    },
    contactForm: {
      "lead": "Cuéntame qué necesitas en unos pasos cortos. Las preguntas cambian según lo que elijas.",
      "leadOff": "La forma más directa de contactarme es el correo.",
      "fallback": "Escríbeme por correo:",
      "disabled": "El formulario no está disponible por ahora. Escríbeme por correo:",
      "loading": "Comprobando si el formulario está disponible…",
      "progress": "Paso {k} de {n}",
      "next": "Siguiente",
      "back": "Atrás",
      "send": "Enviar",
      "sending": "Enviando…",
      "optional": "(opcional)",
      "intent": {
        "q": "¿Qué quieres hacer?",
        "options": {
          "web": "Hacer una página web",
          "bots": "Automatizar con bots o IA",
          "talk": "Hablar conmigo (oferta de trabajo, colaboración o consulta)",
          "other": "Otra cosa"
        }
      },
      "questions": {
        "siteType": {
          "q": "¿Qué tipo de sitio necesitas?",
          "label": "Tipo de sitio",
          "options": {
            "info": "Informativo",
            "shop": "Tienda",
            "portfolio": "Portafolio",
            "other": "Otro"
          }
        },
        "budget": {
          "q": "¿Qué presupuesto tienes pensado? (en USD)",
          "label": "Presupuesto",
          "options": {
            "lt300": "Menos de 300",
            "300-1000": "300–1 000",
            "1000-3000": "1 000–3 000",
            "gt3000": "Más de 3 000",
            "unknown": "Aún no lo sé"
          }
        },
        "deadline": {
          "q": "¿Para cuándo lo necesitas?",
          "label": "Plazo",
          "options": {
            "urgent": "Urgente",
            "1m": "1 mes",
            "2-3m": "2–3 meses",
            "flexible": "Flexible"
          }
        },
        "assets": {
          "q": "¿Ya tienes dominio y contenido?",
          "label": "Dominio y contenido",
          "options": {
            "yes": "Sí",
            "no": "No",
            "partial": "En parte"
          }
        },
        "automate": {
          "q": "¿Qué quieres automatizar?",
          "label": "Qué automatizar",
          "hint": "Una frase corta basta."
        },
        "where": {
          "q": "¿Dónde se usaría?",
          "label": "Dónde se usaría",
          "options": {
            "telegram": "Telegram",
            "web": "Web",
            "other": "Otro"
          }
        },
        "reason": {
          "q": "¿Cuál es el motivo?",
          "label": "Motivo",
          "options": {
            "job": "Oferta de trabajo",
            "collab": "Colaboración",
            "consult": "Consulta",
            "other": "Otro"
          }
        },
        "company": {
          "q": "¿De qué empresa o proyecto me escribes?",
          "label": "Empresa o proyecto",
          "hint": "Puedes dejarlo en blanco."
        },
        "reply": {
          "q": "¿Cómo prefieres que responda?",
          "label": "Respuesta preferida",
          "options": {
            "email": "Por correo",
            "video": "Por videollamada"
          }
        },
        "message": {
          "q": "Cuéntame qué necesitas",
          "label": "Mensaje"
        }
      },
      "contact": {
        "q": "¿Cómo te contacto?",
        "name": "Nombre",
        "email": "Correo",
        "message": "Mensaje"
      },
      "review": {
        "q": "Revisa y envía",
        "summary": "Lo que elegiste",
        "consent": "Acepto que se use mi información solo para responderme.",
        "privacy": "Ver la política de privacidad",
        "human": "Se comprueba que eres una persona con Cloudflare Turnstile."
      },
      "errors": {
        "choose": "Elige una opción.",
        "required": "Completa este campo.",
        "text": "Revisa este campo: es demasiado largo o tiene caracteres no permitidos.",
        "email": "Escribe un correo válido.",
        "consent": "Marca la casilla para poder enviar."
      },
      "status": {
        "sent": "Mensaje enviado. Te responderé lo antes posible.",
        "rate": "Se enviaron demasiados mensajes. Prueba más tarde.",
        "bot": "No pude comprobar que eres una persona. Inténtalo otra vez.",
        "input": "Revisa los datos e inténtalo otra vez.",
        "unavailable": "No pude enviar el mensaje. Escríbeme por correo:"
      }
    },
    footer: { privacy: 'Privacidad', terms: 'Términos', copyright: 'Dennys Heras © 2026', contact: 'Contacto', contactPage: 'Página de contacto' },
  },
}

// Recorre el contenido y devuelve todos los marcadores pending (con su ruta).
export function collectPending(node = site, path = '') {
  if (isPending(node)) return [{ ...node, path }]
  if (Array.isArray(node)) return node.flatMap((v, i) => collectPending(v, `${path}[${i}]`))
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => collectPending(v, path ? `${path}.${k}` : k))
  return []
}
