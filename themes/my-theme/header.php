<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="format-detection" content="telephone=no">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="l-header js-header">
  <div class="l-header__inner l-inner">
    <?php if ( is_front_page() ) : ?>
      <h1 class="l-header__logo"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a></h1>
    <?php else : ?>
      <div class="l-header__logo"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a></div>
    <?php endif; ?>
    <nav class="l-header__nav">
      <?php
      wp_nav_menu( [
          'theme_location' => 'primary',
          'container'      => false,
          'menu_class'     => 'l-header__list',
          'fallback_cb'    => false,
      ] );
      ?>
    </nav>
  </div>
</header>
