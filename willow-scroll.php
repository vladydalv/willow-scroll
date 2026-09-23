<?php
/**
 * Plugin Name:       Willow Scroll
 * Description:       Transparent or sticky header with its own background, logo and height, set for the whole site, for a template or for a single page.
 * Version:           1.0.0
 * Author:            Vlad Zelinskyi
 * Author URI:        https://www.spacenerd.space/
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       willow-scroll
 * Requires at least: 6.6
 * Requires PHP:      7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WILLOW_SCROLL_VERSION', '1.0.0' );
define( 'WILLOW_SCROLL_DB_VERSION', 8 );
define( 'WILLOW_SCROLL_FILE', __FILE__ );
define( 'WILLOW_SCROLL_PATH', plugin_dir_path( __FILE__ ) );
define( 'WILLOW_SCROLL_URL', plugin_dir_url( __FILE__ ) );

require_once WILLOW_SCROLL_PATH . 'includes/schema.php';
require_once WILLOW_SCROLL_PATH . 'includes/upgrade.php';
require_once WILLOW_SCROLL_PATH . 'includes/detection.php';
require_once WILLOW_SCROLL_PATH . 'includes/targets.php';
require_once WILLOW_SCROLL_PATH . 'includes/settings.php';
require_once WILLOW_SCROLL_PATH . 'includes/post-meta.php';
require_once WILLOW_SCROLL_PATH . 'includes/frontend.php';

register_activation_hook( __FILE__, 'willow_scroll_activate' );

function willow_scroll_activate() {
	if ( false === get_option( 'willow_scroll_settings' ) ) {
		add_option( 'willow_scroll_settings', willow_scroll_defaults() );
		update_option( 'willow_scroll_db_version', WILLOW_SCROLL_DB_VERSION );
		return;
	}
	willow_scroll_maybe_upgrade();
}
