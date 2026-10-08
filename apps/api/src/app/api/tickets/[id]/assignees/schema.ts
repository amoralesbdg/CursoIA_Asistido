import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { TicketSchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';
import { TicketIdParamSchema } from '../schema';

export const AddAssigneeRequestSchema = z.object({
  userId: z.string().uuid().openapi({ example: '33333333-3333-3333-3333-333333333333' }),
});

export const AddAssigneeResponseSchema = envelope(TicketSchema);

registry.registerPath({
  method: 'post',
  path: '/api/tickets/{id}/assignees',
  tags: ['Tickets'],
  summary: 'Asignar un usuario a un ticket (RF-10, H7)',
  description:
    'Agrega userId a assigneeIds si no está ya presente (idempotente). Permite autoasignación y ' +
    'asignación múltiple (repitiendo la llamada con otro userId).',
  request: {
    params: TicketIdParamSchema,
    body: { content: { 'application/json': { schema: AddAssigneeRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Ticket actualizado',
      content: { 'application/json': { schema: AddAssigneeResponseSchema } },
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
