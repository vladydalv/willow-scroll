<?php
/**
 * Data migrations.
 * - Settings: migrated on `init`, so the frontend never reads an old format.
 * - 1.x page meta: migrated lazily when a post is read, plus in admin batches.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', 'willow_scroll_maybe_upgrade', 1 );
add_action( 'admin_init', 'willow_scroll_migrate_meta_batch' );

function willow_scroll_maybe_upgrade() {
	$version = (int) get_option( 'willow_scroll_db_version', 1 );
	if ( $version >= WILLOW_SCROLL_DB_VERSION ) {
		return;
	}

	$old = get_option( 'willow_scroll_settings' );
	if ( is_array( $old ) ) {
		update_option( 'willow_scroll_settings', willow_scroll_migrate_settings( $old ) );
	}
	if ( $version < 2 ) {
		update_option( 'willow_scroll_meta_pending', 1, false );
	}
	update_option( 'willow_scroll_db_version', WILLOW_SCROLL_DB_VERSION );
}

/**
 * 1.x stored three visibility booleans; now one scroll_behavior enum.
 */
function willow_scroll_legacy_behavior( $always, $hide, $show ) {
	if ( $always ) {
		return 'always';
	}
	return $hide && ! $show ? 'hide' : 'smart';
}

/**
 * Maps 1.x and 2.0.0 settings to the current schema.
 */
function willow_scroll_migrate_settings( array $old ) {
	$new = $old;

	if ( ! isset( $old['scroll_behavior'] ) && ( isset( $old['always_visible'] ) || isset( $old['hide_on_scroll_down'] ) ) ) {
		$new['scroll_behavior'] = willow_scroll_legacy_behavior(
			! empty( $old['always_visible'] ),
			! empty( $old['hide_on_scroll_down'] ),
			! empty( $old['show_on_scroll_up'] )
		);
	}
	if ( isset( $old['csb_hide_on_mobile'] ) && ! isset( $old['csb_skip_mobile'] ) ) {
		$new['csb_skip_mobile'] = ! empty( $old['csb_hide_on_mobile'] );
	}
	if ( array_key_exists( 'logo_swap_enabled', $old ) ) {
		$swap                  = ! empty( $old['logo_swap_enabled'] );
		$new['logo_scrolled_id'] = $swap ? (int) ( $old['logo_scrolled_id'] ?? 0 ) : 0;
		$new['logo_resize']      = $swap && ! empty( $old['logo_height_enabled'] );
	}

	// One floating inset became separate values for the sides and the top.
	if ( isset( $old['float_inset'] ) ) {
		$new['float_inset_x'] = (int) $old['float_inset'];
		$new['float_inset_y'] = (int) $old['float_inset'];
	}

	// Scroll-to-top corner radius: percent (≤ 2.5) → pixels of the current button size.
	if ( isset( $old['stt_radius'] ) && ! isset( $old['stt_radius_px'] ) ) {
		$size                 = (int) ( $old['stt_icon_size'] ?? 24 ) + 2 * (int) ( $old['stt_padding'] ?? 13 );
		$new['stt_radius_px'] = (int) round( min( 50, max( 0, (int) $old['stt_radius'] ) ) / 100 * $size );
	}

	return willow_scroll_sanitize_settings( willow_scroll_map_legacy_background( $new ) );
}

/**
 * Converts one post's 1.x meta into `_willow_scroll_page` and removes the old keys.
 * Returns the new value, or null when the post had no legacy data.
 */
function willow_scroll_migrate_post_meta( $post_id ) {
	$keys = array( '_willow_scroll_disabled', '_willow_scroll_override', '_willow_scroll_page_options' );
	$has  = false;
	foreach ( $keys as $k ) {
		if ( metadata_exists( 'post', $post_id, $k ) ) {
			$has = true;
			break;
		}
	}
	if ( ! $has ) {
		return null;
	}

	$opts = get_post_meta( $post_id, '_willow_scroll_page_options', true );
	$opts = is_array( $opts ) ? $opts : array();
	$get  = function ( $key ) use ( $post_id, $opts ) {
		if ( isset( $opts[ $key ] ) && '' !== $opts[ $key ] ) {
			return $opts[ $key ];
		}
		$val = get_post_meta( $post_id, '_wsmb_' . $key, true );
		return '' === $val ? null : $val;
	};

	$page = array(
		'disabled' => '1' === get_post_meta( $post_id, '_willow_scroll_disabled', true ),
		'override' => '1' === get_post_meta( $post_id, '_willow_scroll_override', true ),
	);
	if ( null !== $get( 'always_visible' ) || null !== $get( 'hide_on_scroll_down' ) ) {
		$page['scroll_behavior'] = willow_scroll_legacy_behavior( '1' === $get( 'always_visible' ), '1' === $get( 'hide_on_scroll_down' ), '1' === $get( 'show_on_scroll_up' ) );
	}
	$legacy_keys = array( 'header_mode', 'glass_enabled', 'glass_bg_color', 'color_change_enabled', 'initial_bg_color', 'scrolled_bg_color', 'progress_bar' );
	foreach ( $legacy_keys as $key ) {
		$val = $get( $key );
		if ( null !== $val && ! isset( $page[ $key ] ) ) {
			$page[ $key ] = $val;
		}
	}

	$page = willow_scroll_sanitize_page( $page );
	update_post_meta( $post_id, '_willow_scroll_page', $page );
	foreach ( $keys as $k ) {
		delete_post_meta( $post_id, $k );
	}
	return $page;
}

function willow_scroll_migrate_meta_batch() {
	if ( ! get_option( 'willow_scroll_meta_pending' ) ) {
		return;
	}
	global $wpdb;
	$limit = 100;

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time migration.
	$ids = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT DISTINCT post_id FROM {$wpdb->postmeta}
			 WHERE meta_key IN ('_willow_scroll_disabled','_willow_scroll_override','_willow_scroll_page_options')
			 LIMIT %d",
			$limit
		)
	);
	foreach ( $ids as $id ) {
		willow_scroll_migrate_post_meta( (int) $id );
	}

	if ( count( $ids ) < $limit ) {
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time cleanup.
		$wpdb->query( "DELETE FROM {$wpdb->postmeta} WHERE meta_key LIKE '\\_wsmb\\_%' OR meta_key = '_willow_scroll_style'" );
		delete_option( 'willow_scroll_meta_pending' );
	}
}
