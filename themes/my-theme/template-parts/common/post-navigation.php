<?php
/**
 * 詳細ページ用 前後ナビゲーション
 */
the_post_navigation([
  'prev_text' => '<span class="nav-label">前の記事</span><span class="nav-title">%title</span>',
  'next_text' => '<span class="nav-label">次の記事</span><span class="nav-title">%title</span>',
  'class'     => 'c-post-nav',
]);
