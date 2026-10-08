import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import {
  AuditEntrySchema,
  envelope,
  paginated,
  PageQuerySchema,
  ProblemDetailsSchema,
} from '@/lib/schemas';

export const AuditTicketIdParamSchema = z.object({
  ticketId: z.string().uuid().openapi({ example: '22222222-2222-2222-2222-222222222222' }),
});

export const ListAuditQuerySchema = PageQuerySchema;
export const ListAuditResponseSchema = envelope(paginated(AuditEntrySchema));

registry.registerPath({
  method: 'get',
  path: '/api/audit/{ticketId}',
  tags: ['Audit'],
  summary: 'Listar historial de auditoría de un ticket (H2, H4)',
  description:
    'Orden cronológico descendente. Registra created/updated/archived/status_changed; permite ' +
    'trazar acciones de Admin sobre tickets ajenos (H2).',
  request: { params: AuditTicketIdParamSchema, query: ListAuditQuerySchema },
  responses: {
    200: {
      description: 'Auditoría paginada',
      content: { 'application/json': { schema: ListAuditResponseSchema } },
    },
    400: {
      description: 'Parámetros de paginación inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    404: {
      description: 'Ticket no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
