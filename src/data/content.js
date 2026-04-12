/* Content & Text Configuration */

export const content = {
  header: {
    logo: 'DH',
    nav: [
      { label: 'Inicio', href: '#inicio' },
      { label: 'Sobre mí', href: '#sobre-mi' },
      { label: 'Proyecto', href: '#proyecto' },
      { label: 'Stack', href: '#stack' },
      { label: 'Contacto', href: '#contacto' }
    ]
  },

  hero: {
    title: 'Empecé en el campo. Ahora construyo el software que me hubiera gustado tener.',
    subtitle: 'Técnico con 7 años en fibra óptica que aprendió a programar para resolver sus propios problemas. Hoy hago lo mismo para otros negocios.',
    cta_primary: 'Ver proyecto destacado',
    cta_secondary: 'Descargar CV',
    cta_primary_href: '#proyecto',
    cta_secondary_href: '/cv-dennys-heras.pdf'
  },

  about: {
    title: 'Sobre mí',
    intro: 'Llevo 7 años en el campo instalando y diagnosticando redes de fibra óptica. En ese tiempo vi de cerca todos los problemas que nadie había resuelto con software.',
    body1: 'Aprendí Python para resolverlos yo mismo. El primer bot que hice indexó 1,719 cajas de fibra y hoy lo usan técnicos reales en Ecuador.',
    body2: 'Eso es lo que hago ahora para otros negocios: entender el problema desde adentro y construir la herramienta que realmente lo resuelve.',
    stats: [
      { number: '1,719', label: 'cajas ISP indexadas' },
      { number: '1', label: 'bot en producción' },
      { number: '100%', label: 'Python' }
    ]
  },

  featuredProject: {
    title: 'Bot Telegram · Caja Cercana',
    badge: 'En producción',
    description: 'Herramienta de campo para técnicos ISP: recibe la ubicación del técnico vía Telegram, calcula las N cajas de fibra óptica más cercanas usando distancia Haversine, y retorna rutas directas a Google Maps.',
    flow: [
      'Ubicación del técnico',
      'Cálculo Haversine',
      'Top cajas cercanas',
      'Rutas en Google Maps'
    ],
    results: [
      '1,719 cajas reales de Ecuador cargadas en SQLite',
      'Acceso restringido por GROUP_ID para seguridad operativa',
      'Deploy local con Makefile + .bat (Windows y Linux)',
      'Suite de tests con pytest'
    ],
    cta_label: 'Ver repositorio en GitHub',
    cta_href: 'https://github.com/dennysh/Bot_Telegram_Caja_Cercana'
  },

  howICanHelp: {
    title: '¿Cómo puedo aportar?',
    items: [
      {
        title: 'Bots para atención y pedidos',
        description: '¿Tu negocio recibe pedidos o consultas por WhatsApp o Telegram? Construyo el bot que los gestiona automáticamente, sin que nadie tenga que responder manualmente.'
      },
      {
        title: 'Automatización de procesos repetitivos',
        description: 'Si tu equipo hace lo mismo todos los días — reportes, registros, actualizaciones — eso se puede automatizar y liberar ese tiempo para lo que realmente importa.'
      },
      {
        title: 'Integración de datos en tiempo real',
        description: 'Conecta tu información dispersa en Excel o sistemas separados en una sola herramienta consultable desde el celular, sin depender de nadie para obtener un dato.'
      }
    ]
  },

  stack: {
    title: 'Stack & Tecnologías',
    items: [
      { name: 'Python',            color: '#3776ab', image: '/images/tech/python.svg' },
      { name: 'Go',                color: '#00add8', image: '/images/tech/go.svg' },
      { name: 'JavaScript',        color: '#f7df1e', image: '/images/tech/javascript.svg' },
      { name: 'React',             color: '#61dafb', image: '/images/tech/react.svg' },
      { name: 'Node.js',           color: '#339933', image: '/images/tech/nodejs.svg' },
      { name: 'Three.js',          color: '#cccccc', image: '/images/tech/threejs.svg' },
      { name: 'MongoDB',           color: '#47a248', image: '/images/tech/mongodb.svg' },
      { name: 'PostgreSQL',        color: '#4169e1', image: '/images/tech/postgresql.svg' },
      { name: 'SQLite',            color: '#0f7bb5', image: '/images/tech/sqlite.svg' },
      { name: 'Docker',            color: '#2496ed', image: '/images/tech/docker.svg' },
      { name: 'Telegram Bots',     color: '#229ed9', image: '/images/tech/telegram.svg' },
      { name: 'LLM APIs',          color: '#a855f7', image: '/images/tech/llm.svg' },
      { name: 'Prompt Engineering',color: '#8b5cf6', image: '/images/tech/prompt-engineering.svg' },
      { name: 'OpenAI API',        color: '#00a67e', image: '/images/tech/openai.svg' },
      { name: 'Gemini',            color: '#4285f4', image: '/images/tech/gemini.svg' },
      { name: 'Claude',            color: '#d97706', image: '/images/tech/claude.svg' },
      { name: 'Whisper',           color: '#10b981', image: '/images/tech/whisper.svg' },
      { name: 'Git',               color: '#f05032', image: '/images/tech/git.svg' },
      { name: 'GitHub',            color: '#e6edf3', image: '/images/tech/github.svg' },
      { name: 'Vercel',            color: '#e6edf3', image: '/images/tech/vercel.svg' },
      { name: 'Cloudflare',        color: '#f48120', image: '/images/tech/cloudflare.svg' },
      { name: 'Azure',             color: '#0089d6', image: '/images/tech/azure.svg' },
      { name: 'REST APIs',         color: '#6366f1', image: '/images/tech/rest-apis.svg' },
      { name: 'Webhooks',          color: '#f59e0b', image: '/images/tech/webhooks.svg' },
      { name: 'HTML',              color: '#e34f26', image: '/images/tech/html.svg' },
      { name: 'CSS',               color: '#1572b6', image: '/images/tech/css.svg' },
      { name: 'Vite',              color: '#646cff', image: '/images/tech/vite.svg' },
      { name: 'Power BI',          color: '#f2c811', image: '/images/tech/power-bi.svg' },
      { name: 'ETL',               color: '#0ea5e9', image: '/images/tech/etl.svg' },
      { name: 'Linux',             color: '#fcc624', image: '/images/tech/linux.svg' },
      { name: 'Windows',           color: '#00adef', image: '/images/tech/windows.svg' },
      { name: 'SSH',               color: '#4ade80', image: '/images/tech/ssh.svg' },
      { name: 'OpenVPN',           color: '#ff6600', image: '/images/tech/openvpn.svg' },
      { name: 'Nmap',              color: '#4b9cd3', image: '/images/tech/nmap.svg' },
      { name: 'Wireshark',         color: '#1679a7', image: '/images/tech/wireshark.svg' },
      { name: 'VirtualBox',        color: '#183a61', image: '/images/tech/virtualbox.svg' },
      { name: 'VMware',            color: '#607078', image: '/images/tech/vmware.svg' },
      { name: 'Automation',        color: '#22c55e', image: '/images/tech/automation.svg' },
      { name: 'AI Agents',         color: '#c026d3', image: '/images/tech/ai-agents.svg' },
      { name: 'Data Pipelines',    color: '#0891b2', image: '/images/tech/data-pipelines.svg' },
      { name: 'Microservices',     color: '#7c3aed', image: '/images/tech/microservices.svg' },
      { name: 'Backend Systems',   color: '#1d4ed8', image: '/images/tech/backend.svg' },
      { name: 'API Design',        color: '#9333ea', image: '/images/tech/api-design.svg' },
      { name: 'Database Design',   color: '#b45309', image: '/images/tech/database-design.svg' },
    ]
  },

  collaborate: {
    title: 'Colabora conmigo',
    items: [
      {
        title: 'Quiero automatizar un proceso en mi negocio',
        href: 'mailto:dennys14_hq@hotmail.com?subject=Automatización de proceso'
      },
      {
        title: 'Quiero un bot para atención o pedidos',
        href: 'mailto:dennys14_hq@hotmail.com?subject=Bot para atención o pedidos'
      },
      {
        title: 'Quiero conectar mis datos y hacerlos consultables',
        href: 'mailto:dennys14_hq@hotmail.com?subject=Integración de datos'
      }
    ]
  },

  contact: {
    title: 'Contacto',
    email: 'dennys14_hq@hotmail.com',
    linkedin: 'https://www.linkedin.com/in/dennys-heras-27b0b520b/',
    github: 'https://github.com/dennysh',
    description: 'Conversemos sobre cómo automatizar lo que hace lento tu operación.'
  },

  footer: {
    copyright: 'Dennys Heras © 2026',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/dennys-heras-27b0b520b/' },
      { label: 'GitHub', href: 'https://github.com/dennysh' },
      { label: 'Email', href: 'mailto:dennys14_hq@hotmail.com' }
    ]
  },

  aiNews: [
    {
      id: 1,
      featured: true,
      category: 'Automatización',
      title: 'El futuro de la automatización empresarial con IA Generativa',
      description: 'Cómo los LLMs están redefiniendo los flujos de trabajo empresariales y qué significa para los equipos de operaciones en 2026.',
      date: '28 Mar 2026',
      readTime: '5 min',
      href: '#'
    },
    {
      id: 2,
      featured: false,
      category: 'IA',
      title: 'Claude 3.7 y sus capacidades de razonamiento extendido',
      description: 'Análisis profundo de las nuevas capacidades de razonamiento multi-paso que cambian el paradigma de los agentes IA.',
      date: '27 Mar 2026',
      readTime: '3 min',
      href: '#'
    },
    {
      id: 3,
      featured: false,
      category: 'Herramientas',
      title: 'n8n vs Make: ¿Cuál elegir para automatización en 2026?',
      description: 'Comparativa actualizada de las dos plataformas líderes en automatización no-code para equipos pequeños.',
      date: '26 Mar 2026',
      readTime: '4 min',
      href: '#'
    },
    {
      id: 4,
      featured: false,
      category: 'Automatización',
      title: 'WhatsApp Business API: nuevas integraciones con IA',
      description: 'Las últimas actualizaciones de la API permiten flujos conversacionales más inteligentes con integración de modelos LLM.',
      date: '25 Mar 2026',
      readTime: '3 min',
      href: '#'
    },
    {
      id: 5,
      featured: false,
      category: 'Herramientas',
      title: 'Python + OpenAI: automatiza tu flujo de emails por completo',
      description: 'Tutorial paso a paso para construir un sistema de respuesta automática con clasificación inteligente de correos.',
      date: '24 Mar 2026',
      readTime: '6 min',
      href: '#'
    }
  ]
}
