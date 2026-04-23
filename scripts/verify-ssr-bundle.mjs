import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();
const candidates = [
  path.join(projectRoot, 'dist', 'server', 'entry-server.js'),
  path.join(projectRoot, 'dist', 'server', 'entry-server.mjs')
];

let lastError = null;

for (const candidate of candidates) {
  try {
    await fs.access(candidate);
    await import(pathToFileURL(candidate).href);
    console.log(`SSR bundle import verified: ${path.basename(candidate)}`);
    process.exit(0);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      continue;
    }

    lastError = error;
    break;
  }
}

if (lastError) {
  console.error('SSR bundle verification failed.');
  throw lastError;
}

throw new Error(
  'Missing built SSR entry module. Expected dist/server/entry-server.js or dist/server/entry-server.mjs.'
);
