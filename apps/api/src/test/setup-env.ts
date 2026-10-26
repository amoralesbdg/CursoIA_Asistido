// Variables de entorno mínimas para que los módulos que las validan en el
// top-level (lib/jwt.ts) puedan importarse sin conectar a servicios reales.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY NO se definen aquí a propósito:
// '@/lib/supabase' siempre se reemplaza con vi.mock() en los tests, así que
// su archivo real nunca se ejecuta y la suite corre sin DATABASE_URL.
process.env.JWT_SECRET ??= 'test-jwt-secret';
