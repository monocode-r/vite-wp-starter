# WordPress テーマ（Vite + FLOCSS）

## 動作環境の目安

- Node.js 18 以上
- [pnpm](https://pnpm.io/) 9 系（`packageManager` フィールドに準拠）
- Docker Desktop（`@wordpress/env` で WordPress をローカル起動するために必要）

## 初期設定

```bash
# 1. 依存パッケージをインストール
pnpm install

# 2. テーマ名を設定（.env.example をコピーして編集）
cp .env.example .env
# THEME_NAME=my-theme  ← 実際のテーマフォルダ名に変更

# 3. themes/ 配下にテーマフォルダを配置
#    例: themes/my-theme/

# 4. 開発サーバー起動（wp-env + Vite を同時起動）
pnpm dev
```

## コマンド

| コマンド | 説明 |
|-----------|------|
| `pnpm dev` | wp-env 起動 + Vite 開発サーバー（ポート 3000）|
| `pnpm build` | テーマの `assets/` に本番ビルド + 画像最適化 |
| `pnpm stop` | wp-env 停止 |
| `pnpm wp:destroy` | wp-env 環境の削除（Docker コンテナ・DB を完全削除）|
| `pnpm wp:cli` | WP-CLI コマンドの実行（例: `pnpm wp:cli -- option list`）|
| `pnpm wp:logs` | wp-env のログ表示 |
| `pnpm format` | Prettier でソースコード一括整形 |
| `pnpm lint` | ESLint + Stylelint でコードチェック |
| `pnpm lint:fix` | ESLint + Stylelint 自動修正 |
| `pnpm optimize:images` | `themes/{THEME_NAME}/assets/images/` 内の画像のみ再最適化 |

## 環境変数（.env）

| 変数名 | 説明 | 既定値 |
|--------|------|--------|
| `THEME_NAME` | テーマフォルダ名 | `my-theme` |

`.env` は `.gitignore` 対象です。`.env.example` をコピーして使用してください。

## ディレクトリ構成

```
themes/
└── {THEME_NAME}/           … WordPressテーマ本体（PHP テンプレート群）
    ├── assets/             … Vite ビルド出力（gitignore 対象）
    │   ├── css/styles.css
    │   ├── js/main.js
    │   ├── images/
    │   └── fonts/
    ├── acf-json/           … ACF フィールドグループ JSON 同期先
    ├── functions.php       … Vite アセット読み込み・テーマ設定
    └── *.php               … テンプレートファイル

src/
├── sass/           … FLOCSS 構成（glob import 対応）
├── js/             … main.js → script.js → modules/
├── images/         … ビルド時に最適化 + WebP 変換、開発時はテーマへコピー
└── fonts/          … ローカルフォント（@font-face 用）
```

## Vite × WordPress 連携の仕組み

開発時 (`pnpm dev`):
1. `generate-wp-env.mjs` が `.env` の `THEME_NAME` を読んで `.wp-env.json` を生成
2. `wp-env start` で WordPress (http://localhost:8888) を起動
3. Vite dev server (http://localhost:3000) を起動
4. テーマの `assets/hot` ファイルに Vite の URL が書き込まれる
5. `functions.php` が `hot` ファイルを検出し、`<head>` に Vite クライアントスクリプトを注入（HMR 有効）

本番ビルド時 (`pnpm build`):
1. Vite が `themes/{THEME_NAME}/assets/` へ CSS・JS・フォントを出力
2. `optimize-images.mjs` が画像を最適化して同ディレクトリへ出力
3. `functions.php` が `hot` ファイルなしと判断し、ビルド済みアセットを通常 enqueue

## フォント設定

Claude Code で `/font` を実行してください。

| モード | コマンド例 | 出力 |
|--------|-----------|------|
| CDN | `/font "Noto Sans JP" "400,700"` | `<link>` タグを表示 |
| ローカル | `/font --local "Noto Sans JP" "400,700"` | woff2 DL + `_font-face.scss` 生成 |

## 備考

- PostCSS: `postcss-combine-media-query` → `css-declaration-sorter` → `postcss-preset-env` → `autoprefixer`
- Prettier: 保存時に自動整形（VSCode + Prettier 拡張機能）
- ACF フィールドグループは `acf-json/` に JSON 同期（バージョン管理可能）
