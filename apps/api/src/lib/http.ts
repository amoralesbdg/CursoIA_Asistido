import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export type ProblemType =
  | 'validation-error'
  | 'unauthenticated'
  | 'forbidden'
  | 'not-found'
  | 'duplicate'
  | 'forbidden-transition'
  | 'internal-error';

const STATUS_BY_TYPE: Record<ProblemType, number> = {
  'validation-error': 400,
  unauthenticated: 401,
  forbidden: 403,
  'not-found': 404,
  duplicate: 409,
  'forbidden-transition': 409,
  'internal-error': 500,
};

// RFC 7807 Problem Details, como body nativo (no se envuelve en { data, error }).
export function problem(type: ProblemType, title: string, detail: string, instance: string) {
  const status = STATUS_BY_TYPE[type];
  return NextResponse.json(
    {
      type: `https://miniJira.dev/errors/${type}`,
      title,
      status,
      detail,
      instance,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

// Loguea el error real server-side y nunca lo expone al cliente.
export function internalError(instance: string, err: unknown) {
  console.error(`[internal-error] ${instance}`, err);
  return problem(
    'internal-error',
    'Error interno del servidor',
    'Ocurrió un error inesperado. Intenta nuevamente más tarde.',
    instance,
  );
}
