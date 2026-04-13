import { readFile, writeFile, access, unlink, mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import imageminWebp from 'imagemin-webp';
import imageOutputDefaults from '../../image-output.config.mjs';

export const VALID_MODES = /** @type {const} */ (['webp-only', 'both', 'raster-only']);

/** @returns {'webp-only' | 'both' | 'raster-only'} */
export function resolveImageOutputMode() {
  const fromEnv = process.env.IMAGE_OUTPUT_MODE?.trim();
  const raw = fromEnv || imageOutputDefaults;
  if (VALID_MODES.includes(/** @type {any} */ (raw))) {
    return raw;
  }
  console.warn(
    `[image-pipeline] 無効な IMAGE_OUTPUT_MODE / image-output.config.mjs: "${raw}". ` +
      `有効値: ${VALID_MODES.join(', ')}。フォールバック: webp-only`,
  );
  return 'webp-only';
}

async function pathExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {{ sourceDir: string, outDir: string, mode: 'webp-only' | 'both' | 'raster-only', label?: string }} opts
 * - 同一ディレクトリ（dist 最適化）: 上書き・webp-only 時は元ラスタ削除
 * - 別ディレクトリ（開発キャッシュ）: 出力先を一度空にしてから src 相当を再生成
 */
export async function runImagePipeline({ sourceDir, outDir, mode, label = 'image-pipeline' }) {
  const srcAbs = path.resolve(sourceDir);
  const outAbs = path.resolve(outDir);
  const separateRoots = srcAbs !== outAbs;

  if (!(await pathExists(srcAbs))) {
    console.warn(`[${label}] ${sourceDir} が無いためスキップします`);
    return;
  }

  if (separateRoots) {
    await rm(outAbs, { recursive: true, force: true });
    await mkdir(outAbs, { recursive: true });
  } else if (!(await pathExists(outAbs))) {
    await mkdir(outAbs, { recursive: true });
  }

  const rasterSvgRel = await fg(['**/*.{jpg,jpeg,png,svg}'], {
    cwd: srcAbs,
    onlyFiles: true,
  });

  for (const rel of rasterSvgRel) {
    const from = path.join(srcAbs, rel);
    const to = path.join(outAbs, rel);
    await mkdir(path.dirname(to), { recursive: true });
    const buf = await readFile(from);
    const ext = path.extname(rel).toLowerCase();
    let out;

    if (ext === '.jpg' || ext === '.jpeg') {
      out = await imagemin.buffer(buf, {
        plugins: [imageminMozjpeg({ quality: 80 })],
      });
    } else if (ext === '.png') {
      out = await imagemin.buffer(buf, {
        plugins: [imageminPngquant({ quality: [0.65, 0.8] })],
      });
    } else if (ext === '.svg') {
      out = await imagemin.buffer(buf, {
        plugins: [
          imageminSvgo({
            plugins: [
              {
                name: 'removeViewBox',
                active: false,
              },
            ],
          }),
        ],
      });
    } else {
      continue;
    }

    await writeFile(to, out);
  }

  const allRel = await fg(['**/*'], {
    cwd: srcAbs,
    onlyFiles: true,
  });

  for (const rel of allRel) {
    const ext = path.extname(rel).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.svg'].includes(ext)) {
      continue;
    }
    const from = path.join(srcAbs, rel);
    const to = path.join(outAbs, rel);
    if (path.resolve(from) === path.resolve(to)) {
      continue;
    }
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(from, to);
  }

  if (mode === 'raster-only') {
    return;
  }

  const rasters = await fg(['**/*.{jpg,jpeg,png}'], {
    cwd: outAbs,
    absolute: true,
    onlyFiles: true,
  });

  for (const file of rasters) {
    const buf = await readFile(file);
    const webpBuf = await imagemin.buffer(buf, {
      plugins: [
        imageminWebp({
          quality: 85,
        }),
      ],
    });
    const webpPath = file.replace(/\.(jpe?g|png)$/i, '.webp');
    await writeFile(webpPath, webpBuf);

    if (mode === 'webp-only') {
      await unlink(file);
    }
  }
}
