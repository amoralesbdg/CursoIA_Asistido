import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { TicketSchema, StatusSchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';

export const ProjectTicketsQuerySchema = z.object({
  status: StatusSchema.optional(),
});

export const GroupedTicketsSchema = z.object({
  todo: z.array(TicketSchema),
  'in-progress': z.array(TicketSchema),
  review: z.array(TicketSchema),
  done: z.array(TicketSchema),
});

export const ListProjectTicketsResponseSchema = envelope(
  z.union([GroupedTicketsSchema, z.array(TicketSchema)]),
);

registry.registerPath({
  method: 'get',
  path: '/api/projects/{id}/tickets',
  tags: ['Tickets'],
  summary: 'Listar tickets de un proyecto, agrupados por estado (RF-07, RF-12, RF-13)',
  description:
    'Excluye tickets archivados por defecto. Si se pasa `status`, devuelve un arreglo plano ' +
    'filtrado por ese estado; si se omite, agrupa por las 4 columnas del Kanban.',
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: ProjectTicketsQuerySchema,
  },
  responses: {
    200: {
      description: 'Tickets del proyecto',
      content: { 'application/json': { schema: ListProjectTicketsResponseSchema } },
    },
    404: {
      description: 'Proyecto no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
