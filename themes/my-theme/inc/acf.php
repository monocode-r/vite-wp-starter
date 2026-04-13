<?php

/**
 * ACF JSON 同期
 */

/**
 * ACF フィールドグループの保存先
 */
function theme_acf_json_save_point( $path ) {
    return get_template_directory() . '/acf-json';
}
add_filter( 'acf/settings/save_json', 'theme_acf_json_save_point' );

/**
 * ACF フィールドグループの読み込み先
 */
function theme_acf_json_load_point( $paths ) {
    unset( $paths[0] );
    $paths[] = get_template_directory() . '/acf-json';
    return $paths;
}
add_filter( 'acf/settings/load_json', 'theme_acf_json_load_point' );
