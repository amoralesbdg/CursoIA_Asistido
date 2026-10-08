import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';
import { UserSchema, envelope, ProblemDetailsSchema } from '@/lib/schemas';

export const LoginRequestSchema = z.object({
  username: z.string().min(1).openapi({ example: 'jdoe' }),
  password: z.string().min(1).openapi({ example: 'S3curePass!' }),
});

export const LoginResponseSchema = envelope(z.object({ user: UserSchema, token: z.string() }));

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Iniciar sesión (RF-01, H1)',
  request: {
    body: { content: { 'application/json': { schema: LoginRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Login exitoso',
      content: { 'application/json': { schema: LoginResponseSchema } },
    },
    400: {
      description: 'Datos de login inválidos',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
    401: {
      description: 'Credenciales incorrectas',
      content: { 'application/problem+json': { schema: ProblemDetailsSchema } },
    },
  },
});
