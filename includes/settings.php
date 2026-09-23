<?php
/**
 * Global settings: REST-registered option + React settings page.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', 'willow_scroll_register_settings' );
add_action( 'admin_menu', 'willow_scroll_add_menu' );
add_action( 'admin_enqueue_scripts', 'willow_scroll_settings_assets' );
add_filter( 'plugin_action_links_' . plugin_basename( WILLOW_SCROLL_FILE ), 'willow_scroll_action_links' );

function willow_scroll_register_settings() {
	register_setting(
		'willow_scroll',
		'willow_scroll_settings',
		array(
			'type'              => 'object',
			'default'           => willow_scroll_defaults(),
			'sanitize_callback' => 'willow_scroll_sanitize_settings',
			'show_in_rest'      => array( 'schema' => willow_scroll_rest_schema() ),
		)
	);
	register_setting(
		'willow_scroll',
		'willow_scroll_templates',
		array(
			'type'              => 'object',
			'default'           => array(),
			'sanitize_callback' => 'willow_scroll_sanitize_templates',
			'show_in_rest'      => array(
				'schema' => array(
					'type'                 => 'object',
					'additionalProperties' => willow_scroll_page_rest_schema(),
				),
			),
		)
	);
}

function willow_scroll_add_menu() {
	add_options_page(
		__( 'Willow Scroll', 'willow-scroll' ),
		__( 'Willow Scroll', 'willow-scroll' ),
		'manage_options',
		'willow-scroll',
		'willow_scroll_render_page'
	);
}

function willow_scroll_action_links( $links ) {
	array_unshift(
		$links,
		sprintf( '<a href="%s">%s</a>', esc_url( admin_url( 'options-general.php?page=willow-scroll' ) ), esc_html__( 'Settings', 'willow-scroll' ) )
	);
	return $links;
}

function willow_scroll_render_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	// The real page heading; admin notices are placed after it, outside the React app.
	printf(
		'<div class="wrap"><h1 class="screen-reader-text">%s</h1><div id="willow-scroll-settings"></div></div>',
		esc_html__( 'Willow Scroll', 'willow-scroll' )
	);
}

function willow_scroll_register_controls_script() {
	if ( wp_script_is( 'willow-scroll-controls', 'registered' ) ) {
		return;
	}
	wp_register_script(
		'willow-scroll-controls',
		WILLOW_SCROLL_URL . 'assets/admin/controls.js',
		array( 'wp-element', 'wp-components', 'wp-i18n', 'wp-data', 'wp-core-data', 'wp-media-utils' ),
		WILLOW_SCROLL_VERSION,
		true
	);
	wp_add_inline_script(
		'willow-scroll-controls',
		'window.willowScrollData = ' . wp_json_encode(
			array(
				'schema'  => willow_scroll_client_schema(),
				'global'  => willow_scroll_get_settings(),
				'palette'   => willow_scroll_theme_palette(),
				'gradients' => willow_scroll_theme_gradients(),
				'sttIcons'  => willow_scroll_stt_icons(),
			)
		) . ';',
		'before'
	);
	wp_set_script_translations( 'willow-scroll-controls', 'willow-scroll' );
}

function willow_scroll_settings_assets( $hook ) {
	if ( 'settings_page_willow-scroll' !== $hook ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_style( 'wp-components' );
	willow_scroll_register_controls_script();

	wp_enqueue_script(
		'willow-scroll-settings',
		WILLOW_SCROLL_URL . 'assets/admin/settings.js',
		array( 'willow-scroll-controls', 'wp-api-fetch', 'wp-data', 'wp-notices', 'wp-media-utils' ),
		WILLOW_SCROLL_VERSION,
		true
	);
	wp_add_inline_script(
		'willow-scroll-settings',
		'window.willowScrollSettings = ' . wp_json_encode(
			array(
				'homeUrl'      => home_url( '/' ),
				'themeKey'     => willow_scroll_theme_key(),
				'themeName'    => wp_get_theme()->get( 'Name' ),
				'detected'     => (object) get_option( WILLOW_SCROLL_DETECTED, array() ),
				'candidates'   => willow_scroll_header_candidates(),
				'version'      => WILLOW_SCROLL_VERSION,
				'themeColors'  => willow_scroll_theme_colors(),
				'isBlockTheme' => wp_is_block_theme(),
				'templates'   => willow_scroll_template_targets(),
				'overrides'   => (object) willow_scroll_get_templates_overrides(),
			)
		) . ';',
		'before'
	);
	wp_set_script_translations( 'willow-scroll-settings', 'willow-scroll' );

	wp_enqueue_style( 'willow-scroll-admin', WILLOW_SCROLL_URL . 'assets/admin/admin.css', array( 'wp-components' ), WILLOW_SCROLL_VERSION );
}
