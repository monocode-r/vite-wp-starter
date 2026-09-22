import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, normalizePath, loadEnv } from 'vite';
import sassGlobImports from 'vite-plugin-sass-glob-import';
import { runImagePipeline, resolveImageOutputMode } from './scripts/lib/image-pipeline.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sassRoot = normalizePath(path.resolve(__dirname, 'src/sass'));
const stylesScssPath = normalizePath(path.resolve(sassRoot, 'styles.scss'));

// .env から設定を取得
const env = loadEnv('', __dirname, '');
const themeName = env.THEME_NAME || 'my-theme';
const themeDir = path.resolve(__dirname, `themes/${themeName}`);
const assetsDir = path.resolve(themeDir, 'assets');
const imagesSrcDir = path.resolve(__dirname, 'src/images');
const imagesOutDir = path.resolve(assetsDir, 'images');

const devPort = Number(env.DEV_PORT) || 3000;
const wpPort = Number(env.WP_PORT) || 8888;
const devOrigin = `http://localhost:${devPort}`;

// ============================================================
// カスタムプラグイン
// ============================================================

/**
 * Sass の glob 部分ファイル（`@use "object/**"` 等）が module graph に載らないため、
 * 新規追加・編集時に styles.scss が再変換されない。部分ファイルの変更で styles を無効化する。
 */
function sassPartialHmr() {
  return {
    name: 'sass-partial-hmr',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(sassRoot);
    },
    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.scss')) return;
      const normalizedFile = normalizePath(file);
      if (normalizedFile === stylesScssPath) return;
      if (!normalizedFile.startsWith(`${sassRoot}/`)) return;

      const styleModules = server.moduleGraph.getModulesByFile(stylesScssPath);
      if (!styleModules || styleModules.size === 0) return;

      for (const mod of styleModules) {
        server.moduleGraph.invalidateModule(mod);
      }
      return [...styleModules];
    },
  };
}

/**
 * WordPress 連携用: 開発サーバーの起動時に .vite-hot ファイルを作成し、
 * PHP 側で Vite dev server の URL を検出できるようにする。
 */
function viteWordPressHot() {
  // assets/ の中に置くと本番ビルド（emptyOutDir）で消えて開発サーバーとの接続が切れるため、
  // ビルド出力の外に置く
  const hotFilePath = path.resolve(themeDir, '.vite-hot');
  return {
    name: 'vite-wordpress-hot',
    apply: 'serve',
    configureServer(server) {
      const { port = devPort, https } = server.config.server;
      const protocol = https ? 'https' : 'http';
      const url = `${protocol}://localhost:${port}`;

      fs.mkdirSync(path.dirname(hotFilePath), { recursive: true });
      fs.writeFileSync(hotFilePath, url);

      const cleanup = () => {
        try {
          if (fs.existsSync(hotFilePath)) fs.unlinkSync(hotFilePath);
        } catch {}
      };

      process.on('exit', cleanup);
      process.on('SIGINT', () => {
        cleanup();
        process.exit();
      });
      process.on('SIGTERM', () => {
        cleanup();
        process.exit();
      });
    },
  };
}

/**
 * PHP テンプレートは Vite のモジュールグラフに載らないため、保存しても何も起きない。
 * 変更を監視してブラウザにフルリロードを送る（browsersync 相当の挙動）。
 */
function phpFullReload() {
  return {
    name: 'php-full-reload',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(themeDir);
      // template-parts の新規追加・削除でもリロードしたいので change だけにしない
      ['change', 'add', 'unlink'].forEach((event) => {
        server.watcher.on(event, (file) => {
          if (!file.endsWith('.php')) return;
          server.ws.send({ type: 'full-reload', path: '*' });
        });
      });
    },
  };
}

/**
 * 中身が変わっていない出力は書き出さない。
 *
 * Vite は毎回すべての成果物を書き直すため、SCSS も JS も触っていないビルドで
 * styles.css / main.js の更新日時だけが動く。FTP で差分を更新日時から判断する現場では、
 * それだけで転送対象に入ってしまう。バイト列が同じものはバンドルから落とす。
 */
function skipUnchangedOutputs() {
  return {
    name: 'skip-unchanged-outputs',
    apply: 'build',
    // Vite の CSS 最終処理（vite:css-post）より後に比較する必要がある。
    // 既定の実行順だと確定前の内容と突き合わせてしまい、変更があるのに
    // 「同じ」と判定してバンドルから落とす＝変更が反映されない
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(options, bundle) {
        const outRoot = options.dir ?? path.dirname(options.file ?? '');
        for (const [fileName, output] of Object.entries(bundle)) {
          const to = path.resolve(outRoot, fileName);
          if (!fs.existsSync(to)) continue;
          const next =
            output.type === 'asset' ? Buffer.from(output.source) : Buffer.from(output.code);
          if (fs.readFileSync(to).equals(next)) {
            delete bundle[fileName];
          }
        }
      },
    },
  };
}

/**
 * 画像を src/images/ → themes/{THEME_NAME}/assets/images/ へ最適化しながら出力する。
 *
 * 開発・本番で同じ `runImagePipeline` を通す（経路を1本にする）。
 * 経路が分かれていると WebP 変換の有無やディレクトリ構造が dev / build でズレる。
 */
function wpImages() {
  const mode = resolveImageOutputMode();
  let isBuild = false;

  return {
    name: 'wp-images',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    async configureServer(server) {
      await runImagePipeline({
        sourceDir: imagesSrcDir,
        outDir: imagesOutDir,
        mode,
        clean: false,
        label: 'wp-images:dev',
      });
      server.watcher.add(imagesSrcDir);
      server.watcher.on('all', async (_event, filePath) => {
        if (!normalizePath(filePath).startsWith(`${normalizePath(imagesSrcDir)}/`)) return;
        await runImagePipeline({
          sourceDir: imagesSrcDir,
          outDir: imagesOutDir,
          mode,
          clean: false,
          label: 'wp-images:dev',
        });
        server.ws.send({ type: 'full-reload', path: '*' });
      });
    },
    async closeBundle() {
      // dev サーバー終了時にも呼ばれるため、ビルド時だけ走らせる
      if (!isBuild) return;
      // SCSS / JS から参照されて Vite が出力した画像を消さないよう clean はしない
      await runImagePipeline({
        sourceDir: imagesSrcDir,
        outDir: imagesOutDir,
        mode,
        clean: false,
        label: 'wp-images:build',
      });
    },
  };
}

// ============================================================
// Vite 設定
// ============================================================

export default defineConfig({
  base: './',
  root: __dirname,
  publicDir: false,
  plugins: [
    sassGlobImports(),
    sassPartialHmr(),
    viteWordPressHot(),
    phpFullReload(),
    wpImages(),
    skipUnchangedOutputs(),
  ],
  server: {
    port: devPort,
    strictPort: true,
    cors: true,
    // WordPress（別オリジン）から読み込むため、CSS 内の url() をオリジン込みで出力させる。
    // 無いとセルフホストのフォント・画像が dev だけ 404 になる
    origin: devOrigin,
    open: `http://localhost:${wpPort}`,
    watch: {
      // ビルド出力（画像コピー先）を監視対象から外す
      ignored: [`${normalizePath(assetsDir)}/**`],
    },
  },
  css: {
    devSourcemap: true,
    postcss: path.resolve(__dirname, 'postcss.config.cjs'),
    preprocessorOptions: {
      scss: {
        loadPaths: [sassRoot],
        quietDeps: true,
      },
    },
  },
  build: {
    outDir: assetsDir,
    // assets/ を毎回空にすると、中身が変わっていないファイルまで作り直されて更新日時が動く。
    // FTP で差分を更新日時から判断するため、消さずに上書き（image-pipeline 側は差分のみ書き込む）。
    // 出力名は固定なので古い成果物は残らない。ソース自体を消したときだけ出力側も手で消すこと。
    emptyOutDir: false,
    cssCodeSplit: false,
    minify: false,
    cssMinify: false,
    sourcemap: false,
    // browserslist（iOS >= 12 / Android >= 8）に合わせる。
    // 既定のままだと iOS 12 に無い構文がそのまま出る
    target: ['es2018', 'safari12', 'chrome70'],
    // 小さい画像・フォントを base64 に埋め込ませない（納品後に差し替えられる形で残す）
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/js/main.js'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';
          if (name.endsWith('.css')) return 'css/styles.css';
          if (/\.(woff2?|ttf|eot)$/.test(name)) return 'fonts/[name][extname]';
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name))
            return 'images/[name][extname]';
          return '[name][extname]';
        },
      },
    },
  },
});
