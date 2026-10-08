import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Mini Jira API',
      version: '0.1.0',
      description:
        'Endpoints P0, P1 y P2 del MVP de Mini Jira (contrato completo). ' +
        'Fase sin autenticación/autorización: todo endpoint se ejecuta de forma anónima. ' +
        'Los campos actorId/creatorId/authorId son temporales: reemplazan al JWT mientras no se ' +
        'valida Authorization, y se declaran explícitamente en el request. ' +
        'Ver docs/api-contract.md para el contrato completo.',
    },
  });
}
