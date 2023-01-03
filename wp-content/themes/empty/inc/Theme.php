<?php

/*
* Enqueue scripts and styles
*/
function load_scripts() {
  wp_enqueue_style('theme', get_template_directory_uri().'/dist/index.css', array(), '1.0', 'all');
  wp_enqueue_script('theme', get_template_directory_uri().'/dist/index.js', array(), '1.0', 'all');
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
  }
  add_action( 'after_setup_theme', 'theme_setup' );
}
