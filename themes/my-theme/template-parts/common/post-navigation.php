<?php
/**
 * 詳細ページ用 前後ナビゲーション
 */
the_post_navigation([
  'prev_text' => '<span class="c-post-nav__label">前の記事</span><span class="c-post-nav__title">%title</span>',
  'next_text' => '<span class="c-post-nav__label">次の記事</span><span class="c-post-nav__title">%title</span>',
  'class'     => 'c-post-nav',
]);
