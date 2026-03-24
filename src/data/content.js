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
    title: 'Automatizo procesos de negocio con software real.',
    subtitle: 'Desarrollador Python con experiencia en operaciones de campo. Construyo bots y herramientas que eliminan trabajo manual — para restaurantes, comercios y empresas de servicios.',
    cta_primary: 'Ver proyecto destacado',
    cta_secondary: 'Descargar CV',
    cta_primary_href: '#proyecto',
    cta_secondary_href: '/cv-dennys-heras.pdf'
  },

  about: {
    title: 'Sobre mí',
    intro: 'Trabajo en telecomunicaciones desde el campo: instalación, diagnóstico y gestión de redes de fibra óptica.',
    body1: 'Paralelamente desarrollo software orientado a operaciones reales — herramientas que ya están siendo usadas por técnicos ISP.',
    body2: 'Mi enfoque: detectar el problema de operación, diseñar la solución mínima viable, implementarla y dejarla funcionando.',
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
    groups: [
      {
        name: 'Backend / Scripting',
        items: ['Python', 'SQLite', 'pytest', 'Makefile']
      },
      {
        name: 'APIs & Bots',
        items: ['python-telegram-bot', 'python-dotenv', 'REST APIs']
      },
      {
        name: 'Infraestructura',
        items: ['Git', 'Linux', 'Fibra óptica (FTTH/GPON)']
      },
      {
        name: 'En aprendizaje',
        items: ['MySQL', 'React', 'FastAPI']
      }
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
  }
}
