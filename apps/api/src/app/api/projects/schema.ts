import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { ProjectSchema, envelope, paginated, PageQuerySchema, ProblemDetailsSchema } from '@/lib/schemas';

export const ListProjectsQuerySchema = PageQuerySchema;

export const ListProjectsResponseSchema = envelope(paginated(ProjectSchema));

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).openapi({ example: 'Portal de clientes' }),
  description: z.string().optional(),
  creatorId: z.string().uuid().openapi({
    example: '11111111-1111-1111-1111-111111111111',
    description:
      'Id del usuario creador, actúa como owner (H5). Campo temporal mientras no hay JWT: en esta ' +
      'fase ningún endpoint valida Authorization.',
  }),
});

export const CreateProjectResponseSchema = envelope(ProjectSchema);

registry.registerPath({
  method: 'get',
  path: '/api/projects',
  tags: ['Projects'],
  summary: 'Listar proyectos (RF-08, RF-09)',
  description:
    'Fase sin autenticación: se listan todos los proyectos (equivalente a la vista de Admin). ' +
    'El filtrado por creatorId/memberIds del usuario normal requiere el token de /auth, fuera de alcance de P0.',
  request: {
    query: z.object({
      page: ListProjectsQuerySchema.shape.page,
      pageSize: ListProjectsQuerySchema.shape.pageSize,
    }),
  },
  responses: {
    200: {
      description: 'Listado paginado de proyectos',
      content: { 'application/json': { schema: ListProjectsResponseSchema } },
    },
    400: {
      description: 'Parámetros de paginación inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/projects',
  tags: ['Projects'],
  summary: 'Crear un proyecto (RF-08, H5)',
  description: 'creatorId actúa como owner (H5). Cualquier usuario existente puede crear proyectos.',
  request: {
    body: { content: { 'application/json': { schema: CreateProjectRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Proyecto creado',
      content: { 'application/json': { schema: CreateProjectResponseSchema } },
    },
    400: {
      description: 'Datos de proyecto inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    404: {
      description: 'creatorId no existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
