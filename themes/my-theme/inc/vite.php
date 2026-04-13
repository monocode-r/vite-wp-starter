<?php

/**
 * Vite アセット読み込み
 */

/**
 * Vite 開発サーバーの URL を取得（起動中なら URL、停止中なら false）
 */
function theme_vite_dev_url() {
    $hot_file = get_template_directory() . '/assets/hot';
    if ( file_exists( $hot_file ) ) {
        return trim( file_get_contents( $hot_file ) );
    }
    return false;
}

/**
 * CSS / JS の読み込み
 */
function theme_enqueue_assets() {
    $dev_url   = theme_vite_dev_url();
    $theme_uri = get_template_directory_uri();
    $theme_dir = get_template_directory();

    if ( $dev_url ) {
        // 開発モード: Vite dev server から読み込み（CSS は HMR で JS 経由注入）
        return;
    }

    // 本番モード: ビルド済みアセットを読み込み
    $css_path = '/assets/css/styles.css';
    if ( file_exists( $theme_dir . $css_path ) ) {
        wp_enqueue_style(
            'theme-style',
            $theme_uri . $css_path,
            [],
            filemtime( $theme_dir . $css_path )
        );
    }

    $js_path = '/assets/js/main.js';
    if ( file_exists( $theme_dir . $js_path ) ) {
        wp_enqueue_script(
            'theme-main',
            $theme_uri . $js_path,
            [],
            filemtime( $theme_dir . $js_path ),
            true
        );
    }
}
add_action( 'wp_enqueue_scripts', 'theme_enqueue_assets' );

/**
 * Vite 開発モード時に <head> へ dev server スクリプトを出力
 */
function theme_vite_dev_head() {
    $dev_url = theme_vite_dev_url();
    if ( ! $dev_url ) {
        return;
    }
    echo '<script type="module" src="' . esc_url( $dev_url . '/@vite/client' ) . '"></script>' . "\n";
    echo '<script type="module" src="' . esc_url( $dev_url . '/src/js/main.js' ) . '"></script>' . "\n";
}
add_action( 'wp_head', 'theme_vite_dev_head' );

/**
 * 本番 JS に type="module" を付与
 */
function theme_script_module_type( $tag, $handle, $src ) {
    if ( $handle === 'theme-main' ) {
        return '<script type="module" src="' . esc_url( $src ) . '"></script>' . "\n";
    }
    return $tag;
}
add_filter( 'script_loader_tag', 'theme_script_module_type', 10, 3 );
