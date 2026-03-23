/* Projects Data - Scalable Array Structure */

export const projects = [
  {
    id: 'bot-caja-cercana',
    title: 'Bot Telegram · Caja Cercana',
    status: 'production',
    description: 'Herramienta de campo para técnicos ISP: recibe la ubicación del técnico vía Telegram, calcula las N cajas de fibra óptica más cercanas usando distancia Haversine, y retorna rutas directas a Google Maps.',
    stack: [
      'Python',
      'python-telegram-bot',
      'SQLite',
      'Haversine',
      'pytest',
      'Makefile'
    ],
    repoUrl: 'https://github.com/dennysh/Bot_Telegram_Caja_Cercana',
    metrics: [
      {
        label: '1,719 cajas reales de Ecuador',
        description: 'Indexadas en SQLite'
      },
      {
        label: 'Acceso restringido',
        description: 'Seguridad por GROUP_ID'
      },
      {
        label: 'Deploy local',
        description: 'Makefile + .bat (Windows/Linux)'
      },
      {
        label: 'Tests automáticos',
        description: 'Suite completa con pytest'
      }
    ],
    flow: [
      'Ubicación del técnico',
      'Cálculo Haversine',
      'Top cajas cercanas',
      'Rutas en Google Maps'
    ]
  }
]

export const upcomingProjects = [
  {
    id: 'bot-inventario',
    title: 'Bot Telegram · Control de Inventario',
    status: 'development',
    placeholder: false,
    description: 'Gestión de stock en almacén y vehículos de campo con trazabilidad en tiempo real vía Telegram. Registra entradas, salidas y ubicación de equipos sin necesidad de Excel.',
    stack: ['Python', 'python-telegram-bot', 'Google Sheets API', 'gspread'],
    problem: 'Equipos ISP dispersos en vehículos y almacenes sin trazabilidad en tiempo real.'
  },
  {
    id: 'plataforma-futbol',
    title: 'Plataforma Web · Gestión de Fútbol',
    status: 'development',
    placeholder: false,
    description: 'Aplicación web para gestión de torneos, equipos, resultados y estadísticas de fútbol amateur. Proyecto de práctica full-stack orientado a datos reales.',
    stack: ['Python', 'MySQL', 'HTML', 'CSS', 'JavaScript'],
    problem: 'Torneos locales gestionados manualmente sin registro digital de resultados ni estadísticas.'
  },
  {
    id: 'proyecto-proximo-3',
    title: 'Próximo proyecto',
    status: 'coming-soon',
    placeholder: true
  }
]
