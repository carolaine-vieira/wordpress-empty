<?php

/*
* Enqueue scripts and styles
*/
function load_scripts() {
  wp_enqueue_style(
		'theme',
		get_template_directory_uri() . '/dist/index.css',
		[],
		filemtime( get_stylesheet_directory() . '/dist/index.css' ),
		'all'
	);

  wp_enqueue_script(
		'theme',
		get_template_directory_uri() . '/dist/index.js',
		[],
		filemtime( get_stylesheet_directory() . '/dist/index.js' ),
		'all'
	);

	wp_enqueue_style(
		'theme-blocks-styles',
		get_stylesheet_directory_uri() . '/blocks/dist/index.css',
		[],
		filemtime( get_stylesheet_directory() . '/blocks/dist/index.css' )
	);

	wp_enqueue_script(
		'theme-blocks-scripts',
		get_stylesheet_directory_uri() . '/blocks/dist/index.js',
		[ 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 'wp-components', 'wp-api' ],
		filemtime( get_stylesheet_directory() . '/blocks/dist/index.js' ),
		TRUE
	);
}
add_action('wp_enqueue_scripts', 'load_scripts');

if ( !function_exists('theme_setup') ) {
  function theme_setup() {
    /*
    * Load translation files
    */
    $textdomain = 'empty';
    load_theme_textdomain( $textdomain, get_stylesheet_directory() . '/languages/');
    load_theme_textdomain( $textdomain, get_template_directory() . '/languages/');

    /*
    * Add title in the head
    */
    add_theme_support('title-tag');

		add_theme_support( 'wp-block-styles' );
  }
  add_action( 'after_setup_theme', 'theme_setup' );
}
