<?php
/**
 * Per-page settings.
 * Block editor: PluginDocumentSettingPanel bound to REST meta.
 * Classic editor (and post types without custom-fields support): meta box with the same React fields.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const WILLOW_SCROLL_PAGE_META = '_willow_scroll_page';

add_action( 'init', 'willow_scroll_register_page_meta' );
add_action( 'enqueue_block_editor_assets', 'willow_scroll_panel_assets' );
add_action( 'admin_enqueue_scripts', 'willow_scroll_metabox_assets' );
add_action( 'add_meta_boxes', 'willow_scroll_add_meta_box', 10, 2 );
add_action( 'save_post', 'willow_scroll_save_meta_box', 10, 2 );
add_action( 'load-post.php', 'willow_scroll_migrate_edited_post' );

function willow_scroll_register_page_meta() {
	register_post_meta(
		'',
		WILLOW_SCROLL_PAGE_META,
		array(
			'type'              => 'object',
			'single'            => true,
			'default'           => array( 'override' => false ),
			'sanitize_callback' => 'willow_scroll_sanitize_page',
			'auth_callback'     => function ( $allowed, $meta_key, $post_id ) {
				return current_user_can( 'edit_post', $post_id );
			},
			'show_in_rest'      => array(
				'schema'           => willow_scroll_page_rest_schema(),
				// Values stored by older versions are mapped instead of being dropped by the schema.
				'prepare_callback' => function ( $value ) {
					return willow_scroll_sanitize_page( $value );
				},
			),
		)
	);
}

function willow_scroll_get_page_meta( $post_id ) {
	if ( get_option( 'willow_scroll_meta_pending' ) && ! metadata_exists( 'post', $post_id, WILLOW_SCROLL_PAGE_META ) ) {
		$migrated = willow_scroll_migrate_post_meta( $post_id );
		if ( null !== $migrated ) {
			return $migrated;
		}
	}
	return willow_scroll_sanitize_page( get_post_meta( $post_id, WILLOW_SCROLL_PAGE_META, true ) );
}

/**
 * Migrate the edited post before the editor preloads its REST data.
 */
function willow_scroll_migrate_edited_post() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only lookup of the post being opened.
	$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
	if ( $post_id && current_user_can( 'edit_post', $post_id ) ) {
		willow_scroll_get_page_meta( $post_id );
	}
}

function willow_scroll_is_supported_post_type( $post_type ) {
	return 'attachment' !== $post_type && is_post_type_viewable( $post_type );
}

function willow_scroll_panel_assets() {
	$screen = get_current_screen();
	if ( ! $screen || 'post' !== $screen->base || ! willow_scroll_is_supported_post_type( $screen->post_type ) ) {
		return;
	}
	willow_scroll_register_controls_script();
	wp_enqueue_script(
		'willow-scroll-panel',
		WILLOW_SCROLL_URL . 'assets/admin/page-panel.js',
		array( 'willow-scroll-controls', 'wp-plugins', 'wp-editor', 'wp-data' ),
		WILLOW_SCROLL_VERSION,
		true
	);
	wp_set_script_translations( 'willow-scroll-panel', 'willow-scroll' );
	willow_scroll_add_inherited_data( 'willow-scroll-panel' );
	wp_enqueue_style( 'willow-scroll-admin', WILLOW_SCROLL_URL . 'assets/admin/admin.css', array( 'wp-components' ), WILLOW_SCROLL_VERSION );
}

function willow_scroll_metabox_assets() {
	$screen = get_current_screen();
	if ( ! $screen || 'post' !== $screen->base || ! willow_scroll_is_supported_post_type( $screen->post_type ) ) {
		return;
	}
	wp_enqueue_style( 'wp-components' );
	wp_enqueue_media();
	willow_scroll_register_controls_script();
	wp_enqueue_script(
		'willow-scroll-metabox',
		WILLOW_SCROLL_URL . 'assets/admin/page-metabox.js',
		array( 'willow-scroll-controls' ),
		WILLOW_SCROLL_VERSION,
		true
	);
	wp_set_script_translations( 'willow-scroll-metabox', 'willow-scroll' );
	willow_scroll_add_inherited_data( 'willow-scroll-metabox' );
	wp_enqueue_style( 'willow-scroll-admin', WILLOW_SCROLL_URL . 'assets/admin/admin.css', array( 'wp-components' ), WILLOW_SCROLL_VERSION );
}

function willow_scroll_add_meta_box( $post_type, $post ) {
	if ( ! willow_scroll_is_supported_post_type( $post_type ) ) {
		return;
	}
	add_meta_box(
		'willow-scroll-page',
		__( 'Willow Scroll', 'willow-scroll' ),
		'willow_scroll_render_meta_box',
		$post_type,
		'side',
		'default',
		// In the block editor the REST-bound panel is used; the meta box stays only
		// for post types whose REST response has no `meta` (no custom-fields support).
		array( '__back_compat_meta_box' => post_type_supports( $post_type, 'custom-fields' ) )
	);
}

function willow_scroll_render_meta_box( $post ) {
	wp_nonce_field( 'willow_scroll_page', 'willow_scroll_page_nonce' );
	printf(
		'<div id="willow-scroll-page-root"></div><input type="hidden" name="willow_scroll_page" id="willow-scroll-page-input" value="%s">',
		esc_attr( wp_json_encode( willow_scroll_get_page_meta( $post->ID ) ) )
	);
}

function willow_scroll_save_meta_box( $post_id, $post ) {
	if ( ! isset( $_POST['willow_scroll_page_nonce'], $_POST['willow_scroll_page'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['willow_scroll_page_nonce'] ) ), 'willow_scroll_page' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- decoded JSON is sanitized by willow_scroll_sanitize_page().
	$data = json_decode( wp_unslash( $_POST['willow_scroll_page'] ), true );
	update_post_meta( $post_id, WILLOW_SCROLL_PAGE_META, willow_scroll_sanitize_page( $data ) );
}

/**
 * What a post gets when it changes nothing: site settings plus its template's
 * settings, with the source of each value for the editor ("Default: … — …").
 */
function willow_scroll_inherited_for_post( $post_id ) {
	$values  = willow_scroll_get_settings();
	$sources = array();
	foreach ( willow_scroll_page_keys() as $key ) {
		$sources[ $key ] = 'site';
	}
	$template = '';
	$matched  = array();
	list( $key, $rule ) = willow_scroll_match_rule( willow_scroll_post_template_keys( $post_id ) );
	if ( $rule ) {
		$matched[] = array( $key, $rule );
	}
	list( $term_key, $term_rule ) = willow_scroll_match_post_term_rule( $post_id );
	if ( $term_rule ) {
		$matched[] = array( $term_key, $term_rule ); // more specific, applied last
	}
	foreach ( $matched as $entry ) {
		$template = willow_scroll_template_title( $entry[0] );
		foreach ( willow_scroll_page_keys() as $k ) {
			if ( array_key_exists( $k, $entry[1] ) ) {
				$values[ $k ]  = $entry[1][ $k ];
				$sources[ $k ] = 'template';
			}
		}
	}
	return array(
		'values'   => array_intersect_key( $values, array_flip( willow_scroll_page_keys() ) ),
		'sources'  => $sources,
		'template' => $template,
	);
}

/**
 * Inherited values for the post open in the editor (block editor panel and meta box).
 */
function willow_scroll_add_inherited_data( $handle ) {
	global $post;
	if ( ! $post ) {
		return;
	}
	wp_add_inline_script( $handle, 'window.willowScrollInherited = ' . wp_json_encode( willow_scroll_inherited_for_post( $post->ID ) ) . ';', 'before' );
}
