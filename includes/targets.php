<?php
/**
 * Template rules for any content: they follow the WordPress template hierarchy,
 * not the template files a theme happens to ship. A rule for "single-product"
 * applies to every product even when the theme renders them with "single".
 * Works for block and classic themes alike.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'template_redirect', 'willow_scroll_capture_hierarchy', 0 );

/**
 * Normalized rule key: "single-product.php" → "single-product",
 * "templates/landing.php" → "templates/landing".
 */
function willow_scroll_template_key( $name ) {
	$name = strtolower( (string) $name );
	$name = preg_replace( '/\.php$/', '', $name );
	return preg_replace( '/[^a-z0-9_\-\/]/', '', $name );
}

/**
 * Records the template candidates WordPress tries for this request, most
 * specific first, as it runs the hierarchy in template-loader.php.
 */
function willow_scroll_capture_hierarchy() {
	$types = array( 'embed', '404', 'search', 'frontpage', 'home', 'privacypolicy', 'attachment', 'single', 'page', 'singular', 'category', 'tag', 'taxonomy', 'author', 'date', 'archive', 'paged', 'index' );
	foreach ( $types as $type ) {
		add_filter( "{$type}_template_hierarchy", 'willow_scroll_collect_hierarchy', PHP_INT_MAX );
	}
}

function willow_scroll_collect_hierarchy( $templates ) {
	willow_scroll_request_template_keys( $templates );
	return $templates;
}

/**
 * Template keys for the current request, most specific first.
 * Called with an array to add to the list.
 */
function willow_scroll_request_template_keys( $add = null ) {
	static $keys = array();
	if ( is_array( $add ) ) {
		foreach ( $add as $t ) {
			$k = willow_scroll_template_key( $t );
			if ( $k && ! in_array( $k, $keys, true ) ) {
				$keys[] = $k;
			}
		}
	}
	return $keys;
}

/**
 * Template keys for a post, most specific first (for the editor's defaults).
 */
function willow_scroll_post_template_keys( $post ) {
	$post = get_post( $post );
	if ( ! $post ) {
		return array();
	}
	$keys   = array();
	$custom = get_page_template_slug( $post );
	if ( (int) get_option( 'page_on_front' ) === (int) $post->ID && 'page' === get_option( 'show_on_front' ) ) {
		$keys[] = 'front-page';
	}
	if ( $custom ) {
		$keys[] = $custom;
	}
	if ( 'page' === $post->post_type ) {
		$keys = array_merge( $keys, array( "page-{$post->post_name}", "page-{$post->ID}", 'page' ) );
	} else {
		$keys = array_merge( $keys, array( "single-{$post->post_type}-{$post->post_name}", "single-{$post->post_type}", 'single' ) );
	}
	$keys[] = 'singular';
	$keys[] = 'index';
	return array_values( array_unique( array_map( 'willow_scroll_template_key', $keys ) ) );
}

/**
 * The first rule that matches a list of template keys, with its key.
 */
function willow_scroll_match_rule( $keys ) {
	$rules = willow_scroll_get_templates_overrides();
	foreach ( $keys as $k ) {
		if ( isset( $rules[ $k ] ) ) {
			return array( $k, $rules[ $k ] );
		}
	}
	return array( '', null );
}

/**
 * Everything a rule can target, for the settings page: built from registered
 * post types and taxonomies, plus the theme's own custom templates.
 */
function willow_scroll_template_targets() {
	$t = array(
		'front-page' => __( 'Front page', 'willow-scroll' ),
		'home'       => __( 'Blog (posts page)', 'willow-scroll' ),
		'page'       => __( 'Pages', 'willow-scroll' ),
		'single'     => __( 'Single entries of any type', 'willow-scroll' ),
		'archive'    => __( 'All archives', 'willow-scroll' ),
		'search'     => __( 'Search results', 'willow-scroll' ),
		'404'        => __( 'Page not found (404)', 'willow-scroll' ),
	);

	foreach ( get_post_types( array( 'public' => true ), 'objects' ) as $type ) {
		if ( in_array( $type->name, array( 'page', 'attachment' ), true ) ) {
			continue;
		}
		/* translators: %s: post type name, e.g. "Products" */
		$t[ 'single-' . $type->name ] = sprintf( __( '%s: single', 'willow-scroll' ), $type->labels->name );
		if ( 'post' !== $type->name && $type->has_archive ) {
			/* translators: %s: post type name */
			$t[ 'archive-' . $type->name ] = sprintf( __( '%s: archive', 'willow-scroll' ), $type->labels->name );
		}
	}

	foreach ( get_taxonomies( array( 'public' => true ), 'objects' ) as $tax ) {
		$builtin = 'category' === $tax->name ? 'category' : ( 'post_tag' === $tax->name ? 'tag' : '' );
		$key     = $builtin ? $builtin : 'taxonomy-' . $tax->name;
		/* translators: %s: taxonomy name, e.g. "Product categories" */
		$t[ $key ] = sprintf( __( '%s: archive', 'willow-scroll' ), $tax->labels->name );

		// Single terms, but only while the list stays usable in a dropdown.
		$terms = get_terms(
			array(
				'taxonomy'   => $tax->name,
				'hide_empty' => false,
				'number'     => 51,
				'orderby'    => 'name',
			)
		);
		if ( is_wp_error( $terms ) || count( $terms ) > 50 ) {
			continue;
		}
		foreach ( $terms as $term ) {
			$term_key = $builtin ? $builtin . '-' . $term->slug : 'taxonomy-' . $tax->name . '-' . $term->slug;
			/* translators: 1: taxonomy singular name, 2: term name */
			$t[ willow_scroll_template_key( $term_key ) ] = sprintf( __( '%1$s: %2$s', 'willow-scroll' ), $tax->labels->singular_name, $term->name );
		}
	}

	// Custom templates a page can pick: block theme templates and classic page templates.
	if ( wp_is_block_theme() ) {
		// Structural fallbacks of the hierarchy: a rule on them would just repeat the site settings.
		$skip = array( 'index', 'singular', 'archive', 'taxonomy' );
		foreach ( get_block_templates( array(), 'wp_template' ) as $tpl ) {
			$key = willow_scroll_template_key( $tpl->slug );
			if ( ! isset( $t[ $key ] ) && ! in_array( $key, $skip, true ) ) {
				/* translators: %s: template title */
				$t[ $key ] = sprintf( __( 'Template: %s', 'willow-scroll' ), $tpl->title ? $tpl->title : $tpl->slug );
			}
		}
	}
	// wp-admin only; the frontend never builds this list.
	if ( ! function_exists( 'get_page_templates' ) ) {
		require_once ABSPATH . 'wp-admin/includes/theme.php';
	}
	foreach ( get_page_templates( null, 'page' ) as $name => $file ) {
		/* translators: %s: page template name */
		$t[ willow_scroll_template_key( $file ) ] = sprintf( __( 'Template: %s', 'willow-scroll' ), $name );
	}

	$out = array();
	foreach ( $t as $slug => $title ) {
		$out[] = array(
			'slug'  => $slug,
			'title' => $title,
		);
	}
	return $out;
}

function willow_scroll_template_title( $key ) {
	foreach ( willow_scroll_template_targets() as $target ) {
		if ( $target['slug'] === $key ) {
			return $target['title'];
		}
	}
	return $key;
}

/**
 * Splits a term rule key into taxonomy and term slug.
 * "category-news" → [category, news]; "taxonomy-skill-php" → [skill, php];
 * "category" → [category, ''] (any term of that taxonomy). Null when it is not a term rule.
 */
function willow_scroll_term_rule_target( $key ) {
	foreach ( get_taxonomies( array( 'public' => true ), 'objects' ) as $tax ) {
		$prefix = 'category' === $tax->name ? 'category' : ( 'post_tag' === $tax->name ? 'tag' : 'taxonomy-' . $tax->name );
		if ( $key === $prefix ) {
			return array( $tax->name, '' );
		}
		if ( 0 === strpos( $key, $prefix . '-' ) ) {
			return array( $tax->name, substr( $key, strlen( $prefix ) + 1 ) );
		}
	}
	return null;
}

/**
 * The first rule, in the order they are listed, that covers this post through
 * one of its terms. Only rules with "apply to posts" take part.
 */
function willow_scroll_match_post_term_rule( $post_id ) {
	foreach ( willow_scroll_get_templates_overrides() as $key => $rule ) {
		if ( empty( $rule['posts'] ) ) {
			continue;
		}
		$target = willow_scroll_term_rule_target( $key );
		if ( ! $target ) {
			continue;
		}
		list( $taxonomy, $slug ) = $target;
		$terms = get_the_terms( $post_id, $taxonomy );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			continue;
		}
		if ( '' === $slug ) {
			return array( $key, $rule );
		}
		foreach ( $terms as $term ) {
			if ( $term->slug === $slug ) {
				return array( $key, $rule );
			}
		}
	}
	return array( '', null );
}
