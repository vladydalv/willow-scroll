<?php
/**
 * Frontend output.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_enqueue_scripts', 'willow_scroll_enqueue' );
add_action( 'wp_footer', 'willow_scroll_render_stt' );
add_filter( 'render_block_core/template-part', 'willow_scroll_mark_header', 10, 2 );
add_filter( 'get_custom_logo', 'willow_scroll_wrap_logo' );

/**
 * Options for this request: global → template → page.
 * `_header` is false when header effects are turned off here; extras keep their own toggles.
 */
function willow_scroll_current_options() {
	static $cached = null;
	if ( null !== $cached ) {
		return $cached;
	}
	// Cache only once the template hierarchy has run; an early caller
	// (e.g. a plugin reading the logo on `init`) must not freeze a partial result.
	$request_keys = willow_scroll_request_template_keys();
	$ready        = ! empty( $request_keys ) || did_action( 'wp_head' );

	$opts            = willow_scroll_get_settings();
	$opts['_header'] = true;


	$layers = array();
	// The most specific rule in the template hierarchy of this request.
	list( , $rule ) = willow_scroll_match_rule( $request_keys );
	if ( $rule ) {
		$layers[] = $rule;
	}
	$obj = get_queried_object();
	if ( $obj instanceof WP_Post ) {
		// A rule of one of the post's terms is more specific than its template rule.
		list( , $term_rule ) = willow_scroll_match_post_term_rule( $obj->ID );
		if ( $term_rule ) {
			$layers[] = $term_rule;
		}
		$layers[] = willow_scroll_get_page_meta( $obj->ID );
	}

	foreach ( $layers as $layer ) {
		// Switched off: the values stay stored but the layer is ignored.
		if ( empty( $layer['override'] ) ) {
			continue;
		}
		foreach ( willow_scroll_page_keys() as $key ) {
			if ( array_key_exists( $key, $layer ) ) {
				$opts[ $key ] = $layer[ $key ];
			}
		}
	}
	// A regular header that doesn't stick and changes nothing is the theme's own header.
	if ( 'flow' === $opts['header_mode'] && ! $opts['sticky'] && ! $opts['regular_bg'] && ! $opts['logo_regular_id'] ) {
		$opts['_header'] = false;
	}

	$opts = apply_filters( 'willow_scroll_options', $opts );
	if ( $ready ) {
		$cached = $opts;
	}
	return $opts;
}

function willow_scroll_has_output( $o ) {
	return $o['_header'] || $o['progress_bar'] || $o['stt_enabled'] || $o['csb_enabled'];
}

/**
 * Block themes: mark the first header template part on the server,
 * so styles apply before any script runs.
 */
function willow_scroll_mark_header( $html, $block ) {
	static $done = false;
	if ( $done || is_admin() || wp_is_json_request() ) {
		return $html;
	}
	$o = willow_scroll_current_options();
	if ( ! $o['_header'] || $o['selector'] ) {
		return $html;
	}
	$p = new WP_HTML_Tag_Processor( $html );
	if ( ! $p->next_tag() || 'HEADER' !== $p->get_tag() ) {
		return $html;
	}
	$p->add_class( 'willow-header' );
	$p->add_class( 'willow-mode-' . $o['header_mode'] );
	$done = true;
	return $p->get_updated_html();
}

/**
 * Logo per header look. The site logo stays in place; logos picked for the
 * current look (regular or transparent at the top, sticky when scrolled) are
 * added next to it and switched with CSS. Both core/site-logo and classic
 * themes print the logo through get_custom_logo().
 */
function willow_scroll_logo_ids( $o ) {
	return array(
		'top'    => 'overlay' === $o['header_mode'] ? (int) $o['logo_transparent_id'] : (int) $o['logo_regular_id'],
		'sticky' => (int) $o['logo_sticky_id'],
	);
}

function willow_scroll_wrap_logo( $html ) {
	static $done = false;
	// Only the first logo on the page (the header); footer logos stay untouched.
	if ( $done || is_admin() || wp_is_json_request() || ! did_action( 'template_redirect' ) ) {
		return $html;
	}
	$o = willow_scroll_current_options();
	if ( ! $o['_header'] ) {
		return $html;
	}
	$extra = '';
	foreach ( willow_scroll_logo_ids( $o ) as $state => $id ) {
		if ( ! $id ) {
			continue;
		}
		$extra .= wp_get_attachment_image(
			$id,
			'full',
			false,
			array(
				'class'       => 'willow-logo__alt willow-logo__' . $state,
				'alt'         => '',
				'aria-hidden' => 'true',
				'decoding'    => 'async',
			)
		);
	}
	if ( '' === $extra ) {
		return $html;
	}
	$done = true;
	return preg_replace_callback(
		'/<img\b[^>]*\bcustom-logo\b[^>]*>/',
		function ( $m ) use ( $extra ) {
			return '<span class="willow-logo">' . $m[0] . $extra . '</span>';
		},
		$html,
		1
	);
}

function willow_scroll_enqueue() {
	$o = willow_scroll_current_options();
	if ( ! willow_scroll_has_output( $o ) ) {
		return;
	}

	wp_register_style( 'willow-scroll', false, array(), WILLOW_SCROLL_VERSION );
	wp_enqueue_style( 'willow-scroll' );
	wp_add_inline_style( 'willow-scroll', willow_scroll_build_css( $o ) );

	wp_enqueue_script( 'willow-scroll', WILLOW_SCROLL_URL . 'assets/frontend.js', array(), WILLOW_SCROLL_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
	wp_add_inline_script( 'willow-scroll', 'window.willowScrollConfig=' . wp_json_encode( willow_scroll_build_config( $o ) ) . ';', 'before' );
}

function willow_scroll_build_config( $o ) {
	return array(
		'header'           => $o['_header'],
		'selector'         => $o['selector'],
		'detectedHeader'   => $o['selector'] ? '' : ( willow_scroll_detection()['header'] ?? '' ),
		'fallbacks'        => willow_scroll_header_candidates(),
		'mode'             => $o['header_mode'],
		'sticky'           => $o['sticky'],
		'behavior'         => $o['scroll_behavior'],
		'hideAfter'        => $o['hide_after'],
		'tolerance'        => $o['scroll_tolerance'],
		'scrolledOffset'   => $o['scrolled_offset'],
		'mobileQuery'      => $o['disable_on_mobile'] ? '(max-width: ' . $o['mobile_breakpoint'] . 'px)' : '',
		'shrink'           => $o['shrink_enabled'],
		'shrinkHeight'     => $o['shrink_height'],
		'progressBar'      => $o['progress_bar'],
		'progressTop'      => 'top' === $o['progress_bar_position'],
		'stt'              => $o['stt_enabled'],
		'sttOffset'        => $o['stt_offset'],
	);
}

/**
 * All values are schema-sanitized: ints clamped, enums whitelisted,
 * colors and selectors validated in willow_scroll_sanitize_value().
 */
function willow_scroll_build_css( $o ) {
	$css = '';
	if ( $o['_header'] ) {
		$css .= willow_scroll_header_css( $o );
	}

	if ( $o['progress_bar'] ) {
		$edge = 'bottom' === $o['progress_bar_position'] ? 'bottom:0;' : 'top:0;';
		$pz   = $o['z_index'] + 1;
		$css .= "#willow-progress{position:fixed;{$edge}left:0;width:100%;height:{$o['progress_bar_height']}px;background:{$o['progress_bar_color']};transform:scaleX(0);transform-origin:0 50%;z-index:{$pz};pointer-events:none;}";
		if ( 'top' === $o['progress_bar_position'] ) {
			$css .= 'body.admin-bar #willow-progress{top:var(--wp-admin--admin-bar--height,0px);}';
		}
	}

	if ( $o['stt_enabled'] ) {
		$side  = 'left' === $o['stt_position'] ? 'left' : 'right';
		$lift  = array(
			'none' => 'none',
			'lift' => 'translateY(-3px)',
			'grow' => 'scale(1.08)',
		);
		$hover = $lift[ $o['stt_hover'] ];
		$css  .= "#willow-stt{position:fixed;{$side}:{$o['stt_inset_x']}px;bottom:{$o['stt_inset_y']}px;z-index:{$o['z_index']};display:flex;align-items:center;justify-content:center;padding:{$o['stt_padding']}px;border:0;border-radius:{$o['stt_radius_px']}px;background:{$o['stt_bg_color']};color:{$o['stt_icon_color']};line-height:0;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(12px);transition:opacity .3s,visibility .3s,transform .2s ease,background-color .2s ease,color .2s ease;}";
		$css  .= '#willow-stt.willow-is-visible{opacity:1;visibility:visible;transform:none;}';
		$css  .= "#willow-stt.willow-is-visible:hover,#willow-stt.willow-is-visible:focus-visible{background:{$o['stt_bg_hover_color']};color:{$o['stt_icon_hover_color']};transform:{$hover};}";
		$css  .= '#willow-stt:focus-visible{outline:2px solid currentColor;outline-offset:3px;}';
		$css  .= '@media (prefers-reduced-motion:reduce){#willow-stt.willow-is-visible:hover,#willow-stt.willow-is-visible:focus-visible{transform:none;}}';
	}

	if ( $o['csb_enabled'] ) {
		$w    = $o['csb_width'];
		$bar  = "html{scrollbar-color:{$o['csb_thumb_color']} {$o['csb_track_color']};scrollbar-width:" . ( $w <= 6 ? 'thin' : 'auto' ) . ';}';
		$bar .= "::-webkit-scrollbar{width:{$w}px;height:{$w}px;}";
		$bar .= "::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:{$o['csb_track_color']};}";
		$bar .= "::-webkit-scrollbar-thumb{background:{$o['csb_thumb_color']};border-radius:{$o['csb_border_radius']}px;border:{$o['csb_thumb_border']}px solid {$o['csb_thumb_border_color']};background-clip:padding-box;}";
		$bar .= "::-webkit-scrollbar-thumb:hover{background:{$o['csb_thumb_hover_color']};background-clip:padding-box;}";
		// Small screens keep the native scrollbar instead of hiding it.
		$css .= $o['csb_skip_mobile'] ? '@media (min-width:' . ( $o['mobile_breakpoint'] + 1 ) . "px){{$bar}}" : $bar;
	}

	// Reduced motion: only the transitions this plugin adds.
	$motion = array( '#willow-stt' );
	if ( $o['_header'] ) {
		$motion[] = '.willow-header';
		$motion[] = '.willow-header .willow-logo>img';
		$motion[] = '.willow-header img.custom-logo';
		$bg_sel = $o['background_selector'] ? $o['background_selector'] : ( willow_scroll_detection()['background'] ?? '' );
		if ( $bg_sel ) {
			$motion[] = willow_scroll_prefix_selector( '.willow-header', $bg_sel );
		}
		if ( $o['shrink_enabled'] ) {
			$motion[] = '.willow-header [data-willow-row]';
		}
	}
	$css .= '@media (prefers-reduced-motion:reduce){' . implode( ',', $motion ) . '{transition:none !important;}}';
	return $css;
}

function willow_scroll_header_css( $o ) {
	$dur  = $o['transition_duration'] . 'ms';
	$ease = $o['transition_easing'];
	// The header is styled from the first paint, before any script: block themes get
	// the class from the server; a detected or ID header selector is printed alongside.
	$detected = willow_scroll_detection();
	$early    = '';
	if ( preg_match( '/^#[A-Za-z][\w-]*$/', $o['selector'] ) ) {
		$early = $o['selector'];
	} elseif ( ! $o['selector'] && ! empty( $detected['header'] ) && false === strpos( $detected['header'], ',' ) ) {
		$early = $detected['header'];
	}
	$h          = $early ? ':is(' . $early . ',.willow-header)' : '.willow-header';
	$sc         = $h . '.willow-is-scrolled';
	$top        = $h . ':not(.willow-is-scrolled)';
	$pos_target = $h;

	$css  = "{$pos_target}{--willow-top:0px;z-index:{$o['z_index']};}";
	$css .= "body.admin-bar :is({$pos_target}){--willow-top:var(--wp-admin--admin-bar--height,0px);}";
	if ( 'overlay' === $o['header_mode'] && ! $o['sticky'] ) {
		// Transparent, not sticky: lies over the first section and scrolls away with the page.
		$css .= "{$pos_target}{position:absolute;top:var(--willow-top);left:0;right:0;}";
	} elseif ( 'overlay' === $o['header_mode'] ) {
		$css .= "{$pos_target}{position:fixed;top:var(--willow-top);left:0;right:0;}";
	} elseif ( $o['sticky'] ) {
		// Regular and sticky; JS switches to fixed + placeholder when sticky can't work.
		// (Regular and not sticky gets no rule: the header stays where the theme puts it.)
		$css .= "{$pos_target}{position:sticky;top:var(--willow-top);}";
		$css .= "{$h}.willow-pos-fixed{position:fixed;left:0;right:0;}";
	}
	$css .= "{$h}{transition:transform {$dur} {$ease},background-color {$dur} {$ease},-webkit-backdrop-filter {$dur} {$ease},backdrop-filter {$dur} {$ease},box-shadow {$dur} {$ease},padding {$dur} {$ease};}";
	$css .= "{$h}.willow-is-hidden{transform:translateY(calc(-100% - var(--willow-top) - var(--willow-float,0px)));}";
	$css .= "{$h}.willow-no-anim,{$h}.willow-no-anim *{transition:none !important;}";

	// Background element: the header itself or the wrapper the theme paints.
	// Manual setting wins; otherwise the wrappers found by detection.
	$bg_sel     = $o['background_selector'] ? $o['background_selector'] : ( $detected['background'] ?? '' );
	$bg_scroll  = $bg_sel ? willow_scroll_prefix_selector( $sc, $bg_sel ) : $sc;
	$bg_initial = $bg_sel ? willow_scroll_prefix_selector( $top, $bg_sel ) : $top;
	if ( $bg_sel ) {
		$css .= willow_scroll_prefix_selector( $h, $bg_sel ) . "{transition:background-color {$dur} {$ease},-webkit-backdrop-filter {$dur} {$ease},backdrop-filter {$dur} {$ease},box-shadow {$dur} {$ease};}";
	}

	// Regular header at the top: own background, otherwise the theme's.
	if ( 'flow' === $o['header_mode'] && $o['regular_bg'] ) {
		$css .= "{$bg_initial}{background:{$o['regular_bg']} !important;}";
		if ( $bg_sel ) {
			$css .= "{$top}{background:transparent !important;}";
		}
	}
	// Transparent header: nothing painted at the top.
	if ( 'overlay' === $o['header_mode'] ) {
		$css .= "{$bg_initial}{background:transparent !important;box-shadow:none;}";
		// Background on inner layers: the header element itself must not show through.
		if ( $bg_sel ) {
			$css .= "{$top}{background:transparent !important;}";
		}
	}
	// Floating corners, shared by the header and the layers that paint its background.
	$float_radius = $o['float_corners']
		? "{$o['float_radius_tl']}px {$o['float_radius_tr']}px {$o['float_radius_br']}px {$o['float_radius_bl']}px"
		: $o['float_radius'] . 'px';

	// Sticky header.
	if ( $o['scrolled_bg_enabled'] ) {
		$decl = $o['scrolled_bg'] ? "background:{$o['scrolled_bg']} !important;" : '';
		if ( $o['blur'] > 0 ) {
			$decl .= "-webkit-backdrop-filter:blur({$o['blur']}px);backdrop-filter:blur({$o['blur']}px);";
		}
		$shadows = array();
		if ( $o['shadow_enabled'] ) {
			$shadows[] = "0 {$o['shadow_y']}px {$o['shadow_blur']}px {$o['shadow_color']}";
		}
		if ( $o['line_enabled'] ) {
			// Inset, so the line adds no height.
			$shadows[] = "inset 0 -{$o['line_width']}px 0 {$o['line_color']}";
		}
		if ( $shadows ) {
			$decl .= 'box-shadow:' . implode( ',', $shadows ) . ';';
		}
		if ( $o['float_enabled'] ) {
			$decl .= "border-radius:{$float_radius};";
		}
		if ( $decl ) {
			$css .= "{$bg_scroll}{{$decl}}";
		}
		// Only when there is a background to paint on the layers: otherwise the header
		// would turn transparent with nothing replacing it.
		if ( $bg_sel && $o['scrolled_bg'] ) {
			$css .= "{$sc}{background:transparent !important;}";
		}
	}

	// Floating: the sticky header leaves the screen edges.
	if ( $o['float_enabled'] && $o['sticky'] ) {
		$x      = $o['float_inset_x'] . 'px';
		$y      = $o['float_inset_y'] . 'px';
		$css   .= "{$sc}{--willow-float:{$y};top:calc(var(--willow-top) + {$y});border-radius:{$float_radius};}";
		if ( 'overlay' === $o['header_mode'] ) {
			$css .= "{$sc}{left:{$x};right:{$x};}";
		} else {
			$css .= "{$sc}:not(.willow-pos-fixed){margin-left:{$x};margin-right:{$x};}{$sc}.willow-pos-fixed{left:{$x};right:{$x};}";
		}
		$css .= "{$h}{transition-property:transform,background-color,-webkit-backdrop-filter,backdrop-filter,box-shadow,padding,top,left,right,margin,border-radius;}";
	}

	if ( $o['shrink_enabled'] ) {
		// While shrinking is on, the script keeps the header's rows collapsed and only
		// the innermost row's padding sets the height (theme height at the top, the
		// chosen height when sticky). A single transition, so the motion is smooth.
		$sh    = "{$h}.willow-shrinks";
		$rows  = "{$sh}[data-willow-row],{$sh} [data-willow-row]";
		$inner = "{$sh}[data-willow-row=\"inner\"],{$sh} [data-willow-row=\"inner\"]";
		$meas  = "{$h}.willow-measuring[data-willow-row],{$h}.willow-measuring [data-willow-row]";
		$css  .= "{$sh}{--willow-row-pad:var(--willow-pad-top,0px);}{$sh}.willow-is-scrolled{--willow-row-pad:var(--willow-pad-sticky,0px);}";
		$css  .= "{$rows}{min-height:0 !important;padding-top:0 !important;padding-bottom:0 !important;}";
		$css  .= "{$inner}{padding-top:var(--willow-row-pad) !important;padding-bottom:var(--willow-row-pad) !important;transition:padding {$dur} {$ease};}";
		$css  .= "{$meas}{min-height:0 !important;padding-top:0 !important;padding-bottom:0 !important;transition:none !important;}";
	}




	$logos = willow_scroll_logo_ids( $o );
	if ( $logos['top'] || $logos['sticky'] ) {
		$css .= "{$h} .willow-logo>img{transition:opacity {$dur} {$ease};}";
		if ( $logos['top'] ) {
			$css .= "{$top} .willow-logo>img:first-child{opacity:0;}{$top} .willow-logo__top{opacity:1;}";
		}
		if ( $logos['sticky'] ) {
			$css .= "{$sc} .willow-logo>img:first-child{opacity:0;}{$sc} .willow-logo__sticky{opacity:1;}";
		}
	}
	if ( $o['logo_resize'] ) {
		$css .= "{$h}{--willow-logo-h:{$o['logo_height_default']}px;}{$sc}{--willow-logo-h:{$o['logo_height_scrolled']}px;}";
		// The logo image in its usual wrappers. Doubled class for weight over theme selectors;
		// the theme's max-width / max-height limits are lifted so the height is not clipped.
		$logo_img = apply_filters( 'willow_scroll_logo_selectors', array( 'img.custom-logo', '.custom-logo-link img', '.wp-block-site-logo img', '.site-logo img', '.site-logo-img img', '.site-branding img' ) );
		$css     .= "{$h}{$h} :is(" . implode( ',', $logo_img ) . "){height:var(--willow-logo-h) !important;width:auto !important;max-width:none !important;max-height:none !important;transition:height {$dur} {$ease},opacity {$dur} {$ease};}";
	}

	if ( $o['disable_on_mobile'] ) {
		$css = '@media (min-width:' . ( $o['mobile_breakpoint'] + 1 ) . "px){{$css}}";
	}

	// Base logo layering must hold on every screen size.
	if ( $logos['top'] || $logos['sticky'] ) {
		$css .= '.willow-logo{position:relative;display:inline-block;line-height:0;vertical-align:middle;}';
		$css .= '.willow-logo__alt{position:absolute;inset:0;width:100% !important;height:100% !important;object-fit:contain;opacity:0;}';
	}
	return $css;
}

function willow_scroll_render_stt() {
	$o = willow_scroll_current_options();
	if ( ! $o['stt_enabled'] ) {
		return;
	}
	$icons  = willow_scroll_stt_icons();
	$style  = $o['stt_icon_style'];
	$filled = $icons[ $style ]['filled'];
	printf(
		'<button type="button" id="willow-stt" aria-label="%1$s"><svg xmlns="http://www.w3.org/2000/svg" width="%2$d" height="%2$d" viewBox="0 0 24 24" fill="%3$s" stroke="%4$s" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%5$s</svg></button>',
		esc_attr__( 'Scroll to top', 'willow-scroll' ),
		(int) $o['stt_icon_size'],
		$filled ? 'currentColor' : 'none',
		'currentColor',
		$icons[ $style ]['svg'] // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static whitelisted markup.
	);
}
