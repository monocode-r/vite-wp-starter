<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
  <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
  <time datetime="<?php echo get_the_date( 'Y-m-d' ); ?>"><?php echo get_the_date(); ?></time>
  <div>
    <?php the_excerpt(); ?>
  </div>
</article>
