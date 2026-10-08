import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { buildOpenApiDocument } from '../src/lib/openapi/document';

// Importar cada schema.ts por su efecto secundario: cada uno llama
// registry.registerPath(...) al cargarse.
import '../src/app/api/auth/register/schema';
import '../src/app/api/auth/login/schema';
import '../src/app/api/projects/schema';
import '../src/app/api/projects/[id]/schema';
import '../src/app/api/projects/[id]/tickets/schema';
import '../src/app/api/projects/[id]/members/schema';
import '../src/app/api/tickets/schema';
import '../src/app/api/tickets/[id]/schema';
import '../src/app/api/tickets/[id]/status/schema';
import '../src/app/api/tickets/[id]/assignees/schema';
import '../src/app/api/tickets/[id]/lock/schema';
import '../src/app/api/tickets/[id]/comments/schema';
import '../src/app/api/audit/[ticketId]/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '../public/openapi.yaml');

const document = buildOpenApiDocument();
writeFileSync(outPath, stringify(document), 'utf-8');

console.log(`openapi.yaml generado en ${outPath}`);
