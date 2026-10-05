import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';

/**
 * テーマ本体の位置を決める。開発環境の置き方は2通りある。
 *
 * - wp-env 配置: <リポジトリ>/themes/<テーマ名>/（リポジトリ自体が開発用の WordPress）
 * - Local 配置: wp-content/themes/_dev/<テーマ名>/ に開発環境、wp-content/themes/<テーマ名>/ にテーマ本体。
 *   既存の WordPress の themes/ を git 管理するとき、サーバーへ上げるテーマに
 *   src/ や node_modules/ を混ぜないため
 *
 * .env はサンドボックスで読めず、loadEnv は例外を出さず空を返す。
 * 既定値に落とすとビルドが別ディレクトリへ黙って出力されるので、位置から決め、決められなければ止める。
 */
export function resolveTheme(projectRoot) {
  const env = loadEnv('', projectRoot, '');
  const isLocalLayout = path.basename(path.dirname(projectRoot)) === '_dev';

  let themeName = env.THEME_NAME;
  let themeDir;

  if (isLocalLayout) {
    themeName ||= path.basename(projectRoot);
    themeDir = path.resolve(projectRoot, '../..', themeName);
  } else {
    const themesRoot = path.resolve(projectRoot, 'themes');
    if (!themeName) {
      const candidates = fs.existsSync(themesRoot)
        ? fs
            .readdirSync(themesRoot, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
        : [];
      if (candidates.length !== 1) {
        throw new Error(
          `[theme] THEME_NAME が読めず、themes/ 直下のテーマを1つに決められません（候補: ${
            candidates.join(', ') || 'なし'
          }）。.env に THEME_NAME を書くか、package.json のスクリプトで渡してください`,
        );
      }
      themeName = candidates[0];
    }
    themeDir = path.resolve(themesRoot, themeName);
  }

  if (!fs.existsSync(path.join(themeDir, 'style.css'))) {
    throw new Error(`[theme] テーマが見つかりません: ${themeDir}（style.css が無い）`);
  }

  return { env, layout: isLocalLayout ? 'local' : 'wp-env', themeName, themeDir };
}
