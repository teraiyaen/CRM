import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

// Keep the published version and the ID embedded by Vite in sync on every build.
const publicDirectory = new URL('../public/', import.meta.url);
await mkdir(publicDirectory, { recursive: true });
await writeFile(new URL('version.json', publicDirectory), JSON.stringify({
    buildId: randomUUID(),
    builtAt: new Date().toISOString(),
}, null, 2) + '\n');
