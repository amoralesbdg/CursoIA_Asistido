import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { ProjectSchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';

export const ProjectIdParamSchema = z.object({
  id: z.string().uuid().openapi({ example: '11111111-1111-1111-1111-111111111111' }),
});

export const GetProjectResponseSchema = envelope(ProjectSchema);

registry.registerPath({
  method: 'get',
  path: '/api/projects/{id}',
  tags: ['Projects'],
  summary: 'Obtener un proyecto por id (RF-08)',
  request: { params: ProjectIdParamSchema },
  responses: {
    200: {
      description: 'Proyecto encontrado',
      content: { 'application/json': { schema: GetProjectResponseSchema } },
    },
    404: {
      description: 'Proyecto no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
