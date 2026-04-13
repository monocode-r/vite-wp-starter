// ============================================================
// モジュール自動読み込み
//
// src/js/modules/ 内のモジュールを自動で読み込みます。
// 各モジュールは以下の形式で書いてください：
//
//   export class MyModule {
//     static selector = '.js-my-module';  // HTMLにこの要素があれば初期化
//     static init() { ... }
//   }
//
// - selector が定義されている → HTML内に該当要素がある場合のみ init() を実行
// - selector が未定義 → 常に init() を実行
// - ファイルを追加/削除するだけで自動反映（このファイルの編集不要）
// ============================================================

const moduleFiles = import.meta.glob('./modules/*.js', { eager: true });

function bootstrap() {
  for (const [path, mod] of Object.entries(moduleFiles)) {
    // ファイル内の全エクスポートを走査
    for (const exported of Object.values(mod)) {
      if (typeof exported?.init !== 'function') continue;

      // selector が定義されていれば、要素の存在をチェック
      if (exported.selector) {
        if (!document.querySelector(exported.selector)) continue;
      }

      exported.init();
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
