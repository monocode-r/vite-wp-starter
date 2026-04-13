<?php

/**
 * テーマセットアップ
 */

function theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', [
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ] );
    add_theme_support( 'editor-styles' );

    register_nav_menus( [
        'primary' => 'メインメニュー',
        'footer'  => 'フッターメニュー',
    ] );
}
add_action( 'after_setup_theme', 'theme_setup' );

function theme_widgets_init() {
    register_sidebar( [
        'name'          => 'サイドバー',
        'id'            => 'sidebar-1',
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget__title">',
        'after_title'   => '</h3>',
    ] );
}
add_action( 'widgets_init', 'theme_widgets_init' );
