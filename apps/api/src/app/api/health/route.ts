import { NextResponse } from 'next/server';

// Respuesta sin envolver en { data, error } (a diferencia del resto de /api):
// la usa el HEALTHCHECK de Docker/orquestadores, que esperan el shape plano { status, timestamp }.
export function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
