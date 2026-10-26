import { NextRequest, NextResponse } from 'next/server';

// Orígenes permitidos (separados por coma en FRONTEND_URL, p. ej. "http://localhost:5175,https://miniJira.app").
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5175')
  .split(',')
  .map((origin) => origin.trim());

function applyCorsHeaders(res: NextResponse, origin: string | null) {
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
  }

  return applyCorsHeaders(NextResponse.next(), origin);
}

export const config = {
  matcher: '/api/:path*',
};
