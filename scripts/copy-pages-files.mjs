import { existsSync } from 'node:fs';
import { copyFile, stat } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');

const redirectsSrc = path.join(projectRoot, '_redirects');
const redirectsDest = path.join(distDir, '_redirects');

try {
  await stat(distDir);
} catch {
  console.error('No se encontró la carpeta dist/. Ejecuta primero: npm run build:web');
  process.exit(1);
}

if (existsSync(redirectsSrc)) {
  await copyFile(redirectsSrc, redirectsDest);
  console.log('Copiado _redirects a dist/ para Cloudflare Pages');
} else {
  console.warn('No existe el archivo _redirects en la raíz del proyecto.');
}
