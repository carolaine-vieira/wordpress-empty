<?php

class ThemeConfig {

	public function __construct() {
		add_action('after_setup_theme', [$this, 'set_supports'] );
		add_action('after_setup_theme', [$this, 'load_translations'] );
		add_action('wp_enqueue_scripts', [$this, 'load_theme_assets']);
		add_action('enqueue_block_editor_assets', [$this, 'load_block_assets']);
	}

	/*
	* Enqueue scripts and styles
	*/
	public function load_theme_assets() {
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
	}

	/**
	 * Load block assets
	 */
	public function load_block_assets() {
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

	/**
	 * Add theme supports
	 */
	public function set_supports() {
		add_theme_support('title-tag');
		add_theme_support( 'wp-block-styles' );
	}

	/*
	* Load translation files
	*/
	public function load_translations() {
		$textdomain = 'empty';
		load_theme_textdomain( $textdomain, get_stylesheet_directory() . '/languages/');
		load_theme_textdomain( $textdomain, get_template_directory() . '/languages/');
	}

}
