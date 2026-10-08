import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { TicketSchema, PrioritySchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';

export const TicketIdParamSchema = z.object({
  id: z.string().uuid().openapi({ example: '22222222-2222-2222-2222-222222222222' }),
});

const actorIdDescription =
  'Id del usuario que realiza la acción (para la regla de ownership: admin, creador o asignado). ' +
  'Campo temporal mientras no hay JWT: en esta fase ningún endpoint valida Authorization.';

const actorIdField = z.string().uuid().openapi({
  example: '33333333-3333-3333-3333-333333333333',
  description: actorIdDescription,
});

export const UpdateTicketRequestSchema = z.object({
  actorId: actorIdField,
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: PrioritySchema.optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional().openapi({ example: '2026-11-01' }),
});

export const UpdateTicketResponseSchema = envelope(TicketSchema);

export const DeleteTicketQuerySchema = z.object({
  actorId: actorIdField,
});

export const DeleteTicketResponseSchema = envelope(TicketSchema);

registry.registerPath({
  method: 'patch',
  path: '/api/tickets/{id}',
  tags: ['Tickets'],
  summary: 'Editar un ticket (RF-07, RF-11, H2, H3)',
  description:
    'Permitido si actor.role=admin, o actor.id=ticket.creatorId, o actor.id está en ticket.assigneeIds ' +
    '(H2, H3); si no, 403. Last-write-wins, sin detección de conflicto (H10). actorId va en el body ' +
    'mientras no hay JWT.',
  request: {
    params: TicketIdParamSchema,
    body: { content: { 'application/json': { schema: UpdateTicketRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Ticket actualizado',
      content: { 'application/json': { schema: UpdateTicketResponseSchema } },
    },
    400: {
      description: 'Datos inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    403: {
      description: 'No autorizado',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    404: {
      description: 'Ticket no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/tickets/{id}',
  tags: ['Tickets'],
  summary: 'Archivar un ticket (soft-delete) (RF-06, H4)',
  description:
    'Mismo chequeo de ownership que PATCH (admin, creador o asignado — H4, H4 edge case). ' +
    'No borra físicamente: marca archived_at. actorId va por query param mientras no hay JWT.',
  request: {
    params: TicketIdParamSchema,
    query: DeleteTicketQuerySchema,
  },
  responses: {
    200: {
      description: 'Ticket archivado',
      content: { 'application/json': { schema: DeleteTicketResponseSchema } },
    },
    400: {
      description: 'actorId inválido',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    403: {
      description: 'No autorizado',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    404: {
      description: 'Ticket no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
