import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { ProjectSchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';
import { ProjectIdParamSchema } from '../schema';

export const AddMemberRequestSchema = z.object({
  userId: z.string().uuid().openapi({ example: '33333333-3333-3333-3333-333333333333' }),
  actorId: z.string().uuid().openapi({
    example: '11111111-1111-1111-1111-111111111111',
    description:
      'Id del usuario que realiza la acción (debe ser el creador del proyecto o un admin — H5). ' +
      'Campo temporal mientras no hay JWT.',
  }),
});

export const AddMemberResponseSchema = envelope(ProjectSchema);

registry.registerPath({
  method: 'post',
  path: '/api/projects/{id}/members',
  tags: ['Projects'],
  summary: 'Agregar un miembro a un proyecto (RF-09, RF-09-bis, H5)',
  description:
    'Permitido si actor.id=project.creatorId o actor.role=admin (H5); si no, 403 (H5 edge case).',
  request: {
    params: ProjectIdParamSchema,
    body: { content: { 'application/json': { schema: AddMemberRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Proyecto actualizado',
      content: { 'application/json': { schema: AddMemberResponseSchema } },
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
      description: 'Proyecto o usuario no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
