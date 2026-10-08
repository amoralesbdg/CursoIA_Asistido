import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { UserSchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';

export const RegisterRequestSchema = z.object({
  username: z.string().min(1).openapi({ example: 'jdoe' }),
  password: z.string().min(8).openapi({ example: 'S3curePass!' }),
  email: z.string().email().openapi({ example: 'jdoe@example.com' }),
});

export const RegisterResponseSchema = envelope(
  z.object({ user: UserSchema, token: z.string() }),
);

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Registrar un nuevo usuario (RF-01, H1)',
  request: {
    body: { content: { 'application/json': { schema: RegisterRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Usuario creado',
      content: { 'application/json': { schema: RegisterResponseSchema } },
    },
    400: {
      description: 'Datos de registro inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    409: {
      description: 'Username o email ya existe',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
