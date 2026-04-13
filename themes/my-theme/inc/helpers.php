<?php

/**
 * ヘルパー関数
 *
 * テンプレート内で使用する共通ユーティリティ関数をまとめています。
 *
 * 使用例:
 *   theme_home_url()            // トップページURL
 *   theme_home_url('contact')   // サブページURL
 *   theme_asset('fonts/foo.woff2') // アセットURL（汎用）
 *   theme_image('logo.webp')    // 画像URL
 */

/**
 * ホームURLを取得
 *
 * @param  string $path サブパス（省略可）
 * @return string エスケープ済みURL
 */
function theme_home_url( $path = '' ) {
    return esc_url( home_url( $path ) );
}

/**
 * テーマ内アセットのURLを取得
 *
 * @param  string $path assets/ 以下のパス（例: 'fonts/foo.woff2'）
 * @return string URL文字列
 */
function theme_asset( $path ) {
    return get_template_directory_uri() . '/assets/' . ltrim( $path, '/' );
}

/**
 * テーマ内画像のURLを取得
 *
 * @param  string $filename images/ 以下のファイル名（例: 'logo.webp'）
 * @return string URL文字列
 */
function theme_image( $filename ) {
    return theme_asset( 'images/' . $filename );
}
