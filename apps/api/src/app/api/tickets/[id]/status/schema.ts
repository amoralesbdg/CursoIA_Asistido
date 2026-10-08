import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { TicketSchema, StatusSchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';

export const TicketIdParamSchema = z.object({
  id: z.string().uuid().openapi({ example: '22222222-2222-2222-2222-222222222222' }),
});

export const UpdateTicketStatusRequestSchema = z.object({
  status: StatusSchema,
});

export const UpdateTicketStatusResponseSchema = envelope(TicketSchema);

registry.registerPath({
  method: 'patch',
  path: '/api/tickets/{id}/status',
  tags: ['Tickets'],
  summary: 'Avanzar el estado de un ticket (RF-13, H9)',
  description:
    'Transición secuencial obligatoria todo→in-progress→review→done, un paso a la vez, ' +
    'sin saltos ni retrocesos.',
  request: {
    params: TicketIdParamSchema,
    body: { content: { 'application/json': { schema: UpdateTicketStatusRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Ticket actualizado',
      content: { 'application/json': { schema: UpdateTicketStatusResponseSchema } },
    },
    400: {
      description: 'Status inválido',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    404: {
      description: 'Ticket no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    409: {
      description: 'Transición de estado no permitida',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
