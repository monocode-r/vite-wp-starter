import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { resolveImageOutputMode, runImagePipeline } from './lib/image-pipeline.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const env = loadEnv('', projectRoot, '');
const themeName = env.THEME_NAME || 'my-theme';
const assetsImages = path.join(projectRoot, `themes/${themeName}/assets/images`);

async function pathExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const mode = resolveImageOutputMode();
  console.log(`[optimize-images] テーマ: ${themeName}`);
  console.log(`[optimize-images] モード: ${mode}`);

  if (!(await pathExists(assetsImages))) {
    console.warn(`[optimize-images] ${themeName}/assets/images が無いためスキップします`);
    return;
  }

  await runImagePipeline({
    sourceDir: assetsImages,
    outDir: assetsImages,
    mode,
    label: 'optimize-images',
  });

  console.log('[optimize-images] 完了');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
