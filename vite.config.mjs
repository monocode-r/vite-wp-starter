import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, normalizePath, loadEnv } from 'vite';
import sassGlobImports from 'vite-plugin-sass-glob-import';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sassRoot = normalizePath(path.resolve(__dirname, 'src/sass'));
const stylesScssPath = normalizePath(path.resolve(sassRoot, 'styles.scss'));

// .env から THEME_NAME を取得
const env = loadEnv('', __dirname, '');
const themeName = env.THEME_NAME || 'my-theme';
const themeDir = path.resolve(__dirname, `themes/${themeName}`);
const assetsDir = path.resolve(themeDir, 'assets');

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
    configureServer(server) {
      server.watcher.add(path.resolve(__dirname, 'src/sass'));
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
 * WordPress 連携用: 開発サーバーの起動時に assets/hot ファイルを作成し、
 * PHP 側で Vite dev server の URL を検出できるようにする。
 */
function viteWordPressHot() {
  const hotFilePath = path.resolve(assetsDir, 'hot');
  return {
    name: 'vite-wordpress-hot',
    configureServer(server) {
      const { port = 3000, https } = server.config.server;
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
 * 開発時に src/images/ を themes/{THEME_NAME}/assets/images/ にコピーする。
 */
function wpDevImages() {
  const srcDir = path.resolve(__dirname, 'src/images');
  const destDir = path.resolve(assetsDir, 'images');

  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  return {
    name: 'wp-dev-images',
    apply: 'serve',
    configureServer(server) {
      copyRecursive(srcDir, destDir);
      server.watcher.add(srcDir);
      server.watcher.on('all', (_event, filePath) => {
        if (normalizePath(filePath).startsWith(normalizePath(srcDir) + '/')) {
          copyRecursive(srcDir, destDir);
        }
      });
    },
  };
}

// ============================================================
// Vite 設定
// ============================================================

export default defineConfig({
  root: __dirname,
  publicDir: false,
  plugins: [
    sassGlobImports(),
    sassPartialHmr(),
    viteWordPressHot(),
    wpDevImages(),
    ...viteStaticCopy({
      targets: [
        {
          src: 'src/images/**/*',
          dest: 'images',
        },
      ],
    }).filter((p) => p.apply === 'build'),
  ],
  server: {
    port: 3000,
    strictPort: true,
    cors: true,
  },
  css: {
    devSourcemap: true,
    postcss: path.resolve(__dirname, 'postcss.config.cjs'),
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(__dirname, 'src/sass')],
        includePaths: [path.resolve(__dirname, 'src/sass')],
        quietDeps: true,
      },
    },
  },
  build: {
    outDir: path.resolve(themeDir, 'assets'),
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    cssMinify: false,
    sourcemap: false,
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
