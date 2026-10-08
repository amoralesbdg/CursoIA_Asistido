import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { LockSchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';
import { TicketIdParamSchema } from '../schema';

export const CreateLockRequestSchema = z.object({
  userId: z.string().uuid().openapi({ example: '33333333-3333-3333-3333-333333333333' }),
});

export const CreateLockResponseSchema = envelope(LockSchema);

export const DeleteLockQuerySchema = z.object({
  userId: z.string().uuid().openapi({ example: '33333333-3333-3333-3333-333333333333' }),
});

export const DeleteLockResponseSchema = envelope(z.null());

registry.registerPath({
  method: 'post',
  path: '/api/tickets/{id}/lock',
  tags: ['Tickets'],
  summary: 'Tomar el soft lock informativo de un ticket (H10)',
  description:
    'Puramente informativo/presencia: no bloquea PATCH /tickets/:id (last-write-wins, sin conflicto). ' +
    'Reemplaza cualquier lock previo del ticket (relación 1:1).',
  request: {
    params: TicketIdParamSchema,
    body: { content: { 'application/json': { schema: CreateLockRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Lock tomado',
      content: { 'application/json': { schema: CreateLockResponseSchema } },
    },
    400: {
      description: 'userId inválido',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    404: {
      description: 'Ticket o usuario no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/tickets/{id}/lock',
  tags: ['Tickets'],
  summary: 'Liberar el lock propio de un ticket (H10)',
  description: 'Libera el lock solo si pertenece a userId. No falla si no existe lock.',
  request: {
    params: TicketIdParamSchema,
    query: DeleteLockQuerySchema,
  },
  responses: {
    200: {
      description: 'Lock liberado (o no existía)',
      content: { 'application/json': { schema: DeleteLockResponseSchema } },
    },
    400: {
      description: 'userId inválido',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
