// This shim allows Prisma to execute the TypeScript seed file in environments
// where Node.js cannot load `.ts` entrypoints directly.
require('ts-node/register');
require('./seed.ts');
