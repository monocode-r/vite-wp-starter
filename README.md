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

スターターはフォントを同梱していません（案件ごとに違うため）。Claude Code で `/font` を実行してください。
指定するまでは `--font-family-base` がシステムフォントのままです。

| モード | コマンド例 | リポジトリ | 転送量 |
|--------|-----------|-----------|--------|
| CDN | `/font "Noto Sans JP" "400,700"` | 0 | 数十KB |
| チャンク | `/font --local "Noto Sans JP" "400,700"` | 約5MB/ウェイト | 数十KB |
| 全グリフ | `/font --full "Noto Sans JP" "400,700"` | 約1MB/ウェイト | 約1MB |

`@font-face` 必須の指定が無ければ CDN、必須なら `--local`（`unicode-range` 分割を持ち帰る方式）。

**WordPress では `--text`（テキストサブセット）を使わないでください。** 投稿・固定ページの本文は
ビルド時に存在しないため、後から追加された文字が表示できなくなります。

## 手動デプロイ（FTPS）

検証環境への反映は `~/.claude/scripts/deploy-ftps.py` で行います。案件ごとに転送スクリプトを書かないでください。

> **クライアントとリポジトリを共有する場合は、この節のスクリプトのパスを消してください。**
> `~/.claude/scripts/deploy-ftps.py` → `deploy-ftps.py`（所在は手元だけに留める）。

### 1. 設定ファイルを置く

リポジトリ直下に `.deploy-ftps.env` を作ります（`.gitignore` 対象）。

```
LOCAL_ROOT=/Users/xxx/dev/{案件}/themes/{THEME_NAME}
REMOTE_ROOT=/demo/wp-content/themes/{THEME_NAME}
MANIFEST=/Users/xxx/dev/{案件}/.deployed.sha1
INCLUDE_DIRS=assets acf-json inc template-parts
INCLUDE_ROOT_PATTERNS=*.php style.css screenshot.png
STAGING_MARKER=demo
USE_FTPS=yes
```

**`INCLUDE_*` は送るものの列挙（ホワイトリスト）です。** 除外リスト方式にしないでください。
作業ディレクトリには `src/` や `node_modules/`、確認用のスクショが混ざっており、
「除外し忘れたものが公開サーバーに出る」事故は取り返しがつきません。

`STAGING_MARKER` は `REMOTE_ROOT` に必ず含まれていなければならない文字列です。
同じ FTP アカウントの直下に本番ディレクトリが同居している構成で、打ち間違いから本番を守ります。
chroot されていて本番がそもそも見えない環境では空にします（未設定の警告は想定どおり）。

資格情報はここに書きません。ホスト・ユーザー・パスワードは `~/.netrc` の1箇所に置きます。
`machine` 行が複数あって別のホストが拾われる場合だけ、`FTP_HOST` で明示します。

### 2. ビルドしてから転送

```bash
pnpm build                                        # themes/{THEME_NAME}/assets/ を更新

python3 ~/.claude/scripts/deploy-ftps.py          # 既定は dry-run（送る対象を数えて表示するだけ）
python3 ~/.claude/scripts/deploy-ftps.py --run    # 実際に転送
```

| オプション | 用途 |
|-----------|------|
| `--run` | 実際に転送する（付けなければ dry-run） |
| `--force-all` | 差分判定を飛ばして全件送る |
| `--extra <path>` | ホワイトリスト外のファイルを1件だけ追加する |
| `--config <path>` | 設定ファイルを明示する（既定はカレントから上へ `.deploy-ftps.env` を探索） |

差分は `MANIFEST`（SHA-1 の一覧）で判定し、転送後はリモートの**バイト数で照合**します。
転送ツールの終了コードは成否の根拠になりません。

### FTP では入らないもの

**DB 側の情報はテーマを上げても反映されません。** 転送後に「効いていない」と見えたら、
コードを疑う前にこの一覧を当ててください。

- 固定ページのテンプレート割当
- オプション（管理画面で入力するサイト共通設定などの値）
- プラグインの有効化状態・投稿データ・タクソノミーの語

これらは検証環境の管理画面で人が入れます。「上げたので反映されているはず」とは扱いません。

## 備考

- PostCSS: `css-declaration-sorter` → `postcss-preset-env`（autoprefixer 内蔵）
  - メディアクエリの統合（`postcss-combine-media-query`）は使いません。全ファイルの
    `@media` を出力末尾へ畳むため、**メディアクエリを持たないモディファイアが
    基底クラスに PC 幅で負ける**（同一詳細度で後勝ち）事故が起きます
- Sass は `sass-embedded`（Vite 6 既定の `modern-compiler` API で動作）
- JS のビルドターゲットは browserslist（iOS 12 / Android 8）に合わせて `es2018` / `safari12`
- WebP は元データから1回だけ変換します（最適化済みラスタから変換すると非可逆エンコードが
  2回かかり、写真やグラデーションに帯が出ます）
- 画像を SCSS や JS から `url()` で参照する場合は、`image-output.config.mjs` を
  `both` か `raster-only` にしてください（`webp-only` は元の JPG/PNG を残しません）
- Prettier: 保存時に自動整形（VSCode + Prettier 拡張機能）
- ACF フィールドグループは `acf-json/` に JSON 同期（バージョン管理可能）
