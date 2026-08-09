import { readFile, writeFile, access, mkdir, copyFile, rm } from 'node:fs/promises';
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
 * src の画像を最適化して out へ出力する。
 *
 * - `webp-only`: WebP だけを出力（元の jpg/png は書き出さない）
 * - `both`: 最適化した jpg/png と WebP の両方
 * - `raster-only`: 最適化した jpg/png のみ
 *
 * WebP は必ず元データから変換する（最適化済みラスタ経由だと非可逆エンコードが2回かかる）。
 * SVG は svgo、その他のファイルはそのままコピーする。
 *
 * @param {{ sourceDir: string, outDir: string, mode: 'webp-only' | 'both' | 'raster-only', clean?: boolean, label?: string }} opts
 *   `clean: false` にすると出力先を消さない（ビルド時に Vite が出力した資産を残すため）
 */
export async function runImagePipeline({
  sourceDir,
  outDir,
  mode,
  clean = true,
  label = 'image-pipeline',
}) {
  const srcAbs = path.resolve(sourceDir);
  const outAbs = path.resolve(outDir);
  const separateRoots = srcAbs !== outAbs;

  if (!(await pathExists(srcAbs))) {
    console.warn(`[${label}] ${sourceDir} が無いためスキップします`);
    return;
  }

  if (separateRoots && clean) {
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

    if (ext === '.svg') {
      const out = await imagemin.buffer(buf, {
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
      await writeFile(to, out);
      continue;
    }

    // WebP は元データから1回だけ変換する。
    // 最適化済みラスタを変換元にすると非可逆エンコードが2回かかり、画質を捨てる
    if (mode !== 'raster-only') {
      const webpBuf = await imagemin.buffer(buf, {
        plugins: [imageminWebp({ quality: 90 })],
      });
      await writeFile(to.replace(/\.(jpe?g|png)$/i, '.webp'), webpBuf);
    }

    // 元のラスタも配信するモードのときだけ最適化して書き出す
    if (mode !== 'webp-only') {
      const out =
        ext === '.png'
          ? await imagemin.buffer(buf, {
              plugins: [imageminPngquant({ quality: [0.65, 0.8] })],
            })
          : await imagemin.buffer(buf, {
              plugins: [imageminMozjpeg({ quality: 80 })],
            });
      await writeFile(to, out);
    }
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
}
