<?php
/**
 * 一覧ページ用 数字ページネーション
 */
the_posts_pagination([
  'mid_size'           => 2,
  'prev_text'          => '&laquo;',
  'next_text'          => '&raquo;',
  'screen_reader_text' => ' ',
  'class'              => 'c-pagination',
]);
