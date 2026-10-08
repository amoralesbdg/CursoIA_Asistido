import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET.');
}

const JWT_SECRET: string = process.env.JWT_SECRET;

export type TokenPayload = {
  sub: string;
  role: 'admin' | 'user';
};

// El token se emite en /auth/register y /auth/login por contrato, pero en esta
// fase ningún endpoint valida Authorization (ver CLAUDE.md / instrucciones de fase).
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
