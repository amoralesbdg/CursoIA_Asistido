import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { UserSchema, envelope } from '@/lib/schemas';

export const ListUsersResponseSchema = envelope(z.array(UserSchema));

registry.registerPath({
  method: 'get',
  path: '/api/users',
  tags: ['Users'],
  summary: 'Listar usuarios',
  description:
    'Listado simple de usuarios (sin paginación en esta fase). Usado por el frontend para ' +
    'resolver nombres, por ejemplo el creador de un proyecto en la grilla de proyectos.',
  responses: {
    200: {
      description: 'Listado de usuarios',
      content: { 'application/json': { schema: ListUsersResponseSchema } },
    },
  },
});
