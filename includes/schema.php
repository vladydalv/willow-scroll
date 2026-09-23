<?php
/**
 * Single source of truth for every setting: type, default, limits.
 * Defaults, sanitization, REST schema and per-page schema are derived from here.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function willow_scroll_schema() {
	static $schema = null;
	if ( null !== $schema ) {
		return $schema;
	}

	$easing = array( 'ease', 'ease-in-out', 'ease-in', 'ease-out', 'linear' );

	$schema = array(
		// Header.
		'selector'              => array( 'type' => 'selector', 'default' => '' ),
		// Header type: transparent (overlay) or regular (flow), sticky or not.
		'header_mode'           => array( 'type' => 'enum', 'default' => 'flow', 'enum' => array( 'flow', 'overlay' ) ),
		'sticky'                => array( 'type' => 'bool', 'default' => true ),
		'scroll_behavior'       => array( 'type' => 'enum', 'default' => 'smart', 'enum' => array( 'smart', 'always', 'hide' ) ),
		'hide_after'            => array( 'type' => 'int', 'default' => 0, 'min' => 0, 'max' => 5000 ),
		'scroll_tolerance'      => array( 'type' => 'int', 'default' => 5, 'min' => 0, 'max' => 50 ),
		'scrolled_offset'       => array( 'type' => 'int', 'default' => 0, 'min' => 0, 'max' => 2000 ),
		'disable_on_mobile'     => array( 'type' => 'bool', 'default' => false ),
		'mobile_breakpoint'     => array( 'type' => 'int', 'default' => 768, 'min' => 320, 'max' => 1600 ),
		'z_index'               => array( 'type' => 'int', 'default' => 1000, 'min' => 1, 'max' => 99999 ),
		'transition_duration'   => array( 'type' => 'int', 'default' => 300, 'min' => 0, 'max' => 2000 ),
		'transition_easing'     => array( 'type' => 'enum', 'default' => 'ease', 'enum' => $easing ),

		// Background: at the top (optional) and when scrolled (color, blur, shadow).
		// Regular header at the top: color or gradient, '' keeps the theme's background.
		'regular_bg'            => array( 'type' => 'background', 'default' => '' ),
		// Sticky header: color or gradient, blur, shadow.
		'scrolled_bg_enabled'   => array( 'type' => 'bool', 'default' => true ),
		'scrolled_bg'           => array( 'type' => 'background', 'default' => 'rgba(255,255,255,0.8)' ),
		'blur'                  => array( 'type' => 'int', 'default' => 20, 'min' => 0, 'max' => 60 ),
		'shadow_enabled'        => array( 'type' => 'bool', 'default' => true ),
		'shadow_color'          => array( 'type' => 'color', 'default' => 'rgba(0,0,0,0.1)' ),
		'shadow_y'              => array( 'type' => 'int', 'default' => 4, 'min' => 0, 'max' => 50 ),
		'shadow_blur'           => array( 'type' => 'int', 'default' => 30, 'min' => 0, 'max' => 100 ),
		// A hairline at the bottom of the sticky header, instead of or next to the shadow.
		'line_enabled'          => array( 'type' => 'bool', 'default' => false ),
		'line_color'            => array( 'type' => 'color', 'default' => 'rgba(0,0,0,0.08)' ),
		'line_width'            => array( 'type' => 'int', 'default' => 1, 'min' => 1, 'max' => 30 ),
		// Floating: the sticky header leaves the screen edges and gets rounded corners.
		'float_enabled'         => array( 'type' => 'bool', 'default' => false ),
		'float_inset_x'         => array( 'type' => 'int', 'default' => 12, 'min' => 0, 'max' => 150 ),
		'float_inset_y'         => array( 'type' => 'int', 'default' => 12, 'min' => 0, 'max' => 150 ),
		'float_radius'          => array( 'type' => 'int', 'default' => 16, 'min' => 0, 'max' => 100 ),
		'float_corners'         => array( 'type' => 'bool', 'default' => false ),
		'float_radius_tl'       => array( 'type' => 'int', 'default' => 16, 'min' => 0, 'max' => 100 ),
		'float_radius_tr'       => array( 'type' => 'int', 'default' => 16, 'min' => 0, 'max' => 100 ),
		'float_radius_br'       => array( 'type' => 'int', 'default' => 16, 'min' => 0, 'max' => 100 ),
		'float_radius_bl'       => array( 'type' => 'int', 'default' => 16, 'min' => 0, 'max' => 100 ),
		'background_selector'   => array( 'type' => 'selector', 'default' => '' ),

		// Shrink.
		'shrink_enabled'        => array( 'type' => 'bool', 'default' => false ),
		// Height of the sticky header; never below what its logo and menu need.
		'shrink_height'         => array( 'type' => 'int', 'default' => 64, 'min' => 30, 'max' => 200 ),

		// Progress bar.
		'progress_bar'          => array( 'type' => 'bool', 'default' => false ),
		'progress_bar_color'    => array( 'type' => 'color', 'default' => '#2563eb' ),
		'progress_bar_height'   => array( 'type' => 'int', 'default' => 3, 'min' => 1, 'max' => 10 ),
		'progress_bar_position' => array( 'type' => 'enum', 'default' => 'top', 'enum' => array( 'top', 'bottom' ) ),

		// Scroll to top.
		'stt_enabled'           => array( 'type' => 'bool', 'default' => false ),
		'stt_offset'            => array( 'type' => 'int', 'default' => 300, 'min' => 0, 'max' => 5000 ),
		'stt_bg_color'          => array( 'type' => 'color', 'default' => 'rgba(51,51,51,1)' ),
		'stt_icon_color'        => array( 'type' => 'color', 'default' => '#ffffff' ),
		'stt_icon_size'         => array( 'type' => 'int', 'default' => 24, 'min' => 12, 'max' => 60 ),
		'stt_padding'           => array( 'type' => 'int', 'default' => 13, 'min' => 4, 'max' => 40 ),
		'stt_radius_px'         => array( 'type' => 'int', 'default' => 50, 'min' => 0, 'max' => 100 ),
		'stt_icon_style'        => array( 'type' => 'enum', 'default' => 'chevron', 'enum' => array_keys( willow_scroll_stt_icons() ) ),
		'stt_hover'             => array( 'type' => 'enum', 'default' => 'lift', 'enum' => array( 'none', 'lift', 'grow' ) ),
		'stt_bg_hover_color'    => array( 'type' => 'color', 'default' => 'rgba(17,17,17,1)' ),
		'stt_icon_hover_color'  => array( 'type' => 'color', 'default' => '#ffffff' ),
		'stt_position'          => array( 'type' => 'enum', 'default' => 'right', 'enum' => array( 'left', 'right' ) ),
		'stt_inset_x'           => array( 'type' => 'int', 'default' => 30, 'min' => 0, 'max' => 200 ),
		'stt_inset_y'           => array( 'type' => 'int', 'default' => 30, 'min' => 0, 'max' => 200 ),

		// Custom scrollbar.
		'csb_enabled'           => array( 'type' => 'bool', 'default' => false ),
		'csb_width'             => array( 'type' => 'int', 'default' => 10, 'min' => 2, 'max' => 30 ),
		'csb_track_color'       => array( 'type' => 'color', 'default' => 'rgba(240,240,240,1)' ),
		'csb_thumb_color'       => array( 'type' => 'color', 'default' => 'rgba(180,180,180,1)' ),
		'csb_thumb_hover_color' => array( 'type' => 'color', 'default' => 'rgba(130,130,130,1)' ),
		'csb_border_radius'     => array( 'type' => 'int', 'default' => 5, 'min' => 0, 'max' => 20 ),
		'csb_thumb_border'      => array( 'type' => 'int', 'default' => 2, 'min' => 0, 'max' => 10 ),
		'csb_thumb_border_color' => array( 'type' => 'color', 'default' => 'rgba(240,240,240,1)' ),
		'csb_skip_mobile'       => array( 'type' => 'bool', 'default' => true ),

		// Logo.
		// Logo per header look; 0 keeps the site logo.
		'logo_regular_id'       => array( 'type' => 'int', 'default' => 0, 'min' => 0, 'max' => PHP_INT_MAX ),
		'logo_transparent_id'   => array( 'type' => 'int', 'default' => 0, 'min' => 0, 'max' => PHP_INT_MAX ),
		'logo_sticky_id'        => array( 'type' => 'int', 'default' => 0, 'min' => 0, 'max' => PHP_INT_MAX ),
		'logo_resize'           => array( 'type' => 'bool', 'default' => false ),
		'logo_height_default'   => array( 'type' => 'int', 'default' => 60, 'min' => 10, 'max' => 300 ),
		'logo_height_scrolled'  => array( 'type' => 'int', 'default' => 40, 'min' => 10, 'max' => 300 ),
	);

	return $schema;
}

/**
 * Keys that can be overridden per page (besides the disabled/override flags).
 */
/**
 * What a page or template can change: the header type, and the background
 * and logo that belong to the transparent and the sticky look.
 */
function willow_scroll_page_keys() {
	return array(
		'header_mode', 'sticky',
		'regular_bg', 'logo_regular_id',
		'logo_transparent_id',
		'scrolled_bg', 'logo_sticky_id',
	);
}

function willow_scroll_defaults() {
	return wp_list_pluck( willow_scroll_schema(), 'default' );
}

function willow_scroll_get_settings() {
	$saved    = get_option( 'willow_scroll_settings', array() );
	$defaults = willow_scroll_defaults();
	// Only keys of the current schema: settings removed in an update must not
	// reach the settings page, where the REST schema would reject them.
	return array_intersect_key( wp_parse_args( is_array( $saved ) ? $saved : array(), $defaults ), $defaults );
}

function willow_scroll_sanitize_value( $key, $value ) {
	$schema = willow_scroll_schema();
	if ( ! isset( $schema[ $key ] ) ) {
		return null;
	}
	$def = $schema[ $key ];

	switch ( $def['type'] ) {
		case 'bool':
			return (bool) rest_sanitize_boolean( $value );
		case 'int':
			$int = is_numeric( $value ) ? (int) $value : $def['default'];
			return max( $def['min'], min( $def['max'], $int ) );
		case 'enum':
			if ( 'header_mode' === $key && in_array( $value, array( 'sticky', 'fixed' ), true ) ) {
				return 'flow'; // 2.0.0 values.
			}
			return in_array( $value, $def['enum'], true ) ? $value : $def['default'];
		case 'color':
			return willow_scroll_sanitize_color( $value, $def['default'] );
		case 'background':
			return willow_scroll_sanitize_background( $value, $def['default'] );
		case 'selector':
			return willow_scroll_sanitize_selector( $value );
	}
	return $def['default'];
}

function willow_scroll_sanitize_settings( $input ) {
	$input = is_array( $input ) ? $input : array();
	$clean = array();
	foreach ( willow_scroll_schema() as $key => $def ) {
		$clean[ $key ] = array_key_exists( $key, $input )
			? willow_scroll_sanitize_value( $key, $input[ $key ] )
			: $def['default'];
	}
	return $clean;
}

/**
 * Maps the 1.x–2.2 background model (glass + color change) to the current one.
 * Used for settings, page meta and template overrides.
 */
function willow_scroll_map_legacy_background( array $in ) {
	$has_glass = array_key_exists( 'glass_enabled', $in );
	$has_cc    = array_key_exists( 'color_change_enabled', $in );
	if ( ! $has_glass && ! $has_cc ) {
		return willow_scroll_map_legacy_v5( $in );
	}
	$glass = $has_glass ? ! empty( $in['glass_enabled'] ) : null;
	$cc    = $has_cc ? ! empty( $in['color_change_enabled'] ) : null;

	if ( true === $cc ) {
		$in['top_bg_enabled']      = true;
		$in['top_bg_color']        = $in['initial_bg_color'] ?? null;
		$in['scrolled_bg_enabled'] = true;
	} else {
		if ( false === $cc ) {
			$in['top_bg_enabled'] = false;
		}
		if ( null !== $glass ) {
			$in['scrolled_bg_enabled'] = $glass;
			if ( $glass && isset( $in['glass_bg_color'] ) ) {
				$in['scrolled_bg_color'] = $in['glass_bg_color'];
			} elseif ( ! $glass ) {
				unset( $in['scrolled_bg_color'] );
			}
		}
	}
	if ( null !== $glass && array_key_exists( 'glass_blur', $in ) ) {
		$in['blur']           = $glass ? $in['glass_blur'] : 0;
		$in['shadow_enabled'] = $glass && ! empty( $in['glass_shadow'] );
		foreach ( array( 'glass_shadow_color' => 'shadow_color', 'glass_shadow_y' => 'shadow_y', 'glass_shadow_blur' => 'shadow_blur' ) as $from => $to ) {
			if ( isset( $in[ $from ] ) ) {
				$in[ $to ] = $in[ $from ];
			}
		}
	}
	foreach ( array( 'glass_enabled', 'glass_bg_color', 'glass_blur', 'glass_shadow', 'glass_shadow_color', 'glass_shadow_y', 'glass_shadow_blur', 'color_change_enabled', 'initial_bg_color' ) as $old ) {
		unset( $in[ $old ] );
	}
	return willow_scroll_map_legacy_v5(
		array_filter(
			$in,
			function ( $v ) {
				return null !== $v;
			}
		)
	);
}

/**
 * 2.3–2.4 → 2.5: "At the top" color becomes the transparent header,
 * scrolled color becomes the sticky background, one scrolled logo becomes the sticky logo.
 */
function willow_scroll_map_legacy_v5( array $in ) {
	if ( array_key_exists( 'top_bg_enabled', $in ) ) {
		if ( ! empty( $in['top_bg_enabled'] ) ) {
			$alpha = willow_scroll_color_alpha( $in['top_bg_color'] ?? 'rgba(0,0,0,0)' );
			if ( $alpha < 1 ) {
				$in['header_mode'] = 'overlay';
			}
		}
	}
	if ( array_key_exists( 'scrolled_bg_color', $in ) && ! array_key_exists( 'scrolled_bg', $in ) ) {
		$in['scrolled_bg'] = $in['scrolled_bg_color'];
	}
	if ( ! empty( $in['logo_scrolled_id'] ) && empty( $in['logo_sticky_id'] ) ) {
		$in['logo_sticky_id'] = $in['logo_scrolled_id'];
	}
	unset( $in['top_bg_enabled'], $in['top_bg_color'], $in['scrolled_bg_color'], $in['logo_scrolled_id'] );
	return $in;
}

function willow_scroll_color_alpha( $color ) {
	$color = strtolower( trim( (string) $color ) );
	if ( '' === $color || 'transparent' === $color ) {
		return 0;
	}
	if ( preg_match( '/^rgba\(.*,\s*([\d.]+)\s*\)$/', $color, $m ) || preg_match( '/^hsla\(.*,\s*([\d.]+)\s*\)$/', $color, $m ) ) {
		return (float) $m[1];
	}
	if ( preg_match( '/^#[0-9a-f]{8}$/', $color ) ) {
		return hexdec( substr( $color, 7, 2 ) ) / 255;
	}
	return 1;
}

/**
 * Background: '' (none), a color, or a linear/radial gradient.
 */
function willow_scroll_sanitize_background( $value, $fallback = '' ) {
	$value = trim( (string) $value );
	if ( '' === $value ) {
		return '';
	}
	if ( preg_match( '/^(repeating-)?(linear|radial|conic)-gradient\([a-z0-9\s.,%#()\-]+\)$/i', $value ) && substr_count( $value, '(' ) === substr_count( $value, ')' ) ) {
		return preg_replace( '/\s+/', ' ', $value );
	}
	return willow_scroll_sanitize_color( $value, $fallback );
}

function willow_scroll_sanitize_page( $input ) {
	$input = willow_scroll_map_legacy_background( is_array( $input ) ? $input : array() );
	// Before 2.10 a page could "turn off header effects": that is a regular, non-sticky header.
	if ( ! empty( $input['disabled'] ) ) {
		$input['header_mode'] = 'flow';
		$input['sticky']      = false;
	}
	$clean = array();
	foreach ( willow_scroll_page_keys() as $key ) {
		if ( array_key_exists( $key, $input ) && null !== $input[ $key ] ) {
			$clean[ $key ] = willow_scroll_sanitize_value( $key, $input[ $key ] );
		}
	}
	// The page's "Override header settings" switch; when it is missing (older data,
	// template rules) anything set means the page differs from what it inherits.
	$clean['override'] = array_key_exists( 'override', $input ) ? ! empty( $input['override'] ) : count( $clean ) > 0;
	return $clean;
}

/**
 * Color: hex (3/4/6/8), rgb(a), hsl(a), transparent. Hex with alpha is normalized to rgba().
 */
function willow_scroll_sanitize_color( $color, $fallback = '' ) {
	$color = strtolower( trim( (string) $color ) );
	if ( '' === $color ) {
		return $fallback;
	}
	if ( 'transparent' === $color ) {
		return 'rgba(0,0,0,0)';
	}
	if ( preg_match( '/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/', $color, $m ) ) {
		return sprintf( 'rgba(%d,%d,%d,%s)', hexdec( $m[1] ), hexdec( $m[2] ), hexdec( $m[3] ), round( hexdec( $m[4] ) / 255, 3 ) );
	}
	if ( preg_match( '/^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/', $color, $m ) ) {
		return sprintf( 'rgba(%d,%d,%d,%s)', hexdec( $m[1] . $m[1] ), hexdec( $m[2] . $m[2] ), hexdec( $m[3] . $m[3] ), round( hexdec( $m[4] . $m[4] ) / 255, 3 ) );
	}
	$num = '\s*[\d.]+%?\s*';
	if ( preg_match( '/^rgba?\(' . $num . ',' . $num . ',' . $num . '(,' . $num . ')?\)$/', $color ) ) {
		return preg_replace( '/\s+/', '', $color );
	}
	if ( preg_match( '/^hsla?\(\s*[\d.]+(deg)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,' . $num . ')?\)$/', $color ) ) {
		return preg_replace( '/\s+/', '', $color );
	}
	$hex = sanitize_hex_color( $color );
	return $hex ? $hex : $fallback;
}

/**
 * CSS selector list safe to print inside a <style> block.
 * Rejects anything that could close a rule or tag: { } ; < > / \ @ and comments.
 */
function willow_scroll_sanitize_selector( $selector ) {
	$selector = trim( wp_strip_all_tags( (string) $selector ) );
	if ( '' === $selector ) {
		return '';
	}
	if ( ! preg_match( '/^[a-zA-Z0-9\s\-_#.,>:+~*\[\]="\'()^$|]+$/', $selector ) ) {
		return '';
	}
	return preg_replace( '/\s+/', ' ', $selector );
}

/**
 * JSON schema for REST (settings + page meta).
 */
function willow_scroll_rest_property( $def ) {
	switch ( $def['type'] ) {
		case 'bool':
			return array( 'type' => 'boolean' );
		case 'int':
			return array( 'type' => 'integer' );
		case 'enum':
			return array( 'type' => 'string', 'enum' => $def['enum'] );
		default:
			return array( 'type' => 'string' );
	}
}

function willow_scroll_rest_schema() {
	$props = array();
	foreach ( willow_scroll_schema() as $key => $def ) {
		$props[ $key ] = willow_scroll_rest_property( $def );
	}
	return array(
		'type'                 => 'object',
		'properties'           => $props,
		'additionalProperties' => false,
	);
}

function willow_scroll_page_rest_schema() {
	$schema = willow_scroll_schema();
	$props  = array(
		'override' => array( 'type' => 'boolean' ),
		'disabled' => array( 'type' => 'boolean' ), // Accepted from older editors, mapped on save.
		'posts'    => array( 'type' => 'boolean' ), // Term rules: apply to the posts in that term too.
	);
	foreach ( willow_scroll_page_keys() as $key ) {
		$props[ $key ] = willow_scroll_rest_property( $schema[ $key ] );
	}
	return array(
		'type'                 => 'object',
		'properties'           => $props,
		'additionalProperties' => false,
	);
}

/**
 * Data shared with admin scripts (settings page + page panel).
 */
function willow_scroll_client_schema() {
	$out = array();
	foreach ( willow_scroll_schema() as $key => $def ) {
		$out[ $key ] = array_intersect_key( $def, array_flip( array( 'type', 'default', 'min', 'max', 'enum' ) ) );
		if ( isset( $out[ $key ]['max'] ) && PHP_INT_MAX === $out[ $key ]['max'] ) {
			unset( $out[ $key ]['max'] );
		}
	}
	return $out;
}

function willow_scroll_theme_palette() {
	$palette = wp_get_global_settings( array( 'color', 'palette' ) );
	$colors  = array_merge( $palette['theme'] ?? array(), $palette['custom'] ?? array() );
	if ( empty( $colors ) ) {
		$colors = $palette['default'] ?? array();
	}
	$out = array();
	foreach ( $colors as $c ) {
		// Themes like Astra use CSS variables here; show and store the real color.
		$color = willow_scroll_resolve_css_vars( $c['color'] ?? '' );
		if ( '' !== $color ) {
			$out[] = array(
				'name'  => $c['name'] ?? $color,
				'color' => $color,
			);
		}
	}
	return $out;
}

/**
 * Per-template overrides (block themes): { template-slug: page-like object }.
 */
function willow_scroll_sanitize_templates( $input ) {
	$clean = array();
	if ( ! is_array( $input ) ) {
		return $clean;
	}
	foreach ( $input as $slug => $value ) {
		$slug = willow_scroll_template_key( $slug );
		if ( '' === $slug ) {
			continue;
		}
		$page = willow_scroll_sanitize_page( $value );
		if ( ! empty( $value['posts'] ) ) {
			$page['posts'] = true;
		}
		if ( $page['override'] ) {
			$clean[ $slug ] = $page;
		}
	}
	return $clean;
}

function willow_scroll_get_templates_overrides() {
	return willow_scroll_sanitize_templates( get_option( 'willow_scroll_templates', array() ) );
}

/**
 * Splits a selector list and prefixes each part: ".a, > .b" -> ".h .a, .h > .b".
 */
function willow_scroll_prefix_selector( $prefix, $list ) {
	// Split on top-level commas only, so :is(.a,.b) stays intact.
	$parts = array();
	$depth = 0;
	$buf   = '';
	foreach ( str_split( $list ) as $ch ) {
		if ( '(' === $ch || '[' === $ch ) {
			++$depth;
		} elseif ( ')' === $ch || ']' === $ch ) {
			$depth = max( 0, $depth - 1 );
		} elseif ( ',' === $ch && 0 === $depth ) {
			$parts[] = $buf;
			$buf     = '';
			continue;
		}
		$buf .= $ch;
	}
	$parts[] = $buf;
	$parts   = array_filter( array_map( 'trim', $parts ), 'strlen' );

	return implode(
		',',
		array_map(
			function ( $part ) use ( $prefix ) {
				return $prefix . ' ' . $part;
			},
			$parts
		)
	);
}

/**
 * Theme gradients for GradientPicker: theme + custom, or core defaults.
 */
function willow_scroll_theme_gradients() {
	$set  = wp_get_global_settings( array( 'color', 'gradients' ) );
	$list = array_merge( $set['theme'] ?? array(), $set['custom'] ?? array() );
	if ( empty( $list ) ) {
		$list = $set['default'] ?? array();
	}
	$out = array();
	foreach ( $list as $g ) {
		$gradient = willow_scroll_resolve_css_vars( $g['gradient'] ?? '' );
		if ( '' !== $gradient ) {
			$out[] = array(
				'name'     => $g['name'] ?? $g['slug'] ?? '',
				'slug'     => $g['slug'] ?? sanitize_title( $g['name'] ?? '' ),
				'gradient' => $gradient,
			);
		}
	}
	return $out;
}

/**
 * CSS variables used by the theme's palette and gradients (e.g. --ast-global-color-0).
 * Their values only exist on the frontend, where the detection script reads them.
 */
function willow_scroll_palette_vars() {
	$raw = wp_json_encode(
		array(
			wp_get_global_settings( array( 'color', 'palette' ) ),
			wp_get_global_settings( array( 'color', 'gradients' ) ),
			function_exists( 'wp_get_global_styles' ) ? wp_get_global_styles( array( 'color' ) ) : array(),
		)
	);
	preg_match_all( '/var\((--[A-Za-z0-9_-]+)\)/', (string) $raw, $m );
	// Core presets resolve on their own; only theme-specific variables need reading.
	return array_values(
		array_filter(
			array_unique( $m[1] ),
			function ( $v ) {
				return 0 !== strpos( $v, '--wp--preset--' );
			}
		)
	);
}

/**
 * Replaces var(--name) with the value read on the frontend. Returns '' when a
 * variable is unknown, so a color that can't be shown is left out entirely.
 */
function willow_scroll_resolve_css_vars( $value ) {
	$value = (string) $value;
	if ( false === strpos( $value, 'var(' ) ) {
		return $value;
	}
	$known = willow_scroll_detection()['colors'] ?? array();
	$ok    = true;
	$out   = preg_replace_callback(
		'/var\((--[A-Za-z0-9_-]+)\)/',
		function ( $m ) use ( $known, &$ok ) {
			if ( isset( $known[ $m[1] ] ) ) {
				return $known[ $m[1] ];
			}
			$ok = false;
			return $m[0];
		},
		$value
	);
	return $ok ? $out : '';
}

/**
 * Scroll-to-top icons: inner SVG markup on a 24×24 grid. Shared by the
 * frontend button and the icon picker on the settings page.
 */
function willow_scroll_stt_icons() {
	return array(
		'chevron'        => array( 'svg' => '<polyline points="18 15 12 9 6 15"/>', 'filled' => false ),
		'double-chevron' => array( 'svg' => '<polyline points="17 13 12 8 7 13"/><polyline points="17 18 12 13 7 18"/>', 'filled' => false ),
		'arrow'          => array( 'svg' => '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>', 'filled' => false ),
		'long-arrow'     => array( 'svg' => '<path d="M12 21V3M7 8l5-5 5 5"/>', 'filled' => false ),
		'arrow-bar'      => array( 'svg' => '<path d="M5 4h14M12 20V9M7 13l5-5 5 5"/>', 'filled' => false ),
		'caret'          => array( 'svg' => '<path d="M12 7.5l6.5 8h-13z"/>', 'filled' => true ),
	);
}

/**
 * The theme's background and text colors as hex, for presets that should
 * match the site instead of assuming white. Classic themes fall back to
 * white on dark text.
 */
function willow_scroll_theme_colors() {
	$out = array(
		'background' => '#ffffff',
		'text'       => '#111827',
	);
	if ( ! function_exists( 'wp_get_global_styles' ) ) {
		return $out;
	}
	$palette = array();
	$set     = wp_get_global_settings( array( 'color', 'palette' ) );
	foreach ( array( 'default', 'theme', 'custom' ) as $origin ) {
		foreach ( (array) ( $set[ $origin ] ?? array() ) as $c ) {
			if ( ! empty( $c['slug'] ) && ! empty( $c['color'] ) ) {
				$palette[ $c['slug'] ] = $c['color'];
			}
		}
	}
	foreach ( array( 'background', 'text' ) as $key ) {
		$value = (string) wp_get_global_styles( array( 'color', $key ) );
		// Presets arrive as var(--wp--preset--color--slug) or var:preset|color|slug.
		if ( preg_match( '/(?:--wp--preset--color--|\|color\|)([a-z0-9_-]+)/', $value, $m ) && isset( $palette[ $m[1] ] ) ) {
			$value = $palette[ $m[1] ];
		}
		$value = willow_scroll_resolve_css_vars( $value );
		$hex   = sanitize_hex_color( $value );
		if ( ! $hex && preg_match( '/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/', $value, $c ) ) {
			$hex = sprintf( '#%02x%02x%02x', $c[1], $c[2], $c[3] );
		}
		if ( $hex ) {
			$out[ $key ] = $hex;
		}
	}
	return $out;
}
