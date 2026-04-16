/**
 * .env の THEME_NAME を読み取り .wp-env.json を生成する
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const env = loadEnv('', projectRoot, '');
const themeName = env.THEME_NAME || 'my-theme';

const wpEnv = {
  core: null,
  phpVersion: '8.2',
  themes: [`./themes/${themeName}`],
  plugins: [
    'https://downloads.wordpress.org/plugin/advanced-custom-fields.latest-stable.zip',
    'https://downloads.wordpress.org/plugin/wp-multibyte-patch.latest-stable.zip',
    'https://downloads.wordpress.org/plugin/custom-post-type-ui.latest-stable.zip',
    'https://downloads.wordpress.org/plugin/query-monitor.latest-stable.zip',
    'https://downloads.wordpress.org/plugin/duplicate-post.latest-stable.zip',
    'https://downloads.wordpress.org/plugin/contact-form-7.latest-stable.zip',
  ],
  config: {
    WP_DEBUG: true,
    WP_DEBUG_LOG: true,
    SCRIPT_DEBUG: true,
  },
  testsEnvironment: false,
  mappings: {
    'wp-content/uploads': './uploads',
  },
  afterSetup: `wp language core install ja && wp site switch-language ja && wp theme activate ${themeName}`,
};

const outPath = path.join(projectRoot, '.wp-env.json');
fs.writeFileSync(outPath, JSON.stringify(wpEnv, null, 2) + '\n');
console.log(`[generate-wp-env] テーマ: ${themeName} → .wp-env.json を生成しました`);
