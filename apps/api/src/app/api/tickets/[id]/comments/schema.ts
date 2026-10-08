import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import {
  CommentSchema,
  envelope,
  paginated,
  PageQuerySchema,
  ProblemDetailsSchema,
} from '@/lib/schemas';
import { TicketIdParamSchema } from '../schema';

export const ListCommentsQuerySchema = PageQuerySchema;
export const ListCommentsResponseSchema = envelope(paginated(CommentSchema));

export const CreateCommentRequestSchema = z.object({
  body: z.string().min(1).openapi({ example: 'Quedó pendiente revisar el caso de borde H8.' }),
  authorId: z.string().uuid().openapi({
    example: '33333333-3333-3333-3333-333333333333',
    description:
      'Id del autor del comentario. Campo temporal mientras no hay JWT (ver nota de fase en CLAUDE.md).',
  }),
});

export const CreateCommentResponseSchema = envelope(CommentSchema);

registry.registerPath({
  method: 'get',
  path: '/api/tickets/{id}/comments',
  tags: ['Comments'],
  summary: 'Listar comentarios de un ticket en orden cronológico (RF-15, H11)',
  request: { params: TicketIdParamSchema, query: ListCommentsQuerySchema },
  responses: {
    200: {
      description: 'Comentarios paginados, orden ascendente por createdAt',
      content: { 'application/json': { schema: ListCommentsResponseSchema } },
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

registry.registerPath({
  method: 'post',
  path: '/api/tickets/{id}/comments',
  tags: ['Comments'],
  summary: 'Añadir un comentario a un ticket (RF-15, H11)',
  request: {
    params: TicketIdParamSchema,
    body: { content: { 'application/json': { schema: CreateCommentRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Comentario creado',
      content: { 'application/json': { schema: CreateCommentResponseSchema } },
    },
    400: {
      description: 'Datos de comentario inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    404: {
      description: 'Ticket o authorId no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
