import { existsSync } from 'node:fs';
import { copyFile, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');

const redirectsSrc = path.join(projectRoot, '_redirects');
const redirectsDest = path.join(distDir, '_redirects');

const ASSETS_NODE_MODULES_PREFIX = '/assets/node_modules/';
const ASSETS_VENDOR_PREFIX = '/assets/vendor/';

async function findJsFiles(dir) {
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findJsFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function moveVendorAssetsAndPatchBundles() {
  const assetsDir = path.join(distDir, 'assets');
  const nodeModulesAssetsDir = path.join(assetsDir, 'node_modules');
  const vendorAssetsDir = path.join(assetsDir, 'vendor');

  // Cloudflare (y algunas herramientas de deploy) suelen bloquear/excluir rutas con "node_modules".
  // Expo exporta assets de dependencias dentro de dist/assets/node_modules/...
  // Para evitarlo, movemos ese árbol a dist/assets/vendor y reescribimos los bundles.
  if (existsSync(nodeModulesAssetsDir)) {
    if (existsSync(vendorAssetsDir)) {
      await rm(vendorAssetsDir, { recursive: true, force: true });
    }

    await rename(nodeModulesAssetsDir, vendorAssetsDir);
    console.log('Movido dist/assets/node_modules -> dist/assets/vendor');
  }

  const jsDir = path.join(distDir, '_expo', 'static', 'js');
  const jsFiles = await findJsFiles(jsDir);

  let patchedCount = 0;
  for (const filePath of jsFiles) {
    const src = await readFile(filePath, 'utf8');
    if (!src.includes(ASSETS_NODE_MODULES_PREFIX)) continue;

    const out = src.split(ASSETS_NODE_MODULES_PREFIX).join(ASSETS_VENDOR_PREFIX);
    await writeFile(filePath, out, 'utf8');
    patchedCount++;
  }

  if (patchedCount > 0) {
    console.log(`Actualizados ${patchedCount} bundle(s) para usar ${ASSETS_VENDOR_PREFIX}`);
  }
}

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

await moveVendorAssetsAndPatchBundles();
