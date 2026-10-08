import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import {
  TicketSchema,
  PrioritySchema,
  envelope,
  paginated,
  PageQuerySchema,
  ProblemDetailsSchema,
} from '@/lib/schemas';

export const ListTicketsQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  priority: PrioritySchema.optional(),
  assigneeId: z.string().uuid().optional(),
  tag: z.string().min(1).optional(),
  dueDateFrom: z.string().optional().openapi({ example: '2026-01-01' }),
  dueDateTo: z.string().optional().openapi({ example: '2026-12-31' }),
  page: PageQuerySchema.shape.page,
  pageSize: PageQuerySchema.shape.pageSize,
});

export const ListTicketsResponseSchema = envelope(paginated(TicketSchema));

const actorIdDescription =
  'Id del usuario que realiza la acción. Campo temporal mientras no hay JWT: ' +
  'en esta fase ningún endpoint valida Authorization, así que el actor se declara ' +
  'explícitamente en el request (ver CLAUDE.md / instrucciones de fase).';

export const CreateTicketRequestSchema = z.object({
  title: z.string().min(1).openapi({ example: 'Corregir overflow en tabla de facturas' }),
  description: z.string().optional(),
  projectId: z.string().uuid().openapi({ example: '11111111-1111-1111-1111-111111111111' }),
  priority: PrioritySchema,
  assigneeIds: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional().openapi({ example: '2026-11-01' }),
  creatorId: z.string().uuid().openapi({
    example: '33333333-3333-3333-3333-333333333333',
    description: actorIdDescription,
  }),
});

export const CreateTicketResponseSchema = envelope(TicketSchema);

registry.registerPath({
  method: 'get',
  path: '/api/tickets',
  tags: ['Tickets'],
  summary: 'Listar tickets con filtros combinados (RF-12, H8)',
  description: 'Combina todos los filtros presentes con AND. Excluye archivados por defecto.',
  request: { query: ListTicketsQuerySchema },
  responses: {
    200: {
      description: 'Listado paginado de tickets',
      content: { 'application/json': { schema: ListTicketsResponseSchema } },
    },
    400: {
      description: 'Parámetros de filtro inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/tickets',
  tags: ['Tickets'],
  summary: 'Crear un ticket (RF-07, RF-11, H6)',
  description:
    'projectId obligatorio (400 si falta — H5 edge case); priority debe ser uno de los 3 valores ' +
    'permitidos (400 si no — H6 edge case). Genera `key` server-side con formato PREFIJO-N.',
  request: {
    body: { content: { 'application/json': { schema: CreateTicketRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Ticket creado',
      content: { 'application/json': { schema: CreateTicketResponseSchema } },
    },
    400: {
      description: 'Datos inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    404: {
      description: 'Proyecto o creatorId no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
