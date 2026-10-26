/** @type {import('next').NextConfig} */
const nextConfig = {
  // Requerido para el build Docker multi-stage: emite un server.js autocontenido
  // en .next/standalone con solo los node_modules que el runtime necesita (tracing),
  // en vez de copiar node_modules completo (deps de build/dev incluidas) a la imagen final.
  output: 'standalone',
};

export default nextConfig;
