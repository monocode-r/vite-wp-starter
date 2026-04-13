<?php

/**
 * Theme functions and definitions
 *
 * inc/ ディレクトリの各ファイルに機能を分割しています。
 *
 * inc/vite.php    - Vite アセット読み込み
 * inc/setup.php   - テーマセットアップ・メニュー・ウィジェット
 * inc/acf.php     - ACF JSON 同期
 * inc/helpers.php - ヘルパー関数（theme_home_url, theme_asset, theme_image）
 */

require_once get_template_directory() . '/inc/helpers.php';
require_once get_template_directory() . '/inc/setup.php';
require_once get_template_directory() . '/inc/vite.php';
require_once get_template_directory() . '/inc/acf.php';
