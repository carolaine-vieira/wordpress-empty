<?php

class Theme
{
	public function __construct()
	{
		add_action('admin_enqueue_scripts', [&$this, 'enqueue_theme_styles']);
		add_action('wp_enqueue_scripts', [&$this, 'enqueue_theme_assets']);
		add_action('enqueue_block_assets', [&$this, 'enqueue_block_assets']);
	}

	/**
	 * enqueue_theme_styles
	 *
	 * @return void
	 */
	public function enqueue_theme_styles()
	{
		wp_enqueue_style(
			'caboverde-theme-styles',
			get_stylesheet_directory_uri() . '/dist/theme.css',
			[],
			filemtime(get_stylesheet_directory() . '/dist/theme.css')
		);
	}

	/**
	 * enqueue_theme_scripts
	 *
	 * @return void
	 */
	public function enqueue_theme_scripts()
	{
		wp_enqueue_script(
			'caboverde-theme-scripts',
			get_stylesheet_directory_uri() . '/dist/theme.js',
			[],
			filemtime(get_stylesheet_directory() . '/dist/theme.js'),
			true
		);
	}

	/**
	 * enqueue_theme_assets
	 *
	 * @return void
	 */
	public function enqueue_theme_assets()
	{
		$this->enqueue_theme_styles();
		$this->enqueue_theme_scripts();
	}

	/**
	 * enqueue_block_assets
	 *
	 * @return void
	 */
	public function enqueue_block_assets()
	{
		wp_enqueue_style(
			'caboverde-block-styles',
			get_stylesheet_directory_uri() . '/dist/block.css',
			[],
			filemtime(get_stylesheet_directory() . '/dist/block.css')
		);

		wp_enqueue_script(
			'caboverde-block-scripts',
			get_stylesheet_directory_uri() . '/dist/block.js',
			['wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 'wp-components', 'wp-api'],
			filemtime(get_stylesheet_directory() . '/dist/block.js'),
			TRUE
		);
	}
}
