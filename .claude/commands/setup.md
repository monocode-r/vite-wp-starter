# プロジェクト初期設定

このViteテンプレートの初期設定を対話形式で進めます。
以下のステップを順番にユーザーに質問し、回答に基づいてファイルを更新してください。

---

## Step 1: プロジェクト情報

ユーザーに以下を質問してください（わからない項目はスキップ可）：

- サイト名（`<title>`タグ）
- サイトURL
- ディスクリプション
- OGP画像URL（あれば）

回答に基づいて `src/html/index.html` の `<title>`, `<meta>`, OGPタグを更新してください。

---

## Step 2: デザインアプローチ

ユーザーに質問してください：

> デザインアプローチを選んでください：
> 1. モバイルファースト（デフォルト）
> 2. デスクトップファースト

回答に基づいて `src/sass/global/_setting.scss` の `$design-approach` を更新してください。

---

## Step 3: デザイン設定

ユーザーに現在のデフォルト値を見せて、変更が必要か質問してください：

```
現在の設定:
- インナー幅: 1200px
- 余白（PC）: 25px
- 余白（SP）: 20px
- テキスト色: #333
- ブレークポイント: sm:500 / md:768 / lg:1024 / xl:1440
```

> 変更したい項目があれば教えてください（例: インナー幅 1100px, 余白PC 40px）
> なければ「OK」でスキップ

回答に基づいて `src/sass/global/_setting.scss` を更新してください。

---

## Step 4: フォント設定

ユーザーに質問してください：

> フォントの読み込み方式を選んでください：
> 1. CDN（Google Fonts `<link>`タグ） ← 推奨
> 2. ローカル（@font-face でセルフホスト）
>
> ※ 制作会社ルールで @font-face 必須の場合は 2 を選択

方式が決まったら、使用するフォントを質問してください。
fonts-list.txt の一覧を表示し、番号とウェイトを入力してもらいます。
複数フォント指定可能です（例: 日本語ゴシック + 欧文サンセリフ）。

### CDNの場合:
- `src/html/index.html` の `<head>` に `<link>` タグを追加
- `src/sass/global/_setting.scss` の `$font-main` を更新
- `src/sass/foundation/_font-face.scss` は空にする
- `src/fonts/` ディレクトリ内のフォントファイルを削除

### ローカルの場合:
- `bash ~/.claude/scripts/download-fonts.sh --local "フォント名" "ウェイト"` を実行
- `src/sass/global/_setting.scss` の `$font-main` を更新
- 既存の `src/fonts/` 内の不要フォントを削除

`$font-main` のフォールバック指定:
- ゴシック系: `"フォント名", "欧文フォント名", sans-serif`
- 明朝系: `"フォント名", "欧文フォント名", serif`

---

## Step 5: テストファイルのクリーンアップ

テンプレートに含まれるテスト用ファイルを削除するか質問してください：

> テスト用ファイルを削除してクリーンな状態にしますか？（Y/n）

Yの場合、以下を実行:
- `src/html/index.html` の `<body>` 内のテストコンテンツを削除し、空の状態にする（`<script>` タグは残す）
- `src/sass/object/project/_p-test.scss`, `_p-test2.scss`, `_p-test3.scss` を削除
- `src/sass/object/component/_c-btn.scss` の中身を空にする（ファイルは残す）
- `src/images/test.jpg` を削除

---

## Step 6: 完了

設定内容のサマリーを表示してください：

```
=== 初期設定完了 ===

サイト名: ○○○
デザイン: モバイルファースト
インナー幅: 1200px
フォント: Noto Sans JP + Montserrat（CDN）
テストファイル: 削除済み

次のステップ:
  pnpm install   ← 未実行の場合
  pnpm dev       ← 開発サーバー起動
```

---

## 注意事項

- 各ステップでユーザーの回答を待ってから次に進むこと
- 「スキップ」「OK」「デフォルトで」と言われたらデフォルト値のまま次へ
- ファイル編集前に必ず該当ファイルを読み込むこと
- フォントのダウンロードは `~/.claude/scripts/download-fonts.sh` を使用すること
