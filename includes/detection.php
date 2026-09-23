<?php
/**
 * One-time header detection.
 *
 * When an administrator visits the site, assets/detect.js measures the real page
 * (with the plugin's own styles switched off), finds the header and the elements
 * that paint its background, and stores stable selectors here. It runs once per
 * theme + version and layout (desktop, mobile). Visitors never load it; the
 * frontend only reads the stored result. Manual selectors in the settings win.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const WILLOW_SCROLL_DETECTED = 'willow_scroll_detected';

add_action( 'init', 'willow_scroll_register_detection' );
add_action( 'after_switch_theme', 'willow_scroll_forget_detection' );
add_action( 'wp_enqueue_scripts', 'willow_scroll_enqueue_detection', 20 );

function willow_scroll_theme_key() {
	$theme = wp_get_theme();
	return get_stylesheet() . '@' . $theme->get( 'Version' );
}

function willow_scroll_register_detection() {
	register_setting(
		'willow_scroll',
		WILLOW_SCROLL_DETECTED,
		array(
			'type'              => 'object',
			'default'           => array(),
			'sanitize_callback' => 'willow_scroll_sanitize_detection',
			'show_in_rest'      => array(
				'schema' => array(
					'type'                 => 'object',
					'properties'           => array(
						'theme'      => array( 'type' => 'string' ),
						'header'     => array( 'type' => 'string' ),
						'background'   => array( 'type' => 'string' ),
						'themeSticky'  => array( 'type' => 'boolean' ),
						'themeOverlay' => array( 'type' => 'boolean' ),
						'found'        => array( 'type' => 'boolean' ),
						'colors'       => array(
							'type'                 => 'object',
							'additionalProperties' => array( 'type' => 'string' ),
						),
						'layouts'      => array(
							'type'  => 'array',
							'items' => array(
								'type' => 'string',
								'enum' => array( 'desktop', 'mobile' ),
							),
						),
						'at'           => array( 'type' => 'integer' ),
					),
					'additionalProperties' => false,
				),
			),
		)
	);
}

function willow_scroll_sanitize_detection( $input ) {
	$input = is_array( $input ) ? $input : array();
	if ( empty( $input['theme'] ) ) {
		return array();
	}
	return array(
		'theme'      => sanitize_text_field( $input['theme'] ),
		'header'     => willow_scroll_sanitize_selector( $input['header'] ?? '' ),
		'background'   => willow_scroll_sanitize_selector( $input['background'] ?? '' ),
		'themeSticky'  => ! empty( $input['themeSticky'] ),
		'themeOverlay' => ! empty( $input['themeOverlay'] ),
		'found'        => ! empty( $input['found'] ),
		'colors'       => willow_scroll_sanitize_color_map( $input['colors'] ?? array() ),
		'layouts'      => array_values( array_intersect( array( 'desktop', 'mobile' ), (array) ( $input['layouts'] ?? array() ) ) ),
		'at'           => time(),
	);
}

function willow_scroll_forget_detection() {
	delete_option( WILLOW_SCROLL_DETECTED );
}

/**
 * Stored detection for the active theme, or null when missing or stale.
 */
function willow_scroll_detection() {
	static $cached = false;
	if ( false !== $cached ) {
		return $cached;
	}
	$d      = get_option( WILLOW_SCROLL_DETECTED, array() );
	$cached = ( is_array( $d ) && ! empty( $d['theme'] ) && willow_scroll_theme_key() === $d['theme'] ) ? $d : null;
	return $cached;
}

/**
 * Administrators only, and only while the result for this theme and layout is
 * missing; the script itself exits early when the layout is already known.
 */
function willow_scroll_enqueue_detection() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$stored  = willow_scroll_detection();
	$layouts = $stored['layouts'] ?? array();
	$vars    = willow_scroll_palette_vars();
	$missing = array_diff( $vars, array_keys( $stored['colors'] ?? array() ) );
	if ( $stored && in_array( 'desktop', $layouts, true ) && in_array( 'mobile', $layouts, true ) && ! $missing ) {
		return;
	}
	$settings = willow_scroll_get_settings();
	wp_enqueue_script( 'willow-scroll-detect', WILLOW_SCROLL_URL . 'assets/detect.js', array(), WILLOW_SCROLL_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
	wp_add_inline_script(
		'willow-scroll-detect',
		'window.willowScrollDetect=' . wp_json_encode(
			array(
				'themeKey'   => willow_scroll_theme_key(),
				'detected'   => $stored ? $stored : null,
				'candidates' => array_merge( willow_scroll_header_candidates(), array( '[role="banner"]' ) ),
				'breakpoint' => (int) $settings['mobile_breakpoint'],
				'colorVars'  => $vars,
				'restUrl'    => rest_url( 'wp/v2/settings' ),
				'nonce'      => wp_create_nonce( 'wp_rest' ),
			)
		) . ';',
		'before'
	);
}

/**
 * Elements that usually are the site header, in order of preference.
 */
function willow_scroll_header_candidates() {
	return apply_filters( 'willow_scroll_header_candidates', array( 'header.wp-block-template-part', '#masthead', '.site-header', 'header', '#header' ) );
}

/**
 * { "--var-name": "#hex or rgb()" } read on the frontend; anything else is dropped.
 */
function willow_scroll_sanitize_color_map( $map ) {
	$out = array();
	foreach ( (array) $map as $name => $value ) {
		if ( ! preg_match( '/^--[A-Za-z0-9_-]+$/', (string) $name ) ) {
			continue;
		}
		$color = willow_scroll_sanitize_color( $value, '' );
		if ( '' !== $color ) {
			$out[ $name ] = $color;
		}
	}
	return $out;
}
