import type { Ticket } from './types'

export const tickets: Ticket[] = [
  { id: 't1', key: 'PC-1', projectId: 'p1', title: 'Rediseñar pantalla de inicio de sesión', status: 'done', priority: 'medium', assigneeIds: ['u2'], creatorId: 'u1', tags: ['ui'] },
  { id: 't2', key: 'PC-2', projectId: 'p1', title: 'Integrar autenticación con Supabase', status: 'in-progress', priority: 'high', assigneeIds: ['u2', 'u3'], creatorId: 'u1', tags: ['backend', 'auth'] },
  { id: 't3', key: 'PC-3', projectId: 'p1', title: 'Accesibilidad del formulario de registro', status: 'review', priority: 'medium', assigneeIds: ['u3'], creatorId: 'u2', tags: ['a11y'] },
  { id: 't4', key: 'PC-4', projectId: 'p1', title: 'Corregir overflow en tabla de facturas', status: 'todo', priority: 'low', assigneeIds: [], creatorId: 'u1', tags: ['bug'] },

  { id: 't5', key: 'APP-1', projectId: 'p2', title: 'Notificaciones push de estado de pedido', status: 'in-progress', priority: 'high', assigneeIds: ['u4'], creatorId: 'u2', tags: ['mobile'] },
  { id: 't6', key: 'APP-2', projectId: 'p2', title: 'Mapa de seguimiento en tiempo real', status: 'todo', priority: 'high', assigneeIds: ['u4', 'u2'], creatorId: 'u2', tags: ['mobile', 'maps'], dueDate: '2026-10-15' },
  { id: 't7', key: 'APP-3', projectId: 'p2', title: 'Pulir animaciones de carga', status: 'done', priority: 'low', assigneeIds: ['u4'], creatorId: 'u4', tags: ['ui'], archived: true },

  { id: 't8', key: 'CLOUD-1', projectId: 'p3', title: 'Definir esquema de base de datos en Postgres', status: 'done', priority: 'high', assigneeIds: ['u1'], creatorId: 'u1', tags: ['infra'] },
  { id: 't9', key: 'CLOUD-2', projectId: 'p3', title: 'Configurar políticas RLS por rol', status: 'in-progress', priority: 'high', assigneeIds: ['u5', 'u6'], creatorId: 'u1', tags: ['infra', 'seguridad'] },
  { id: 't10', key: 'CLOUD-3', projectId: 'p3', title: 'Migrar archivos adjuntos a storage', status: 'todo', priority: 'medium', assigneeIds: ['u6'], creatorId: 'u5', tags: ['infra'] },
  { id: 't11', key: 'CLOUD-4', projectId: 'p3', title: 'Pruebas de carga del nuevo backend', status: 'todo', priority: 'medium', assigneeIds: [], creatorId: 'u1', tags: ['qa'] },
  { id: 't12', key: 'CLOUD-5', projectId: 'p3', title: 'Documentar proceso de rollback', status: 'review', priority: 'low', assigneeIds: ['u5'], creatorId: 'u6', tags: ['docs'] },

  { id: 't13', key: 'AN-1', projectId: 'p4', title: 'Gráfico de retención semanal', status: 'in-progress', priority: 'medium', assigneeIds: ['u3'], creatorId: 'u5', tags: ['data'] },
  { id: 't14', key: 'AN-2', projectId: 'p4', title: 'Exportar reportes a CSV', status: 'todo', priority: 'low', assigneeIds: [], creatorId: 'u5', tags: ['data'] },

  { id: 't15', key: 'FAC-1', projectId: 'p5', title: 'Generar factura electrónica automática', status: 'in-progress', priority: 'high', assigneeIds: ['u7'], creatorId: 'u6', tags: ['backend'] },
  { id: 't16', key: 'FAC-2', projectId: 'p5', title: 'Recordatorios de cobranza por correo', status: 'todo', priority: 'medium', assigneeIds: ['u2'], creatorId: 'u6', tags: ['backend', 'email'] },
  { id: 't17', key: 'FAC-3', projectId: 'p5', title: 'Conciliación con pasarela de pago', status: 'review', priority: 'high', assigneeIds: ['u7', 'u6'], creatorId: 'u7', tags: ['backend'], dueDate: '2026-10-03' },
]
