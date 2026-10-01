import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Portal de clientes',
    description: 'Rediseño del portal de autoservicio para clientes empresariales.',
    creatorId: 'u1',
    memberIds: ['u1', 'u2', 'u3'],
    ticketCount: 12,
  },
  {
    id: 'p2',
    name: 'App móvil de pedidos',
    description: 'Aplicación móvil para seguimiento de pedidos en tiempo real.',
    creatorId: 'u2',
    memberIds: ['u2', 'u4'],
    ticketCount: 7,
  },
  {
    id: 'p3',
    name: 'Migración a la nube',
    description: 'Migración de la infraestructura on-premise a Supabase/AWS.',
    creatorId: 'u1',
    memberIds: ['u1', 'u5', 'u6'],
    ticketCount: 21,
  },
  {
    id: 'p4',
    name: 'Panel de analítica',
    description: 'Dashboard interno de métricas de producto para el equipo de datos.',
    creatorId: 'u5',
    memberIds: ['u5', 'u3'],
    ticketCount: 4,
  },
  {
    id: 'p5',
    name: 'Sistema de facturación',
    description: 'Automatización del ciclo de facturación y cobranza.',
    creatorId: 'u6',
    memberIds: ['u6', 'u7', 'u2'],
    ticketCount: 9,
  },
]
