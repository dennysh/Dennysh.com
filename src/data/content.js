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
    title: 'Automatizo operaciones técnicas con software real.',
    subtitle: 'Técnico ISP con dominio en fibra óptica + Python. Construyo herramientas que resuelven problemas de campo, no solo demos.',
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
        title: 'Automatización de procesos de campo',
        description: 'Si tu operación ISP depende de Excel o WhatsApp para localizar infraestructura, puedo construir la herramienta que lo elimina.'
      },
      {
        title: 'Bots operativos para equipos técnicos',
        description: 'Interfaces simples sobre Telegram o similar para que tus técnicos accedan a datos de red sin interfaz web compleja.'
      },
      {
        title: 'Integración de datos de campo con software',
        description: 'Tus bases de datos de infraestructura conectadas a herramientas que las hagan consultables en tiempo real.'
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
        title: 'Quiero automatizar un proceso',
        href: 'mailto:dennys14_hq@hotmail.com?subject=Automatización de proceso'
      },
      {
        title: 'Quiero un bot para mi operación',
        href: 'mailto:dennys14_hq@hotmail.com?subject=Bot para operación'
      },
      {
        title: 'Quiero mejorar mi flujo técnico con software',
        href: 'mailto:dennys14_hq@hotmail.com?subject=Mejora de flujo técnico'
      }
    ]
  },

  contact: {
    title: 'Contacto',
    email: 'dennys14_hq@hotmail.com',
    linkedin: 'https://www.linkedin.com/in/dennys-heras-27b0b520b/',
    github: 'https://github.com/dennysh',
    description: 'Conversemos sobre automatización, bots y herramientas para operaciones ISP reales.'
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
