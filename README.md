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
| `pnpm dev` | wp-env 起動 + Vite 開発サーバー（既定ポート 3000）+ ブラウザで WordPress を開く |
| `pnpm build` | テーマの `assets/` に本番ビルド（CSS・JS・フォント・画像）|
| `pnpm stop` | wp-env 停止 |
| `pnpm wp:destroy` | wp-env 環境の削除（Docker コンテナ・DB を完全削除）|
| `pnpm wp:cli` | WP-CLI コマンドの実行（例: `pnpm wp:cli -- option list`）|
| `pnpm wp:logs` | wp-env のログ表示 |
| `pnpm format` | Prettier でソースコード一括整形 |
| `pnpm lint` | ESLint + Stylelint でコードチェック |
| `pnpm lint:fix` | ESLint + Stylelint 自動修正 |
| `pnpm optimize:images` | `src/images/` → テーマの `assets/images/` を単体で再生成 |

## 環境変数（.env）

| 変数名 | 説明 | 既定値 |
|--------|------|--------|
| `THEME_NAME` | テーマフォルダ名 | `my-theme` |
| `DEV_PORT` | Vite 開発サーバーのポート | `3000` |
| `WP_PORT` | wp-env（WordPress）のポート | `8888` |

`.env` は `.gitignore` 対象です。`.env.example` をコピーして使用してください。

ポートは案件ごとに変えます。既定のままだと複数案件を並行して開いたとき、
**前の案件のサーバーが居残っているポートに繋いで「直したのに反映されない」**が起きます
（`strictPort: true` なので衝突時は起動エラーになりますが、案件ごとに固定するのが確実）。

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
├── images/         … 最適化 + WebP 変換してテーマへ出力（開発・ビルドで同じ経路）
└── fonts/          … ローカルフォント（@font-face 用）
```

## Vite × WordPress 連携の仕組み

開発時 (`pnpm dev`):
1. `generate-wp-env.mjs` が `.env` の `THEME_NAME` / `WP_PORT` を読んで `.wp-env.json` を生成
2. `wp-env start` で WordPress (http://localhost:8888) を起動
3. Vite dev server (http://localhost:3000) を起動し、起動完了後に WordPress をブラウザで開く
4. テーマ直下の `.vite-hot` ファイルに Vite の URL が書き込まれる
5. `inc/vite.php` が `.vite-hot` を検出し、`<head>` に Vite クライアントスクリプトを注入（HMR 有効）
6. PHP テンプレートの保存でブラウザをフルリロード、`src/images/` の変更でテーマへ再出力

WordPress と Vite はオリジンが違うため、`server.origin` を指定しています。
これが無いと CSS 内の `url()` が WordPress 側に解決され、**セルフホストのフォント・画像が
開発時だけ 404 になります**（`font-display: swap` が効くので画面は壊れず気づけない）。

本番ビルド時 (`pnpm build`):
1. Vite が `themes/{THEME_NAME}/assets/` へ CSS・JS・フォントを出力
2. 同じビルドの後処理で `src/images/` を最適化してテーマの `assets/images/` へ出力
3. `inc/vite.php` が `.vite-hot` なしと判断し、ビルド済みアセットを通常 enqueue

画像の経路は開発・ビルド・`pnpm optimize:images` のすべてで
`src/images/` → `assets/images/`（`scripts/lib/image-pipeline.mjs`）に統一しています。
経路が分かれていると WebP 変換の有無やディレクトリ構造が dev と build でズレます。

## フォント設定

Claude Code で `/font` を実行してください。

| モード | コマンド例 | 出力 |
|--------|-----------|------|
| CDN | `/font "Noto Sans JP" "400,700"` | `<link>` タグを表示 |
| ローカル | `/font --local "Noto Sans JP" "400,700"` | woff2 DL + `_font-face.scss` 生成 |

## 自動デプロイ（GitHub Actions）

`main` ブランチへ push すると自動でビルド → FTP デプロイが実行されます。

### 初回セットアップ

GitHub リポジトリの **Settings > Secrets and variables > Actions** に以下を登録してください。

#### Secrets（機密情報）

| 名前 | 値の例 | 説明 |
|------|--------|------|
| `FTP_SERVER` | `sv12345.xserver.jp` | FTP サーバーホスト名 |
| `FTP_USERNAME` | `user@example.com` | FTP ユーザー名 |
| `FTP_PASSWORD` | `••••••••` | FTP パスワード |

#### Variables（非機密情報）

| 名前 | 値の例 | 説明 |
|------|--------|------|
| `THEME_NAME` | `my-theme` | テーマフォルダ名（`.env` の値と合わせる） |
| `FTP_THEME_DIR` | `public_html/wp-content/themes/my-theme/` | サーバー上のテーマパス（末尾 `/` 必須） |

> SFTP（ポート22）を使う場合は `.github/workflows/deploy.yml` の `FTP-Deploy-Action` に `protocol: sftp` を追加してください。

## 備考

- PostCSS: `css-declaration-sorter` → `postcss-preset-env`（autoprefixer 内蔵）
  - メディアクエリの統合（`postcss-combine-media-query`）は使いません。全ファイルの
    `@media` を出力末尾へ畳むため、**メディアクエリを持たないモディファイアが
    基底クラスに PC 幅で負ける**（同一詳細度で後勝ち）事故が起きます
- Sass は `sass-embedded`（Vite 6 既定の `modern-compiler` API で動作）
- JS のビルドターゲットは browserslist（iOS 12 / Android 8）に合わせて `es2018` / `safari12`
- 画像を SCSS や JS から `url()` で参照する場合は、`image-output.config.mjs` を
  `both` か `raster-only` にしてください（`webp-only` は元の JPG/PNG を残しません）
- Prettier: 保存時に自動整形（VSCode + Prettier 拡張機能）
- ACF フィールドグループは `acf-json/` に JSON 同期（バージョン管理可能）
